/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { redis } from "@/lib/db/redis";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getPeriodEnd } from "@/lib/stripe/getPeriodEnd";
import { checkRateLimitPolicy } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/http";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { deleteUserCache } from "@/lib/cache";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
    // -------------------------------------------------------------------------
    // ขั้นตอนที่ 1: ตรวจสอบ Rate Limit (ป้องกันการยิงสแปม / DoS)
    // -------------------------------------------------------------------------
    // ถ้ามี stripe-signature ให้ใช้นโยบายแบบ "webhook" (ขีดจำกัดสูงกว่า)
    // ถ้าไม่มีลายเซ็น ให้ใช้นโยบาย "webhookUnsigned" (จำกัดเข้มงวด)
    const hasSignature = Boolean(req.headers.get("stripe-signature"));
    const rateLimit = await checkRateLimitPolicy(
        req,
        hasSignature ? "webhook" : "webhookUnsigned",
    );

    if (!rateLimit.success) {
        return rateLimitResponse(rateLimit);
    }

    // ตรวจสอบว่าได้ตั้งค่า STRIPE_WEBHOOK_SECRET ใน Environment แล้วหรือไม่
    if (!env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json(
            { error: "STRIPE_WEBHOOK_SECRET is not defined" },
            { status: 500 }
        );
    }

    // -------------------------------------------------------------------------
    // ขั้นตอนที่ 2: Signature Verification (ยืนยันว่า Request มาจาก Stripe จริง)
    // -------------------------------------------------------------------------
    // ข้อควรระวัง: ต้องใช้ req.text() เพื่อดึง raw body ตัวอักษรดั้งเดิม
    // ห้ามใช้ req.json() เด็ดขาด เพราะ HMAC Signature จะ mismatch ทันที
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err: any) {
        // หากลายเซ็นไม่ถูกต้อง ให้ตอบกลับ 400 ทันที
        // Stripe จะไม่ Retry สำหรับ Request ที่ Signature ผิดพลาด (ช่วยหยุด Request ปลอม)
        logger.error({ err }, "Webhook signature verification failed");
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    // -------------------------------------------------------------------------
    // ขั้นตอนที่ 3: Atomic Idempotency Lock (ป้องกัน Race Condition และ Event ซ้ำ)
    // -------------------------------------------------------------------------
    const lockKey = `webhook:${event.id}`;

    // ใช้คำสั่ง SET ... NX (Set if Not Exists) เพื่อจอง Lock ทันทีในเสี้ยววินาทีเดียว
    // ป้องกันไม่ให้ Stripe ส่ง Retry มาซ้ำขณะที่ตัวแรกยังประมวลผลไม่เสร็จ (Concurrent Requests)
    // ตั้งอายุเริ่มต้นไว้ 120 วินาที (เผื่อกรณีระบบดับกลางคัน Lock จะได้ไม่ค้างถาวร)
    const acquiredLock = await redis.set(lockKey, "processing", "EX", 120, "NX");

    if (!acquiredLock) {
        // หากจองไม่สำเร็จ ให้ตรวจดูว่าทำเสร็จแล้วหรือยัง
        const status = await redis.get(lockKey);
        if (status === "done") {
            // เคยทำเสร็จสมบูรณ์ไปแล้ว -> ตอบ 200 OK ทันที เพื่อบอก Stripe ว่าได้รับแล้ว ไม่ต้องส่งมาอีก
            logger.info({ eventId: event.id, eventType: event.type }, "Duplicate webhook event ignored");
            return NextResponse.json({ received: true }, { status: 200 });
        }
        // หากสถานะยังเป็น "processing" แปลว่ากำลังประมวลผลอยู่ -> ตอบ 500 เพื่อให้ Stripe ค่อยๆ Retry มาใหม่
        return NextResponse.json({ error: "Event currently processing" }, { status: 500 });
    }

    const session = event.data.object as any;

    // -------------------------------------------------------------------------
    // ขั้นตอนที่ 4: ประมวลผล Business Logic ตามประเภทของ Event
    // -------------------------------------------------------------------------
    try {
        switch (event.type) {
            // 4.1 เมื่อลูกค้าสมัครสมาชิกและชำระเงินใน Checkout Session สำเร็จครั้งแรก
            case "checkout.session.completed": {
                const subscription = (await stripe.subscriptions.retrieve(
                    session.subscription as string
                )) as any;

                if (!session?.metadata?.userId) {
                    return NextResponse.json({ error: "User ID not found in metadata" }, { status: 400 });
                }

                // อัปเดตข้อมูล Subscription ให้เป็นสถานะ PRO และ ACTIVE
                await prisma.subscription.update({
                    where: { userId: Number(session.metadata.userId) },
                    data: {
                        stripeCustomerId: session.customer as string,
                        plan: "PRO",
                        status: "ACTIVE",
                        startAt: new Date(session.created * 1000),
                        endAt: getPeriodEnd(subscription),
                    },
                });

                // ล้าง Cache ของผู้ใช้เพื่อให้หน้าเว็บดึงข้อมูล Subscription ใหม่อัตโนมัติ
                await deleteUserCache(Number(session.metadata.userId));
                logger.info({ userId: session.metadata.userId }, "Cleared cache after subscription update");

                break;
            }

            // 4.2 เมื่อการตัดเงินรอบต่ออายุสำเร็จ (Recurring Payment Succeeded)
            case "invoice.payment_succeeded": {
                // หากไม่มี subscription id ติดมา ให้ข้าม (เช่น การจ่ายครั้งเดียวที่ไม่ใช่ subscription)
                if (!session.subscription) break;

                const subscription = (await stripe.subscriptions.retrieve(
                    session.subscription as string
                )) as any;

                const isActive = subscription.status === "active";
                const updated = await prisma.subscription.update({
                    where: { stripeCustomerId: session.customer as string },
                    data: {
                        plan: isActive ? "PRO" : "FREE",
                        status: isActive ? "ACTIVE" : "EXPIRED",
                        startAt: new Date(session.created * 1000),
                        endAt: getPeriodEnd(subscription),
                    },
                });

                // ใช้ updated.userId โดยตรงจาก Database เพื่อป้องกันปัญหา session.metadata.userId เป็น undefined (NaN)
                await deleteUserCache(updated.userId);
                logger.info({ userId: updated.userId }, "Cleared cache after subscription update");

                break;
            }

            // 4.3 เมื่อการตัดเงินรอบต่ออายุล้มเหลว (เช่น บัตรหมดอายุ หรือเงินไม่พอ)
            case "invoice.payment_failed": {
                if (!session.subscription) break;

                const subscription = (await stripe.subscriptions.retrieve(
                    session.subscription as string
                )) as any;

                const updated = await prisma.subscription.update({
                    where: { stripeCustomerId: session.customer as string },
                    data: {
                        plan: "FREE",
                        status: "EXPIRED",
                        startAt: new Date(session.created * 1000),
                        endAt: getPeriodEnd(subscription),
                    },
                });

                // ล้าง Cache ของผู้ใช้เมื่อถูกลดระดับแพ็กเกจ
                await deleteUserCache(updated.userId);
                logger.info({ userId: updated.userId }, "Cleared cache after subscription update");

                break;
            }

            // 4.4 เมื่อการสมัครสมาชิกถูกยกเลิกถาวร (Subscription Deleted)
            case "customer.subscription.deleted": {
                // ค้นหา userId ที่เกี่ยวข้องก่อนทำการอัปเดต
                const updatedSubscriptions = await prisma.subscription.findMany({
                    where: { stripeCustomerId: session.customer as string },
                    select: { userId: true },
                });

                // ปรับสถานะเป็น FREE และ CANCELLED
                await prisma.subscription.updateMany({
                    where: { stripeCustomerId: session.customer as string },
                    data: {
                        plan: "FREE",
                        status: "CANCELLED",
                    },
                });

                // ล้าง Cache สำหรับทุก User ที่ใช้ stripeCustomerId นี้
                for (const sub of updatedSubscriptions) {
                    await deleteUserCache(sub.userId);
                    logger.info({ userId: sub.userId }, "Cleared cache after subscription deletion");
                }

                break;
            }

            // 4.5 เมื่อมีการอัปเดตข้อมูล Subscription (เช่น เปลี่ยนแพ็กเกจ หรือกดยกเลิกแบบมีผลรอบบิลถัดไป)
            case "customer.subscription.updated": {
                const subscription = event.data.object as any;
                const isActive = subscription.status === "active";

                const updatedSubscriptions = await prisma.subscription.findMany({
                    where: { stripeCustomerId: subscription.customer as string },
                    select: { userId: true },
                });

                await prisma.subscription.updateMany({
                    where: { stripeCustomerId: subscription.customer as string },
                    data: {
                        plan: isActive ? "PRO" : "FREE",
                        status: isActive ? "ACTIVE" : (subscription.status === "canceled" ? "CANCELLED" : "EXPIRED"),
                        startAt: new Date(subscription.created * 1000),
                        endAt: getPeriodEnd(subscription),
                    },
                });

                for (const sub of updatedSubscriptions) {
                    await deleteUserCache(sub.userId);
                    logger.info({ userId: sub.userId }, "Cleared cache after subscription update");
                }

                break;
            }

            default:
                // Event ประเภทอื่นๆ ที่เราไม่ได้จัดการ ให้ Log ไว้เฉยๆ แล้วตอบ 200 OK ผ่านไปได้เลย
                logger.info({ eventId: event.id, eventType: event.type }, "Unhandled webhook event type");
        }

        // ---------------------------------------------------------------------
        // ขั้นตอนที่ 5: บันทึกสถานะว่าประมวลผลเสร็จแล้ว ("done") ใน Redis
        // ---------------------------------------------------------------------
        // ตั้งอายุ 24 ชั่วโมง (Stripe ปกติจะ Retry ไม่เกิน 3 วัน) เพื่อป้องกัน Event ซ้ำ
        await redis.set(lockKey, "done", "EX", 60 * 60 * 24);
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error) {
        logger.error({ err: error, eventId: event.id, eventType: event.type }, "Webhook handler failed");

        // ---------------------------------------------------------------------
        // ขั้นตอนที่ 6: จัดการความผิดพลาด (Retry Handling)
        // ---------------------------------------------------------------------
        // หากเกิด Error (เช่น DB ล่มชั่วคราว) ให้ปลด Lock ทันที
        // เพื่อให้ตอนที่ Stripe ทำการ Retry ส่งมาใหม่ ระบบจะสามารถหยิบไปทำใหม่ได้โดยไม่ต้องรอ Lock หมดอายุ
        await redis.del(lockKey);

        // ตอบ 500 กลับไป เพื่อส่งสัญญาณบอกให้ Stripe ทำ Exponential Backoff Retry ส่งซ้ำมาใหม่
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
}
