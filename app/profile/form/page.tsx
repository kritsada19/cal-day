"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const fieldClass = `w-full min-h-11 rounded-xl border border-secondary bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors duration-200 hover:border-primary focus:border-primary ${focusRing}`;
const labelTextClass = "block text-sm font-medium text-ink";
const primaryButton = `inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;
const secondaryLink = `inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-tint px-5 py-2.5 text-base font-semibold text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink ${focusRing}`;

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
      <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas px-4 py-10">
        <p role="status" className="text-base text-muted">Loading...</p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
          <p className="text-sm font-medium text-muted">Access required</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Please sign in first</h1>
          <p className="mt-3 text-base leading-7 text-muted">You need to log in before filling in your personal information.</p>
          <Link href="/signin" className={`mt-6 ${primaryButton}`}>
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[85vh] flex-1 overflow-hidden bg-canvas px-4 py-8 text-ink selection:bg-highlight selection:text-ink md:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl rounded-2xl border border-line bg-surface p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted">Personal information</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Fill your profile</h1>
          </div>
          <Link href="/profile" className={secondaryLink}>
            Back to profile
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className={labelTextClass}>Gender</span>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className={`${fieldClass} cursor-pointer`}
                required
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className={labelTextClass}>Age</span>
              <input
                type="number"
                min="1"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className={fieldClass}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className={labelTextClass}>Weight (kg)</span>
              <input
                type="number"
                min="1"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className={fieldClass}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className={labelTextClass}>Height (cm)</span>
              <input
                type="number"
                min="1"
                step="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className={fieldClass}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className={labelTextClass}>Exercise level</span>
              <select
                value={formData.exerciseLevel}
                onChange={(e) => setFormData({ ...formData, exerciseLevel: e.target.value })}
                className={`${fieldClass} cursor-pointer`}
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

            <label className="block space-y-2">
              <span className={labelTextClass}>Goal</span>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className={`${fieldClass} cursor-pointer`}
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
            className={primaryButton}
          >
            {isSaving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}