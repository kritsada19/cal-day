import type Stripe from "stripe";

/**
 * คำนวณหาวันที่สิ้นสุดรอบบิลปัจจุบันของการสมัครสมาชิก (Subscription)
 *
 * @param subscription - Object ข้อมูล Subscription จาก Stripe
 * @returns Date object ที่แสดงถึงวันที่สิ้นสุดรอบบิล
 */
function getPeriodEnd(subscription: Stripe.Subscription): Date {
    // Stripe API เวอร์ชันใหม่ย้าย current_period_end ไปอยู่ระดับ item
    // เช็คทั้งสองที่เผื่อ pin API version คนละแบบ
    const itemPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
    const topLevelPeriodEnd = (subscription as unknown as { current_period_end?: number })
        .current_period_end;

    const periodEnd = itemPeriodEnd ?? topLevelPeriodEnd;
    if (periodEnd) {
        return new Date(periodEnd * 1000);
    }

    // Fallback: คำนวณจาก billing_cycle_anchor และรอบเวลา (interval)
    const anchor = subscription.billing_cycle_anchor;
    const price = subscription.items?.data?.[0]?.price;
    const interval = price?.recurring?.interval;
    const count = price?.recurring?.interval_count ?? 1;

    if (!anchor || !interval) {
        throw new Error(
            `getPeriodEnd: ไม่สามารถคำนวณวันสิ้นสุดรอบบิลได้ (subscription: ${subscription.id})`
        );
    }

    const date = new Date(anchor * 1000);

    if (interval === "month") {
        date.setMonth(date.getMonth() + count);
    } else if (interval === "year") {
        date.setFullYear(date.getFullYear() + count);
    } else if (interval === "week") {
        date.setDate(date.getDate() + 7 * count);
    } else if (interval === "day") {
        date.setDate(date.getDate() + count);
    }

    return date;
}

export { getPeriodEnd };