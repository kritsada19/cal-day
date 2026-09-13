import { describe, expect, it } from "vitest";
import { getUtcDayRange, getUtcMonthRange } from "../date";

describe("getUtcDayRange", () => {
    it("returns the correct day range for a given date", () => {
        const date = new Date("2026-08-26");
        const range = getUtcDayRange(date);

        expect(range.startOfDay).toEqual(new Date("2026-08-26T00:00:00.000Z"));
        expect(range.endOfDay).toEqual(new Date("2026-08-26T23:59:59.999Z"));
    });
});

describe("getUtcMonthRange", () => {
    it("returns the correct month range for a given year and month", () => {
        const year = 2026;
        const month = 8;
        const range = getUtcMonthRange(year, month);

        expect(range.start).toEqual(new Date("2026-08-01T00:00:00.000Z"));
        expect(range.end).toEqual(new Date("2026-08-31T23:59:59.999Z"));
    });
});