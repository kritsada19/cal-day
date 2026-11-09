/*
  Warnings:

  - A unique constraint covering the columns `[userId,date]` on the table `DailySummary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_userId_date_key" ON "DailySummary"("userId", "date");

-- CreateIndex
CREATE INDEX "Meal_userId_createdAt_idx" ON "Meal"("userId", "createdAt");
