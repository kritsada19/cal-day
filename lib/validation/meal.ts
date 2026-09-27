import { z } from "zod";

export const mealSchema = z.object({
    mealText: z.string().min(1, "Please describe the food you ate"),
    mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
});

export type MealInput = z.infer<typeof mealSchema>;

export const imageMealSchema = z.object({
    base64Data: z.string().min(1, "Please provide an image"),
    mimeType: z.string().min(1, "Mime type is required"),
    mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
});

export type ImageMealInput = z.infer<typeof imageMealSchema>;
