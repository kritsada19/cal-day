import { describe, it, expect } from "vitest";
import { mealSchema } from "../meal";

describe("mealSchema", () => {
    it("accepts a valid meal payload", () => {
        const payload = {
            mealText: "I ate a sandwich and a drink",
            mealType: "LUNCH",
            date: "2022-01-01"
        };

        const result = mealSchema.safeParse(payload);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(payload);
        }
    });

    it("rejects payload with invalid date", () => {
        const payload = {
            mealText: "I ate a sandwich and a drink",
            mealType: "LUNCH",
            date: "invalid-date"
        };

        const result = mealSchema.safeParse(payload);

        expect(result.success).toBe(false);
    });

    it("rejects payload with invalid meal type", () => {
        const payload = {
            mealText: "I ate a sandwich and a drink",
            mealType: "INVALID",
            date: "2022-01-01"
        };

        const result = mealSchema.safeParse(payload);

        expect(result.success).toBe(false);
    });

    it("rejects payload with empty meal text", () => {
        const payload = {
            mealText: "",
            mealType: "LUNCH",
            date: "2022-01-01"
        };

        const result = mealSchema.safeParse(payload);

        expect(result.success).toBe(false);
    });

    it("rejects payload with missing meal text", () => {
        const payload = {
            mealType: "LUNCH",
            date: "2022-01-01"
        };

        const result = mealSchema.safeParse(payload);

        expect(result.success).toBe(false);
    });

    it("rejects payload with missing meal type", () => {
        const payload = {
            mealText: "I ate a sandwich and a drink",
            date: "2022-01-01"
        };

        const result = mealSchema.safeParse(payload);

        expect(result.success).toBe(false);
    });

});