"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function NewMealPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mealType, setMealType] = useState("BREAKFAST");
  const [mealText, setMealText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessage({ text: "Please sign in to add a meal", type: "error" });
    }
  }, [status]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealType, mealText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save your meal");
      }

      setMessage({ text: data.message || "Meal saved successfully", type: "success" });
      setTimeout(() => router.push("/dashboard"), 900);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Unable to save your meal",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-obsidian-950 px-4 py-10">
        <p className="text-sm uppercase tracking-[0.35em] text-white/60">Loading...</p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-obsidian-950 px-4 py-10">
        <div className="w-full max-w-md rounded border border-white/10 bg-obsidian-900 p-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold-accent">Access required</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Please sign in first</h1>
          <p className="mt-3 text-sm text-white/60">You need to log in before adding a meal.</p>
          <Link href="/signin" className="mt-6 inline-flex w-full items-center justify-center border border-gold-accent/40 bg-obsidian-950 px-4 py-3 text-[10px] font-semibold tracking-[0.25em] text-gold-accent transition-all duration-300 hover:bg-gold-accent/10 hover:text-white">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex-1 px-4 py-10 md:py-16 bg-obsidian-950">
      <div className="mx-auto max-w-3xl rounded border border-white/10 bg-obsidian-900 p-6 shadow-glow-gold md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-gold-accent">Add meal</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[0.2em] text-white">Record your meal</h1>
          </div>
          <Link href="/dashboard" className="inline-flex items-center justify-center border border-white/10 bg-obsidian-950 px-4 py-2 text-[10px] font-semibold tracking-[0.25em] text-white/70 transition-all duration-300 hover:border-gold-accent/50 hover:text-gold-accent">
            Back to dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block space-y-2 text-sm text-white/70">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-white/45">Meal type</span>
            <select
              value={mealType}
              onChange={(event) => setMealType(event.target.value)}
              className="w-full border border-white/10 bg-obsidian-950 px-3 py-3 text-white outline-none transition focus:border-gold-accent"
            >
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
              <option value="SNACK">Snack</option>
            </select>
          </label>

          <label className="block space-y-2 text-sm text-white/70">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-white/45">Food description</span>
            <textarea
              value={mealText}
              onChange={(event) => setMealText(event.target.value)}
              rows={6}
              placeholder="เช่น ข้าว 250 กรัม อกไก่ 200 กรัม"
              className="w-full border border-white/10 bg-obsidian-950 px-3 py-3 text-white outline-none transition focus:border-gold-accent"
              required
            />
            <span className="block text-xs text-white/45">ข้อความนี้จะถูกรับและส่งผ่าน mock AI ก่อนเพื่อเตรียมสำหรับการเชื่อม AI จริงในอนาคต</span>
          </label>

          {message && (
            <div className={`rounded border px-4 py-3 text-sm ${message.type === "error" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}`}>
              {message.text}
            </div>
          )}

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
