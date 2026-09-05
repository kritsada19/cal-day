"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function ProfileFormPage() {
  const router = useRouter();
  const { status } = useSession();
  const [formData, setFormData] = useState({
    gender: "",
    age: "",
    weight: "",
    height: "",
    exerciseLevel: "",
    goal: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.profile) {
            setFormData({
              gender: data.profile.gender || "",
              age: data.profile.age?.toString() || "",
              weight: data.profile.weight?.toString() || "",
              height: data.profile.height?.toString() || "",
              exerciseLevel: data.profile.exerciseLevel || "",
              goal: data.profile.goal || "",
            });
          }
        })
        .catch(() => {
          toast.error("Unable to load your profile data");
        });
    }
  }, [status]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save your profile");
      }

      // Toast stays on screen through the short redirect to the profile page.
      toast.success(data.message || "Profile saved successfully");
      setTimeout(() => router.push("/profile"), 800);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save your profile");
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
          <p className="mt-3 text-sm text-obsidian-950/60 dark:text-white/60">You need to log in before filling in your personal information.</p>
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
            <p className="text-[10px] uppercase tracking-[0.35em] text-gold-accent">Personal information</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[0.2em] text-obsidian-950 dark:text-white">Fill your profile</h1>
          </div>
          <Link href="/profile" className="inline-flex items-center justify-center border border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950 px-4 py-2 text-[10px] font-semibold tracking-[0.25em] text-obsidian-950/70 dark:text-white/70 transition-all duration-300 hover:border-gold-accent/50 hover:text-gold-accent">
            Back to profile
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm text-obsidian-950/70 dark:text-white/70">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-obsidian-950/45 dark:text-white/45">Gender</span>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950 px-3 py-3 text-obsidian-950 dark:text-white outline-none transition focus:border-gold-accent"
                required
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </label>

            <label className="space-y-2 text-sm text-obsidian-950/70 dark:text-white/70">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-obsidian-950/45 dark:text-white/45">Age</span>
              <input
                type="number"
                min="1"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950 px-3 py-3 text-obsidian-950 dark:text-white outline-none transition focus:border-gold-accent"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-obsidian-950/70 dark:text-white/70">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-obsidian-950/45 dark:text-white/45">Weight (kg)</span>
              <input
                type="number"
                min="1"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950 px-3 py-3 text-obsidian-950 dark:text-white outline-none transition focus:border-gold-accent"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-obsidian-950/70 dark:text-white/70">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-obsidian-950/45 dark:text-white/45">Height (cm)</span>
              <input
                type="number"
                min="1"
                step="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950 px-3 py-3 text-obsidian-950 dark:text-white outline-none transition focus:border-gold-accent"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-obsidian-950/70 dark:text-white/70">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-obsidian-950/45 dark:text-white/45">Exercise level</span>
              <select
                value={formData.exerciseLevel}
                onChange={(e) => setFormData({ ...formData, exerciseLevel: e.target.value })}
                className="w-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950 px-3 py-3 text-obsidian-950 dark:text-white outline-none transition focus:border-gold-accent"
                required
              >
                <option value="">Select</option>
                <option value="SEDENTARY">Sedentary</option>
                <option value="LIGHT">Light</option>
                <option value="MODERATE">Moderate</option>
                <option value="ACTIVE">Active</option>
                <option value="VERY_ACTIVE">Very Active</option>
              </select>
            </label>

            <label className="space-y-2 text-sm text-obsidian-950/70 dark:text-white/70">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-obsidian-950/45 dark:text-white/45">Goal</span>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950 px-3 py-3 text-obsidian-950 dark:text-white outline-none transition focus:border-gold-accent"
                required
              >
                <option value="">Select</option>
                <option value="LOSE_WEIGHT">Lose Weight</option>
                <option value="MAINTAIN_WEIGHT">Maintain Weight</option>
                <option value="GAIN_WEIGHT">Gain Weight</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center border border-gold-accent/40 bg-gold-accent/10 px-4 py-3 text-[10px] font-semibold tracking-[0.25em] text-gold-accent transition-all duration-300 hover:bg-gold-accent/20 disabled:cursor-not-allowed disabled:opacity-70 hover:text-obsidian-950 dark:hover:text-white"
          >
            {isSaving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
