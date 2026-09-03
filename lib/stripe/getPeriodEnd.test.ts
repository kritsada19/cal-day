import { describe, expect, it } from "vitest";
import { getPeriodEnd } from "./getPeriodEnd";
import type Stripe from "stripe";

describe("getPeriodEnd", () => {
    it("returns correct period end from item level current_period_end", () => {
        const subscription = {
            items: {
                data: [
                    { current_period_end: 1738886400 }
                ]
            }
        } as unknown as Stripe.Subscription;
        expect(getPeriodEnd(subscription)).toEqual(new Date(1738886400000));
    });

    it("returns correct period end from top level current_period_end", () => {
        const subscription = {
            current_period_end: 1738886400
        } as unknown as Stripe.Subscription;
        expect(getPeriodEnd(subscription)).toEqual(new Date(1738886400000));
    });

    it("calculates fallback period end for monthly subscription", () => {
        const anchor = new Date("2024-01-01T12:00:00Z").getTime() / 1000;
        const subscription = {
            id: "sub_123",
            billing_cycle_anchor: anchor,
            items: {
                data: [
                    {
                        price: {
                            recurring: {
                                interval: "month",
                                interval_count: 1,
                            }
                        }
                    }
                ]
            }
        } as unknown as Stripe.Subscription;
        // 1 month later
        const expectedDate = new Date("2024-02-01T12:00:00Z");
        expect(getPeriodEnd(subscription)).toEqual(expectedDate);
    });

    it("calculates fallback period end for yearly subscription", () => {
        const anchor = new Date("2024-01-01T12:00:00Z").getTime() / 1000;
        const subscription = {
            id: "sub_123",
            billing_cycle_anchor: anchor,
            items: {
                data: [
                    {
                        price: {
                            recurring: {
                                interval: "year",
                                interval_count: 1,
                            }
                        }
                    }
                ]
            }
        } as unknown as Stripe.Subscription;
        const expectedDate = new Date("2025-01-01T12:00:00Z");
        expect(getPeriodEnd(subscription)).toEqual(expectedDate);
    });

    it("calculates fallback period end for weekly subscription", () => {
        const anchor = new Date("2024-01-01T12:00:00Z").getTime() / 1000;
        const subscription = {
            id: "sub_123",
            billing_cycle_anchor: anchor,
            items: {
                data: [
                    {
                        price: {
                            recurring: {
                                interval: "week",
                                interval_count: 2,
                            }
                        }
                    }
                ]
            }
        } as unknown as Stripe.Subscription;
        // 14 days later
        const expectedDate = new Date("2024-01-15T12:00:00Z");
        expect(getPeriodEnd(subscription)).toEqual(expectedDate);
    });

    it("calculates fallback period end for daily subscription", () => {
        const anchor = new Date("2024-01-01T12:00:00Z").getTime() / 1000;
        const subscription = {
            id: "sub_123",
            billing_cycle_anchor: anchor,
            items: {
                data: [
                    {
                        price: {
                            recurring: {
                                interval: "day",
                                interval_count: 5,
                            }
                        }
                    }
                ]
            }
        } as unknown as Stripe.Subscription;
        // 5 days later
        const expectedDate = new Date("2024-01-06T12:00:00Z");
        expect(getPeriodEnd(subscription)).toEqual(expectedDate);
    });

    it("throws an error if fallback calculation is not possible", () => {
        const subscription = {
            id: "sub_123",
            billing_cycle_anchor: undefined,
        } as unknown as Stripe.Subscription;
        expect(() => getPeriodEnd(subscription)).toThrowError(
            "getPeriodEnd: ไม่สามารถคำนวณวันสิ้นสุดรอบบิลได้ (subscription: sub_123)"
        );
    });
});