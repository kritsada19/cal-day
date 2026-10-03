import { Worker } from "bullmq";
import { redis } from "@/lib/queue/connection";

import {
    analyzeFood,
    analyzeFoodImage,
    type FoodItem,
} from "@/lib/services/ai";

import {
    type NewFoodEntry,
    mealRepository,
} from "@/lib/repositories/meal.repository";

import { deleteUserCache } from "@/lib/cache";
import { publishMealEvent } from "@/lib/realtime/publisher";

const worker = new Worker(
    "ai-analysis",

    async job => {
        console.log(`[AI Worker] Processing job ${job.id}`);
        console.log(`[AI Worker] Job name: ${job.name}`);
        console.log(`[AI Worker] Data:`, job.data);

        // =====================================================
        // TEXT ANALYSIS
        // =====================================================
        if (job.name === "ai-analysis") {
            const {
                userId,
                unknownMenuItems,
                matchedFoods,
                mealType,
                startOfDay,
                endOfDay,
                mealText,
            } = job.data;

            // ---------------------------------------------
            // 1. วิเคราะห์เมนูที่ไม่มีใน DB
            // ---------------------------------------------
            let aiAnalysis = null;

            if (
                unknownMenuItems &&
                unknownMenuItems.length !== 0
            ) {
                aiAnalysis = await analyzeFood(
                    unknownMenuItems.join(", ")
                );

                if (!aiAnalysis) {
                    throw new Error(
                        "Failed to analyze food"
                    );
                }
            }

            // ---------------------------------------------
            // 2. เตรียม Food Entries
            // ---------------------------------------------
            const foodEntries: NewFoodEntry[] = [
                // อาหารที่มีอยู่แล้วใน DB
                ...matchedFoods.map(
                    (food: NewFoodEntry) => ({
                        foodName: food.foodName,
                        amount: food.amount || 1,
                        unit: food.unit || "serving",
                        calories: food.calories || 0,
                        protein: food.protein || 0,
                    })
                ),

                // อาหารใหม่จาก AI
                ...(aiAnalysis?.foods ?? []).map(
                    (food: FoodItem) => ({
                        foodName: food.name,
                        amount: food.amount || 1,
                        unit: food.unit || "serving",
                        calories: food.calories || 0,
                        protein: food.protein || 0,
                    })
                ),
            ];

            // ---------------------------------------------
            // 3. คำนวณ Calories / Protein
            // ---------------------------------------------
            const totalCalories =
                foodEntries.length > 0
                    ? foodEntries.reduce(
                        (sum, food) =>
                            sum + food.calories,
                        0
                    )
                    : aiAnalysis?.estimatedCalories ?? 0;

            const totalProtein =
                foodEntries.length > 0
                    ? foodEntries.reduce(
                        (sum, food) =>
                            sum + food.protein,
                        0
                    )
                    : aiAnalysis?.estimatedProtein ?? 0;

            // ---------------------------------------------
            // 4. บันทึก Meal
            // ---------------------------------------------
            await mealRepository.createMealWithEntries({
                userId: Number(userId),
                mealType,
                startOfDay: new Date(startOfDay),
                endOfDay: new Date(endOfDay),

                foodEntries,

                fallbackFoodName: mealText,
                fallbackCalories:
                    aiAnalysis?.estimatedCalories ?? 0,
                fallbackProtein:
                    aiAnalysis?.estimatedProtein ?? 0,

                totalCalories,
                totalProtein,
            });

            // ---------------------------------------------
            // 5. ล้าง Cache
            // ---------------------------------------------
            await deleteUserCache(Number(userId));

            // ---------------------------------------------
            // 6. แจ้ง Frontend ผ่าน SSE
            // ---------------------------------------------
            await publishMealEvent({
                type: "meal.created",
                userId: String(userId),
            });

            return {
                jobId: job.id,
            };
        }

        // =====================================================
        // IMAGE ANALYSIS
        // =====================================================
        if (job.name === "ai-analysis-image") {
            const {
                userId,
                base64Data,
                mimeType,
                mealType,
                startOfDay,
                endOfDay,
            } = job.data;

            // ---------------------------------------------
            // 1. วิเคราะห์รูปด้วย AI
            // ---------------------------------------------
            const aiAnalysis = await analyzeFoodImage(
                base64Data,
                mimeType
            );

            if (!aiAnalysis) {
                throw new Error(
                    "Failed to analyze food image"
                );
            }

            // ---------------------------------------------
            // 2. เตรียม Food Entries
            // ---------------------------------------------
            const foodEntries: NewFoodEntry[] = (
                aiAnalysis.foods ?? []
            ).map((food: FoodItem) => ({
                foodName: food.name,
                amount: food.amount || 1,
                unit: food.unit || "serving",
                calories: food.calories || 0,
                protein: food.protein || 0,
            }));

            // ---------------------------------------------
            // 3. คำนวณ Calories / Protein
            // ---------------------------------------------
            const totalCalories =
                foodEntries.length > 0
                    ? foodEntries.reduce(
                        (sum, food) =>
                            sum + food.calories,
                        0
                    )
                    : aiAnalysis.estimatedCalories ?? 0;

            const totalProtein =
                foodEntries.length > 0
                    ? foodEntries.reduce(
                        (sum, food) =>
                            sum + food.protein,
                        0
                    )
                    : aiAnalysis.estimatedProtein ?? 0;

            // ---------------------------------------------
            // 4. บันทึก Meal
            // ---------------------------------------------
            await mealRepository.createMealWithEntries({
                userId: Number(userId),
                mealType,
                startOfDay: new Date(startOfDay),
                endOfDay: new Date(endOfDay),

                foodEntries,

                fallbackFoodName:
                    foodEntries
                        .map(food => food.foodName)
                        .join(", ") || "Image meal",

                fallbackCalories:
                    aiAnalysis.estimatedCalories ?? 0,

                fallbackProtein:
                    aiAnalysis.estimatedProtein ?? 0,

                totalCalories,
                totalProtein,
            });

            // ---------------------------------------------
            // 5. ล้าง Cache
            // ---------------------------------------------
            await deleteUserCache(Number(userId));

            // ---------------------------------------------
            // 6. แจ้ง Frontend ผ่าน SSE
            // ---------------------------------------------
            await publishMealEvent({
                type: "meal.created",
                userId: String(userId),
            });

            return {
                jobId: job.id,
            };
        }

        // =====================================================
        // UNKNOWN JOB
        // =====================================================

        throw new Error(
            `Unknown job type: ${job.name}`
        );
    },

    {
        connection: redis,
        concurrency: 2,
    }
);

// =====================================================
// COMPLETED
// =====================================================

worker.on("completed", (job, result) => {
    console.log(
        `[AI Worker] Job ${job.id} completed`
    );

    console.log(
        `[AI Worker] Result:`,
        result
    );
});

// =====================================================
// FAILED
// =====================================================

worker.on("failed", async (job, error) => {
    console.log(`[AI Worker] Job ${job?.id} failed`);
    console.log(`[AI Worker] Error:`, error);

    if (!job) return;

    const maxAttempts = job.opts.attempts ?? 1;

    if (job.attemptsMade < maxAttempts) {
        return;
    }

    await publishMealEvent({
        type: "meal.failed",
        userId: String(job.data.userId),
        jobId: String(job.id),
    });
});

// =====================================================
// WORKER START
// =====================================================

console.log("✅ AI Worker is running!");