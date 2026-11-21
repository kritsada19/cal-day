import { z } from "zod";

export const mealSchema = z.object({
    mealText: z.string().min(1, "Please describe the food you ate"),
    mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
    isFav: z.boolean().optional(),
});

export type MealInput = z.infer<typeof mealSchema>;

export const imageMealSchema = z.object({
    base64Data: z.string().min(1, "Please provide an image"),
    mimeType: z.string().min(1, "Mime type is required"),
    mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
    isFav: z.boolean().optional(),
});

export type ImageMealInput = z.infer<typeof imageMealSchema>;

export const favoriteMealCreateSchema = z.object({
    favoriteId: z.number().int().positive(),
    mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
});

export type FavoriteMealCreateInput = z.infer<typeof favoriteMealCreateSchema>;

export const favoriteMealUpdateSchema = z.object({
    amount: z.number().positive("Amount must be greater than 0"),
    unit: z.string().trim().min(1, "Unit is required"),
});

export type FavoriteMealUpdateInput = z.infer<typeof favoriteMealUpdateSchema>;
