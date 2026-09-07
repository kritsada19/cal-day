"use client";

import { useState } from "react";
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
  const [isSaving, setIsSaving] = useState(false);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const now = new Date();

      const localDateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const response = await axios.post("/api/meals", {
        mealType,
        mealText,

        // ใช้เวลาจาก client เพื่อให้ Timezone ตรงกับที่ user อยู่
        date: localDateString
      });

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

          <label className="block space-y-2 text-sm text-obsidian-950/70 dark:text-white/70">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-obsidian-950/45 dark:text-white/45">Food description</span>
            <textarea
              value={mealText}
              onChange={(event) => setMealText(event.target.value)}
              rows={6}
              placeholder="e.g. Rice 250g, grilled chicken 200g, fruit 1 serving"
              className="w-full border border-black/10 dark:border-white/10 bg-white dark:bg-obsidian-950 text-obsidian-950 dark:text-white px-3 py-3 outline-none transition focus:border-gold-accent placeholder:text-obsidian-950/30 dark:placeholder:text-white/30"
              required
            />
            <span className="block text-xs text-obsidian-950/55 dark:text-white/60">
              Add multiple items by separating them with a comma, for example: rice, grilled chicken, orange
            </span>
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center border border-gold-accent/40 bg-gold-accent/10 px-4 py-3 text-[10px] font-semibold tracking-[0.25em] text-gold-accent transition-all duration-300 hover:bg-gold-accent/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save meal"}
          </button>
        </form>
      </div>
    </div>
  );
}
