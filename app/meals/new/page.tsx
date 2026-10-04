"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";

export default function NewMealPage() {
  const router = useRouter();
  const { status } = useSession();
  const [mealType, setMealType] = useState("BREAKFAST");
  const [mealText, setMealText] = useState("");
  const [mode, setMode] = useState<"text" | "image">("text");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * State เก็บชื่ออาหาร 3 รายการล่าสุดของ user
   * เริ่มต้นเป็น array ว่าง จะถูกเติมเมื่อ useEffect ทำงานสำเร็จ
   */
  const [recentMeals, setRecentMeals] = useState<string[]>([]);

  /**
   * ดึง 3 เมนูล่าสุดจาก API เมื่อ component mount
   * ทำครั้งเดียว (dependency array = []) เพราะข้อมูลนี้ไม่เปลี่ยนระหว่างที่หน้าเปิดอยู่
   * ถ้า API error ก็แค่ไม่แสดง chip (ไม่ต้อง toast ให้รบกวน user)
   */
  useEffect(() => {
    if (status !== "authenticated") return; // รอให้ล็อกอินก่อนค่อยดึง

    axios
      .get<{ recentMeals: string[] }>("/api/meals/recent")
      .then((res) => setRecentMeals(res.data.recentMeals))
      .catch(() => {
        // ไม่แสดง error — shortcut เป็นแค่ฟีเจอร์เสริม ถ้าดึงไม่ได้ก็ซ่อนไปเฉย ๆ
      });
  }, [status]); // re-run ถ้า auth status เปลี่ยน (เช่น ล็อกอินสำเร็จหลัง mount)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const now = new Date();

      const localDateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      let response;
      
      if (mode === "text") {
        response = await axios.post("/api/meals", {
          mealType,
          mealText,
          date: localDateString
        });
      } else {
        if (!imagePreview || !imageFile) {
          toast.error("Please provide an image");
          setIsSaving(false);
          return;
        }
        const base64Data = imagePreview.split(",")[1];
        const mimeType = imageFile.type;
        
        response = await axios.post("/api/meals/image", {
          mealType,
          base64Data,
          mimeType,
          date: localDateString
        });
      }

      // ไม่ต้องเช็ค response.data.ok เพราะ axios จะ throw error อัตโนมัติถ้า status ไม่ใช่ 2xx
      // Toast remains visible while the page redirects, unlike an inline success message.
      toast.success(response.data.message || "Meal saved successfully");
      setTimeout(() => router.push("/dashboard"), 900);
    } catch (error) {
      let errorMessage = "Unable to save your meal";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-[#f8f6f1] dark:bg-obsidian-950 px-4 py-10">
        <p className="text-sm uppercase tracking-[0.35em] text-obsidian-950/60 dark:text-white/60">Loading...</p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-[#f8f6f1] dark:bg-obsidian-950 px-4 py-10">
        <div className="w-full max-w-md rounded border border-black/10 dark:border-white/10 bg-white/80 dark:bg-obsidian-900 p-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold-accent">Access required</p>
          <h1 className="mt-3 text-2xl font-semibold text-obsidian-950 dark:text-white">Please sign in first</h1>
          <p className="mt-3 text-sm text-obsidian-950/60 dark:text-white/60">You need to log in before adding a meal.</p>
          <Link href="/signin" className="mt-6 inline-flex w-full items-center justify-center border border-gold-accent/40 bg-black/5 dark:bg-obsidian-950 px-4 py-3 text-[10px] font-semibold tracking-[0.25em] text-gold-accent transition-all duration-300 hover:bg-gold-accent/10 hover:text-obsidian-950 dark:hover:text-white">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex-1 px-4 py-10 md:py-16 bg-[#f8f6f1] dark:bg-obsidian-950">
      <div className="mx-auto max-w-3xl rounded border border-black/10 dark:border-white/10 bg-white/80 dark:bg-obsidian-900 p-6 shadow-glow-gold md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-gold-accent">Add meal</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[0.2em] text-obsidian-950 dark:text-white">Record your meal</h1>
          </div>
          <Link href="/dashboard" className="inline-flex items-center justify-center border border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950 px-4 py-2 text-[10px] font-semibold tracking-[0.25em] text-obsidian-950/70 dark:text-white/70 transition-all duration-300 hover:border-gold-accent/50 hover:text-gold-accent">
            Back to dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block space-y-2 text-sm text-obsidian-950/70 dark:text-white/70">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-obsidian-950/45 dark:text-white/45">Meal type</span>
            <select
              value={mealType}
              onChange={(event) => setMealType(event.target.value)}
              className="w-full border border-black/10 dark:border-white/10 bg-white dark:bg-obsidian-950 text-obsidian-950 dark:text-white px-3 py-3 outline-none transition focus:border-gold-accent"
            >
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
              <option value="SNACK">Snack</option>
            </select>
          </label>

          <div className="flex gap-4 border-b border-black/10 dark:border-white/10 pb-2">
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`text-xs font-semibold tracking-wider px-2 py-1 transition-colors ${mode === "text" ? "text-gold-accent border-b-2 border-gold-accent" : "text-obsidian-950/50 dark:text-white/50"}`}
            >
              TEXT
            </button>
            <button
              type="button"
              onClick={() => setMode("image")}
              className={`text-xs font-semibold tracking-wider px-2 py-1 transition-colors ${mode === "image" ? "text-gold-accent border-b-2 border-gold-accent" : "text-obsidian-950/50 dark:text-white/50"}`}
            >
              IMAGE (AI)
            </button>
          </div>

          {mode === "text" ? (
            <label className="block space-y-2 text-sm text-obsidian-950/70 dark:text-white/70">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-obsidian-950/45 dark:text-white/45">Food description</span>
              <textarea
                value={mealText}
                onChange={(event) => setMealText(event.target.value)}
                rows={6}
                placeholder="e.g. Rice 250g, grilled chicken 200g, fruit 1 serving"
                className="w-full border border-black/10 dark:border-white/10 bg-white dark:bg-obsidian-950 text-obsidian-950 dark:text-white px-3 py-3 outline-none transition focus:border-gold-accent placeholder:text-obsidian-950/30 dark:placeholder:text-white/30"
                required={mode === "text"}
              />
              <span className="block text-xs text-obsidian-950/55 dark:text-white/60">
                Add multiple items by separating them with a comma, for example: rice, grilled chicken, orange
              </span>

              {/*
               * แสดง shortcut chip เฉพาะเมื่อมีข้อมูล (recentMeals.length > 0)
               * ถ้า user ยังไม่เคยบันทึกมื้ออาหารเลย section นี้จะไม่ปรากฏ
               */}
              {recentMeals.length > 0 && (
                <div className="pt-1 space-y-2">
                  {/* Label บอกให้รู้ว่าปุ่มพวกนี้คืออะไร */}
                  <span className="block text-[10px] uppercase tracking-[0.3em] text-obsidian-950/40 dark:text-white/40">
                    Recent meals
                  </span>

                  {/* Chip แต่ละอัน = เมนูล่าสุด 1 รายการ */}
                  <div className="flex flex-wrap gap-2">
                    {recentMeals.map((meal) => (
                      <button
                        key={meal}
                        type="button"
                        /*
                         * กดแล้วเติมชื่ออาหารเข้า textarea
                         * - ถ้า textarea ว่างอยู่ → ใส่ชื่อตรง ๆ
                         * - ถ้ามีข้อความอยู่แล้ว → ต่อท้ายด้วยคอมม่าแล้วเว้นวรรค
                         *   เพื่อให้เป็นรูปแบบที่ AI แยกรายการได้ถูกต้อง
                         */
                        onClick={() =>
                          setMealText((prev) =>
                            prev.trim() === "" ? meal : `${prev.trimEnd()}, ${meal}`
                          )
                        }
                        className="
                          px-3 py-1 text-[11px] tracking-wider font-medium
                          border border-gold-accent/30
                          text-gold-accent/80 dark:text-gold-accent/80
                          bg-gold-accent/5 dark:bg-gold-accent/5
                          hover:bg-gold-accent/15 hover:text-gold-accent hover:border-gold-accent/60
                          transition-all duration-200
                          cursor-pointer
                        "
                      >
                        {meal}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </label>

          ) : (
            <div className="space-y-4">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-obsidian-950/45 dark:text-white/45">Food Image</span>
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-black/20 dark:border-white/20 rounded cursor-pointer hover:border-gold-accent/50 bg-white/50 dark:bg-obsidian-900/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="mb-2 text-sm text-obsidian-950/60 dark:text-white/60"><span className="font-semibold">Click to upload</span> or take a photo</p>
                    <p className="text-xs text-obsidian-950/40 dark:text-white/40">JPEG, PNG, WEBP</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageChange} required={mode === "image"} />
                </label>
              ) : (
                <div className="relative w-full h-auto rounded border border-black/10 dark:border-white/10 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Food preview" className="w-full object-cover max-h-64" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full text-xs font-semibold hover:bg-black transition-colors"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
              <span className="block text-xs text-obsidian-950/55 dark:text-white/60">
                AI will estimate portions and calories based on the image. (Take a clear photo for better accuracy)
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center border border-gold-accent/40 bg-gold-accent/10 px-4 py-3 text-[10px] font-semibold tracking-[0.25em] text-gold-accent transition-all duration-300 hover:bg-gold-accent/20 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save meal"}
          </button>
        </form>
      </div>
    </div>
  );
}
