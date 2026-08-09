// eslint-disable-next-line @typescript-eslint/no-explicit-any
/**
 * คำนวณหาวันที่สิ้นสุดรอบบิลปัจจุบันของการสมัครสมาชิก (Subscription)
 * 
 * @param subscription - Object ข้อมูล Subscription จาก Stripe
 * @returns Date object ที่แสดงถึงวันที่สิ้นสุดรอบบิล
 */
function getPeriodEnd(subscription: any) {
    // ถ้าระบุ current_period_end มาให้แล้ว (timestamp หน่วยเป็นวินาที)
    if (subscription.current_period_end) {
        return new Date(subscription.current_period_end * 1000);
    }

    // ถ้าไม่มี ให้คำนวณจาก billing_cycle_anchor และรอบเวลา (interval)
    const anchor = subscription.billing_cycle_anchor;
    const interval = subscription.plan?.interval;
    const count = subscription.plan?.interval_count ?? 1;

    // แปลง anchor timestamp (วินาที) เป็น Date object
    const date = new Date(anchor * 1000);

    // บวกเวลาเพิ่มตามรอบบิล
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
