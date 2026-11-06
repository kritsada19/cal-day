"use client";

import { type ComponentType, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  FaBullseye,
  FaCakeCandles,
  FaDumbbell,
  FaRulerVertical,
  FaVenusMars,
  FaWeightScale,
} from "react-icons/fa6";
import { toast } from "sonner";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const fieldClass = `w-full min-h-11 rounded-xl border border-secondary bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors duration-200 hover:border-primary focus:border-primary ${focusRing}`;
const labelTextClass = "block text-sm font-medium text-ink";
const inputIconClass = "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-primary/80";
const primaryButton = `inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;
const secondaryLink = `inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-tint px-5 py-2.5 text-base font-semibold text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink ${focusRing}`;

function FieldLabel({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className={labelTextClass}>
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span>{label}</span>
      </span>
    </span>
  );
}

export default function ProfileFormPage() {
  const router = useRouter();
  const { status } = useSession();
  const formT = useTranslations("profileForm");
  const t = useTranslations();
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
          toast.error(formT("loadProfileError"));
        });
    }
  }, [status, formT]);

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
        throw new Error(formT("saveError"));
      }

      // Toast stays on screen through the short redirect to the profile page.
      toast.success(formT("saveSuccess"));
      setTimeout(() => router.push("/profile"), 800);
    } catch (error) {
      toast.error(formT("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas px-4 py-10">
        <p role="status" className="text-base text-muted">{formT("loading")}</p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
          <p className="text-sm font-medium text-muted">{formT("accessRequired")}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{formT("signInRequiredTitle")}</h1>
          <p className="mt-3 text-base leading-7 text-muted">{formT("signInRequiredDescription")}</p>
          <Link href="/signin" className={`mt-6 ${primaryButton}`}>
            {formT("goToSignIn")}
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
            <p className="text-sm font-medium text-muted">{formT("personalInformation")}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">{formT("fillYourProfile")}</h1>
          </div>
          <Link href="/profile" className={secondaryLink}>
            {formT("backToProfile")}
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <FieldLabel icon={FaVenusMars} label={formT("gender")} />
              <div className="relative">
                <FaVenusMars className={inputIconClass} />
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className={`${fieldClass} cursor-pointer pl-11`}
                  required
                >
                  <option value="">{formT("select")}</option>
                  <option value="MALE">♂ {t("genderOptions.male")}</option>
                  <option value="FEMALE">♀ {t("genderOptions.female")}</option>
                </select>
              </div>
            </label>

            <label className="block space-y-2">
              <FieldLabel icon={FaCakeCandles} label={formT("age")} />
              <div className="relative">
                <FaCakeCandles className={inputIconClass} />
                <input
                  type="number"
                  min="1"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className={`${fieldClass} pl-11`}
                  required
                />
              </div>
            </label>

            <label className="block space-y-2">
              <FieldLabel icon={FaWeightScale} label={formT("weightKg")} />
              <div className="relative">
                <FaWeightScale className={inputIconClass} />
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className={`${fieldClass} pl-11`}
                  required
                />
              </div>
            </label>

            <label className="block space-y-2">
              <FieldLabel icon={FaRulerVertical} label={formT("heightCm")} />
              <div className="relative">
                <FaRulerVertical className={inputIconClass} />
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className={`${fieldClass} pl-11`}
                  required
                />
              </div>
            </label>

            <label className="block space-y-2">
              <FieldLabel icon={FaDumbbell} label={formT("exerciseLevel")} />
              <div className="relative">
                <FaDumbbell className={inputIconClass} />
                <select
                  value={formData.exerciseLevel}
                  onChange={(e) => setFormData({ ...formData, exerciseLevel: e.target.value })}
                  className={`${fieldClass} cursor-pointer pl-11`}
                  required
                >
                  <option value="">{formT("select")}</option>
                  <option value="SEDENTARY">🪑 {t("exerciseLevelOptions.sedentary")}</option>
                  <option value="LIGHT">🚶 {t("exerciseLevelOptions.light")}</option>
                  <option value="MODERATE">🏃 {t("exerciseLevelOptions.moderate")}</option>
                  <option value="ACTIVE">💪 {t("exerciseLevelOptions.active")}</option>
                  <option value="VERY_ACTIVE">🔥 {t("exerciseLevelOptions.veryActive")}</option>
                </select>
              </div>
            </label>

            <label className="block space-y-2">
              <FieldLabel icon={FaBullseye} label={formT("goal")} />
              <div className="relative">
                <FaBullseye className={inputIconClass} />
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className={`${fieldClass} cursor-pointer pl-11`}
                  required
                >
                  <option value="">{formT("select")}</option>
                  <option value="LOSE_WEIGHT">🔥 {t("goalOptions.loseWeight")}</option>
                  <option value="MAINTAIN_WEIGHT">⚖️ {t("goalOptions.maintainWeight")}</option>
                  <option value="GAIN_WEIGHT">💪 {t("goalOptions.gainWeight")}</option>
                </select>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className={primaryButton}
          >
            {isSaving ? formT("saving") : formT("saveProfile")}
          </button>
        </form>
      </div>
    </div>
  );
}