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

export default function MealCalendar() {
    // สร้าง state สำหรับเก็บวันที่ปัจจุบัน และ ข้อมูลสรุปรายเดือน
    const [currentDate, setCurrentDate] = useState(new Date());
    // State สำหรับเก็บข้อมูลที่ดึงมาจาก Database (ที่เคยทำ API /api/meals ไว้)
    const [summaries, setSummaries] = useState<DailySummary[]>([]);
    const [deletingMealId, setDeletingMealId] = useState<number | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

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

    const handleDeleteMeal = async (mealId: number) => {
        if (!window.confirm("Delete this meal? This action cannot be undone.")) {
            return;
        }

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

    return (
        <div className="mt-10 relative overflow-hidden border border-black/10 dark:border-white/10 bg-[#f8f6f1] dark:bg-obsidian-900 p-6 shadow-glow-gold md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.05),transparent_45%)] pointer-events-none dark:block hidden" />

            {/* ขอบมุมตกแต่ง (สไตล์เดียวกับโปรเจกต์คุณ) */}
            <span className="absolute -top-px -left-px h-3 w-3 border-l border-t border-gold-accent" />
            <span className="absolute -top-px -right-px h-3 w-3 border-r border-t border-gold-accent" />
            <span className="absolute -bottom-px -left-px h-3 w-3 border-b border-l border-gold-accent" />
            <span className="absolute -bottom-px -right-px h-3 w-3 border-b border-r border-gold-accent" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] tracking-[0.35em] text-gold-accent font-mono uppercase">
                        History
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[0.18em] text-obsidian-950 dark:text-white">
                        Daily Meals Calendar
                    </h2>
                </div>
            </div>

            <div className="rounded border border-black/10 dark:border-white/10 bg-white/70 dark:bg-obsidian-950/60 p-10 text-center text-obsidian-950/50 dark:text-white/50">
                {/* แถบหัวตารางและปุ่มเปลี่ยนเดือน */}
                <div className="mb-4 flex items-center justify-between px-2">
                    <button
                        onClick={handlePrevMonth}
                        className="text-xs font-mono uppercase tracking-wider text-obsidian-950/40 dark:text-white/40 hover:text-obsidian-950/80 dark:hover:text-white/80 transition-colors px-2 py-1 border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 rounded"
                    >
                        &larr; Prev
                    </button>

                    <span className="text-sm font-semibold tracking-widest text-gold-accent uppercase">
                        {currentDate.toLocaleString("en-US", { month: "long" })} {currentDate.getFullYear()}
                    </span>

                    <button
                        onClick={handleNextMonth}
                        className="text-xs font-mono uppercase tracking-wider text-obsidian-950/40 dark:text-white/40 hover:text-obsidian-950/80 dark:hover:text-white/80 transition-colors px-2 py-1 border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 rounded"
                    >
                        Next &rarr;
                    </button>
                </div>


                {/* Grid ปฏิทิน (แบ่ง 7 คอลัมน์) */}
                <div className="grid grid-cols-7 gap-1 text-center text-sm">

                    {/* 1. หัวตาราง วันอาทิตย์ - เสาร์ */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="py-2 text-obsidian-950/40 dark:text-white/40 font-mono text-[10px] uppercase tracking-wider">
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

                        return (
                            <button
                                key={dayNumber}
                                onClick={() => handleDayClick(dayNumber)}
                                // -- ปรับแก้ className ตรงนี้ เพื่อเพิ่มสีของ isToday --
                                className={`flex flex-col items-center justify-center min-h-16 p-1 border rounded transition-colors 
                                            ${selectedDate?.getDate() === dayNumber
                                        ? "bg-black/10 dark:bg-white/20 border-black/20 dark:border-white/40" // สีตอนถูกคลิกเลือก
                                        : isToday
                                            ? "border-emerald-accent/50 bg-emerald-accent/10 text-emerald-accent" // สีพิเศษสำหรับ "วันนี้"
                                            : "border-black/5 dark:border-white/5 bg-white dark:bg-obsidian-950/40 hover:bg-black/5 dark:hover:bg-white/10 text-obsidian-950/80 dark:text-white/80" // สีปกติ
                                    }`}
                            >
                                <span className={isToday ? "font-bold" : ""}>{dayNumber}</span>

                                {/* ถ้าวันนั้นมีการกินอาหาร ให้โชว์จุดและแคลอรี่รวม */}
                                {daySummary && (
                                    <div className="mt-1 flex flex-col items-center">
                                        <span className="h-1 w-1 rounded-full bg-gold-accent mb-1"></span>
                                        <span className="text-[9px] font-mono text-gold-accent">
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
                <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 text-left">
                    <h3 className="text-sm font-semibold tracking-widest text-gold-accent uppercase mb-4">
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
                            <div className="mb-6 grid grid-cols-2 gap-4">
                                <div className="rounded border border-gold-accent/20 bg-white dark:bg-obsidian-950/70 p-4">
                                    <p className="text-[9px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Total Calories</p>
                                    <p className="mt-1 text-lg font-semibold text-gold-accent">
                                        {selectedDaySummary.totalCalories} <span className="text-xs text-obsidian-950/50 dark:text-white/50">kcal</span>
                                    </p>
                                    {selectedDaySummary.targetCalories > 0 && (
                                        <p className="mt-1 text-[10px] text-obsidian-950/40 dark:text-white/40">
                                            Target: {selectedDaySummary.targetCalories} kcal
                                        </p>
                                    )}
                                </div>
                                <div className="rounded border border-emerald-accent/20 bg-white dark:bg-obsidian-950/70 p-4">
                                    <p className="text-[9px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Total Protein</p>
                                    <p className="mt-1 text-lg font-semibold text-emerald-accent">
                                        {selectedDaySummary.totalProtein} <span className="text-xs text-obsidian-950/50 dark:text-white/50">g</span>
                                    </p>
                                    {selectedDaySummary.targetProtein > 0 && (
                                        <p className="mt-1 text-[10px] text-obsidian-950/40 dark:text-white/40">
                                            Target: {selectedDaySummary.targetProtein} g
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {isLoadingDaily ? (
                        <p className="text-sm text-obsidian-950/50 dark:text-white/50">Loading meals...</p>
                    ) : dailyMeals.length === 0 ? (
                        <p className="text-sm text-obsidian-950/50 dark:text-white/50">No meals recorded for this day.</p>
                    ) : (
                        <div className="space-y-4">
                            {deleteError && (
                                <p role="alert" className="text-sm text-red-300">{deleteError}</p>
                            )}
                            {dailyMeals.map((meal) => (
                                <div key={meal.id} className="bg-white dark:bg-obsidian-950/50 border border-black/5 dark:border-white/5 p-4 rounded">
                                    <div className="mb-2 flex items-center justify-between gap-4">
                                        <p className="text-xs font-mono text-obsidian-950/40 dark:text-white/40 uppercase">
                                            {meal.mealType}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteMeal(meal.id)}
                                            disabled={deletingMealId === meal.id}
                                            className="rounded border border-red-400/30 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-red-500 dark:text-red-300 transition-colors hover:border-red-300 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {deletingMealId === meal.id ? "Deleting..." : "Delete"}
                                        </button>
                                    </div>

                                    {/* วนลูปแสดงอาหารแต่ละอย่างในมื้อนั้น */}
                                    {meal.foodEntries.map((food) => (
                                        <div key={food.id} className="flex justify-between items-center text-sm text-obsidian-950/80 dark:text-white/80 mt-1">
                                            <span>{food.foodName}</span>
                                            <div className="flex gap-4 text-xs font-mono">
                                                <span className="text-gold-accent">{food.calories} kcal</span>
                                                <span className="text-emerald-accent">{food.protein}g protein</span>
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
    );
}
