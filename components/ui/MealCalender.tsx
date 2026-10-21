"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { logger } from "@/lib/logger";

interface DailySummary {
    totalCalories: number
    totalProtein: number
    id: number
    userId: number
    date: Date
    targetCalories: number
    targetProtein: number
}

interface MealEntry {
    id: number;
    foodName: string;
    calories: number;
    protein: number;
    amount: number;
    unit: string;
    mealId: number;
}

interface Meal {
    id: number;
    mealType: string;
    foodEntries: MealEntry[];
}

const focusRing =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const monthButton = `inline-flex min-h-11 items-center rounded-xl bg-primary-tint px-4 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink ${focusRing}`;

export default function MealCalendar() {
    // สร้าง state สำหรับเก็บวันที่ปัจจุบัน และ ข้อมูลสรุปรายเดือน
    const [currentDate, setCurrentDate] = useState(new Date());
    // State สำหรับเก็บข้อมูลที่ดึงมาจาก Database (ที่เคยทำ API /api/meals ไว้)
    const [summaries, setSummaries] = useState<DailySummary[]>([]);
    const [deletingMealId, setDeletingMealId] = useState<number | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ mealId: number } | null>(null);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null); // เก็บว่ากำลังกดดูวันที่เท่าไหร่
    const [dailyMeals, setDailyMeals] = useState<Meal[]>([]); // เก็บรายการอาหารของวันนั้น
    const [isLoadingDaily, setIsLoadingDaily] = useState(false); // เอาไว้โชว์สถานะ Loading ตอนดึงข้อมูล

    // --- การคำนวณปฏิทิน ---
    // 1. หาวันแรกของเดือนที่กำลังดูอยู่
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    // 2. หาวันสุดท้ายของเดือน (ใส่ค่า 0 จะย้อนกลับไป 1 วัน คือวันสุดท้ายของเดือนนี้)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // 3. หามีทั้งหมดกี่วันในเดือนนี้ (เช่น 28, 30, 31)
    const daysInMonth = endOfMonth.getDate();

    // 4. หาวันแรกของเดือนตรงกับวันอะไรในสัปดาห์ (0=อาทิตย์, 1=จันทร์, ..., 6=เสาร์) 
    // เอาไว้บอกว่าวันที่ 1 ต้องไปเริ่มที่ช่องไหน
    const startingDay = startOfMonth.getDay();

    // --- การเรียก API ---
    // useEffect จะทำงานทุกครั้งที่ currentDate เปลี่ยนแปลง (เช่น ตอนกดเปลี่ยนเดือน)
    useEffect(() => {
        const year = currentDate.getFullYear();
        // getMonth() จะได้ 0-11 เราต้องบวก 1 ให้เป็น 1-12 ก่อนส่งให้ API
        const month = currentDate.getMonth() + 1;

        // เรียก API ดึงสรุปข้อมูลรายเดือน
        axios.get(`/api/meals?year=${year}&month=${month}`)
            .then((res) => {
                setSummaries(res.data.summaries || []);
            })
            .catch((err) => logger.error({ err, year, month }, "Failed to load month summaries"));
    }, [currentDate]);

    // ฟังก์ชันย้อนกลับไป 1 เดือน
    const handlePrevMonth = () => {
        // ใช้ setMonth() โดยเอาเดือนปัจจุบันลบ 1
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDate(null); // เคลียร์วันที่ที่เลือกไว้ออก เพื่อเริ่มใหม่ในเดือนใหม่
    };

    // ฟังก์ชันเดินหน้าไป 1 เดือน
    const handleNextMonth = () => {
        // ใช้ setMonth() โดยเอาเดือนปัจจุบันบวก 1
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDate(null);
    };


    // ฟังก์ชันนี้จะทำงานเมื่อเรากดที่ช่องวันที่บนปฏิทิน
    const handleDayClick = async (dayNumber: number) => {
        // 1. สร้าง Object วันที่ จากวันที่ที่เรากด
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
        setSelectedDate(clickedDate); // บันทึกว่าเรากำลังดูวันนี้อยู่
        setIsLoadingDaily(true); // เปิดโหมดโหลดข้อมูล

        try {
            // 2. แปลงวันที่ให้อยู่ในรูปแบบ YYYY-MM-DD เพื่อส่งไปให้ API
            // เนื่องจาก Javascript อาจะมีปัญหา Timezone เราจึงใช้วิธีดึงปี-เดือน-วัน ออกมาประกอบร่างเองแบบปลอดภัย
            const year = clickedDate.getFullYear();
            const month = String(clickedDate.getMonth() + 1).padStart(2, '0');
            const day = String(clickedDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            // 3. ยิง API ไปที่ /api/meals/daily ที่เราสร้างไว้ตอนแรก
            const res = await axios.get(`/api/meals/daily?date=${formattedDate}`);

            // 4. เอาข้อมูลรายการอาหารมาเก็บไว้ใน State
            setDailyMeals(res.data.meals || []);
        } catch (error) {
            logger.error({ err: error }, "Failed to load daily meals");
        } finally {
            setIsLoadingDaily(false); // ปิดโหมดโหลดข้อมูล
        }
    };

    const handleDeleteMeal = (mealId: number) => {
        setConfirmModal({ mealId });
    };

    const handleConfirmDelete = async () => {
        if (!confirmModal) return;
        const mealId = confirmModal.mealId;
        setConfirmModal(null);

        setDeletingMealId(mealId);
        setDeleteError(null);

        try {
            await axios.delete(`/api/meals/${mealId}`);
            setDailyMeals((meals) => meals.filter((meal) => meal.id !== mealId));
        } catch (error) {
            logger.error({ err: error, mealId }, "Failed to delete meal");
            setDeleteError("Unable to delete this meal. Please try again.");
        } finally {
            setDeletingMealId(null);
        }
    };

    const monthName = currentDate.toLocaleString("en-US", { month: "long" });

    return (
        <>
            {/* ── Confirm Delete Modal ── */}
            {confirmModal && (
                <div
                    className="fixed inset-0 z-60 flex items-center justify-center"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-modal-title"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setConfirmModal(null)}
                    />

                    {/* Modal Card */}
                    <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-lift sm:p-8">
                        <p className="mb-2 text-sm font-medium text-muted">Confirm action</p>
                        <h3 id="confirm-modal-title" className="mb-2 text-xl font-semibold tracking-tight text-ink">
                            Delete this meal?
                        </h3>
                        <p className="mb-8 text-base leading-7 text-muted">
                            This action cannot be undone. The meal and all its food entries will be permanently removed.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmModal(null)}
                                className={`min-h-11 cursor-pointer rounded-xl bg-primary-tint px-5 text-base font-semibold text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink ${focusRing}`}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className={`min-h-11 cursor-pointer rounded-xl bg-danger px-5 text-base font-semibold text-on-primary transition-opacity duration-200 hover:opacity-90 ${focusRing}`}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="mt-10 rounded-2xl border border-line bg-surface p-4 shadow-soft sm:p-6 md:p-8">
                <div className="mb-6">
                    <p className="text-sm font-medium text-muted">History</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                        Daily Meals Calendar
                    </h2>
                </div>

                <div>
                    {/* แถบหัวตารางและปุ่มเปลี่ยนเดือน */}
                    <div className="mb-4 flex items-center justify-between gap-2">
                        <button
                            onClick={handlePrevMonth}
                            aria-label="Previous month"
                            className={monthButton}
                        >
                            &larr; Prev
                        </button>

                        <span aria-live="polite" className="text-base font-semibold text-ink">
                            {monthName} {currentDate.getFullYear()}
                        </span>

                        <button
                            onClick={handleNextMonth}
                            aria-label="Next month"
                            className={monthButton}
                        >
                            Next &rarr;
                        </button>
                    </div>


                    {/* Grid ปฏิทิน (แบ่ง 7 คอลัมน์) */}
                    <div className="grid grid-cols-7 gap-1 text-center text-sm sm:gap-2">

                        {/* 1. หัวตาราง วันอาทิตย์ - เสาร์ */}
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                            <div key={day} className="py-2 text-xs font-medium text-muted">
                                {day}
                            </div>
                        ))}

                        {/* 2. ช่องว่างก่อนถึงวันที่ 1 (ดันให้วันที่ 1 ไปอยู่ตรงกับวันในสัปดาห์ที่ถูกต้อง) */}
                        {Array.from({ length: startingDay }).map((_, index) => (
                            <div key={`empty-${index}`} className="p-2" />
                        ))}

                        {/* 3. วนลูปวาดกล่องใส่วันที่ 1 ถึงวันสุดท้ายของเดือน */}
                        {Array.from({ length: daysInMonth }).map((_, index) => {
                            const dayNumber = index + 1;

                            // -- เพิ่มโค้ดเช็คว่าเป็น "วันนี้" หรือไม่ ตรงนี้ --
                            const realToday = new Date(); // ดึงวันที่ของวันนี้จริงๆ จากระบบ
                            const isToday =
                                dayNumber === realToday.getDate() &&
                                currentDate.getMonth() === realToday.getMonth() &&
                                currentDate.getFullYear() === realToday.getFullYear();

                            // หาว่าวันนี้มีข้อมูล summary หรือไม่
                            const daySummary = summaries.find(s => {
                                const summaryDate = new Date(s.date);
                                return summaryDate.getDate() === dayNumber;
                            });

                            const isSelected = selectedDate?.getDate() === dayNumber;

                            return (
                                <button
                                    key={dayNumber}
                                    onClick={() => handleDayClick(dayNumber)}
                                    aria-pressed={isSelected}
                                    aria-current={isToday ? "date" : undefined}
                                    aria-label={`${monthName} ${dayNumber}, ${currentDate.getFullYear()}${daySummary ? `, ${daySummary.totalCalories} kcal` : ""}`}
                                    // -- สีตามสถานะ: เลือกอยู่ > วันนี้ > ปกติ --
                                    className={`flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-xl border p-1 text-base transition-colors duration-200 ${focusRing}
                                            ${isSelected
                                            ? "border-primary bg-primary-tint text-primary ring-1 ring-primary" // สีตอนถูกคลิกเลือก
                                            : isToday
                                                ? "border-secondary bg-highlight text-ink" // สีพิเศษสำหรับ "วันนี้"
                                                : "border-line bg-surface text-ink hover:bg-primary-tint" // สีปกติ
                                        }`}
                                >
                                    <span className={isToday ? "font-bold" : "font-medium"}>{dayNumber}</span>

                                    {/* ถ้าวันนั้นมีการกินอาหาร ให้โชว์จุดและแคลอรี่รวม */}
                                    {daySummary && (
                                        <div className="mt-1 flex flex-col items-center">
                                            <span aria-hidden="true" className="mb-0.5 h-1 w-1 rounded-full bg-primary"></span>
                                            <span className="text-xs font-medium text-primary tabular-nums">
                                                {daySummary.totalCalories}
                                            </span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}

                    </div>

                </div>
                {/* --- ส่วนแสดงรายการอาหารรายวัน (จะแสดงก็ต่อเมื่อมีการกดเลือกวันที่) --- */}
                {selectedDate && (
                    <div className="mt-8 border-t border-line pt-6 text-left">
                        <h3 className="mb-4 text-lg font-semibold tracking-tight text-ink">
                            Meals on {selectedDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </h3>

                        {(() => {
                            const selectedDaySummary = summaries.find(s => {
                                const summaryDate = new Date(s.date);
                                return summaryDate.getDate() === selectedDate.getDate() &&
                                    summaryDate.getMonth() === selectedDate.getMonth() &&
                                    summaryDate.getFullYear() === selectedDate.getFullYear();
                            });

                            if (!selectedDaySummary) return null;

                            return (
                                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl border border-line bg-canvas p-4">
                                        <p className="flex items-center gap-2 text-sm font-medium text-muted">
                                            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />
                                            Total Calories
                                        </p>
                                        <p className="mt-1 text-2xl font-semibold text-ink tabular-nums">
                                            {selectedDaySummary.totalCalories} <span className="text-sm font-normal text-muted">kcal</span>
                                        </p>
                                        {selectedDaySummary.targetCalories > 0 && (
                                            <p className="mt-1 text-sm text-muted tabular-nums">
                                                Target: {selectedDaySummary.targetCalories} kcal
                                            </p>
                                        )}
                                    </div>
                                    <div className="rounded-xl border border-line bg-canvas p-4">
                                        <p className="flex items-center gap-2 text-sm font-medium text-muted">
                                            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-secondary" />
                                            Total Protein
                                        </p>
                                        <p className="mt-1 text-2xl font-semibold text-ink tabular-nums">
                                            {selectedDaySummary.totalProtein} <span className="text-sm font-normal text-muted">g</span>
                                        </p>
                                        {selectedDaySummary.targetProtein > 0 && (
                                            <p className="mt-1 text-sm text-muted tabular-nums">
                                                Target: {selectedDaySummary.targetProtein} g
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {isLoadingDaily ? (
                            <div role="status" className="space-y-3">
                                <span className="sr-only">Loading meals...</span>
                                <div className="h-20 animate-pulse rounded-xl bg-primary-tint motion-reduce:animate-none" />
                                <div className="h-20 animate-pulse rounded-xl bg-primary-tint motion-reduce:animate-none" />
                            </div>
                        ) : dailyMeals.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-line p-6 text-center text-base text-muted">
                                No meals recorded for this day.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {deleteError && (
                                    <p role="alert" className="text-sm font-medium text-danger">{deleteError}</p>
                                )}
                                {dailyMeals.map((meal) => (
                                    <div key={meal.id} className="rounded-xl border border-line bg-canvas p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <p className="text-sm font-semibold capitalize text-muted">
                                                {meal.mealType}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteMeal(meal.id)}
                                                disabled={deletingMealId === meal.id}
                                                className={`min-h-11 cursor-pointer rounded-xl px-3 text-sm font-semibold text-danger transition-colors duration-200 hover:bg-primary-tint disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                                            >
                                                {deletingMealId === meal.id ? "Deleting..." : "Delete"}
                                            </button>
                                        </div>

                                        {/* วนลูปแสดงอาหารแต่ละอย่างในมื้อนั้น */}
                                        {meal.foodEntries.map((food) => (
                                            <div key={food.id} className="mt-2 flex flex-col gap-1 text-base text-ink sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                                <span>{food.foodName}</span>
                                                <div className="flex gap-4 text-sm tabular-nums">
                                                    <span className="font-medium text-primary">{food.calories} kcal</span>
                                                    <span className="text-muted">{food.protein}g protein</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </>
    );
}