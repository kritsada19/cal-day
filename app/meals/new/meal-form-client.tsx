"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import {
  Clock3,
  ImageUp,
  PencilLine,
  Sparkles,
  Upload,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const fieldClass = `w-full rounded-xl border border-secondary bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors duration-200 hover:border-primary focus:border-primary ${focusRing}`;
const fieldIconClass = "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary/80";
const primaryButton = `inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;
const secondaryLink = `inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-tint px-5 py-2.5 text-base font-semibold text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink ${focusRing}`;

export default function MealFormClient() {
  const router = useRouter();
  const { status } = useSession();
  const t = useTranslations("newMeal");

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
          toast.error(t("noImageError"));
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
      toast.success(t("saveSuccess"));
      setTimeout(() => router.push("/dashboard"), 900);
    } catch (error) {
      let errorMessage = t("saveError");
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = t("saveError");
      } else if (error instanceof Error) {
        errorMessage = t("saveError");
      }

      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas px-4 py-10">
        <p role="status" className="text-base text-muted">{t("loading")}</p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
          <p className="text-sm font-medium text-muted">{t("accessRequired")}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{t("signInTitle")}</h1>
          <p className="mt-3 text-base leading-7 text-muted">{t("signInDescription")}</p>
          <Link href="/signin" className={`mt-6 ${primaryButton}`}>
            {t("goToSignIn")}
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
            <p className="text-sm font-medium text-muted">{t("pageLabel")}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">{t("pageTitle")}</h1>
          </div>
          <Link href="/dashboard" className={secondaryLink}>
            {t("backToDashboard")}
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              <UtensilsCrossed className="h-4 w-4 text-primary" strokeWidth={2} />
              {t("mealTypeLabel")}
            </span>
            <div className="relative">
              <UtensilsCrossed className={`${fieldIconClass} h-4 w-4`} strokeWidth={2} />
              <select
                value={mealType}
                onChange={(event) => setMealType(event.target.value)}
                className={`${fieldClass} min-h-11 cursor-pointer pl-11`}
              >
                <option value="BREAKFAST">{t("breakfast")}</option>
                <option value="LUNCH">{t("lunch")}</option>
                <option value="DINNER">{t("dinner")}</option>
                <option value="SNACK">{t("snack")}</option>
              </select>
            </div>
          </label>

          <div className="inline-flex rounded-xl bg-primary-tint p-1">
            <button
              type="button"
              onClick={() => setMode("text")}
              aria-pressed={mode === "text"}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors duration-200 ${focusRing} ${mode === "text" ? "bg-surface text-primary shadow-soft" : "text-muted hover:text-ink"}`}
            >
              <PencilLine className="h-4 w-4" strokeWidth={2} />
              {t("modeText")}
            </button>
            <button
              type="button"
              onClick={() => setMode("image")}
              aria-pressed={mode === "image"}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors duration-200 ${focusRing} ${mode === "image" ? "bg-surface text-primary shadow-soft" : "text-muted hover:text-ink"}`}
            >
              <ImageUp className="h-4 w-4" strokeWidth={2} />
              {t("modeImage")}
            </button>
          </div>

          {mode === "text" ? (
            <div className="space-y-2">
              <label htmlFor="meal-text" className="flex items-center gap-2 text-sm font-medium text-ink">
                <Sparkles className="h-4 w-4 text-primary" strokeWidth={2} />
                {t("foodDescriptionLabel")}
              </label>
              <textarea
                id="meal-text"
                value={mealText}
                onChange={(event) => setMealText(event.target.value)}
                rows={6}
                placeholder={t("foodDescriptionPlaceholder")}
                aria-describedby="meal-text-help"
                className={fieldClass}
                required={mode === "text"}
              />
              <p id="meal-text-help" className="text-sm text-muted">
                {t("foodDescriptionHelp")}
              </p>

              {/*
               * แสดง shortcut chip เฉพาะเมื่อมีข้อมูล (recentMeals.length > 0)
               * ถ้า user ยังไม่เคยบันทึกมื้ออาหารเลย section นี้จะไม่ปรากฏ
               */}
              {recentMeals.length > 0 && (
                <div className="space-y-2 pt-2">
                  {/* Label บอกให้รู้ว่าปุ่มพวกนี้คืออะไร */}
                  <p className="flex items-center gap-2 text-sm font-medium text-muted">
                    <Clock3 className="h-4 w-4 text-primary" strokeWidth={2} />
                    {t("recentMeals")}
                  </p>

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
                        className={`min-h-11 cursor-pointer rounded-full border border-secondary bg-primary-tint px-4 text-sm font-medium text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink ${focusRing}`}
                      >
                        {meal}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          ) : (
            <div className="space-y-4">
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <ImageUp className="h-4 w-4 text-primary" strokeWidth={2} />
                {t("foodImageLabel")}
              </span>
              {!imagePreview ? (
                <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-secondary bg-canvas px-4 text-center transition-colors duration-200 hover:border-primary hover:bg-primary-tint focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
                  <Upload className="mb-3 h-6 w-6 text-secondary" strokeWidth={1.75} aria-hidden="true" />
                  <p className="mb-1 text-base text-ink"><span className="font-semibold">{t("clickToUpload")}</span> {t("orTakePhoto")}</p>
                  <p className="text-sm text-muted">{t("acceptedFormats")}</p>
                  <input type="file" className="sr-only" accept="image/*" capture="environment" onChange={handleImageChange} required={mode === "image"} />
                </label>
              ) : (
                <div className="relative h-auto w-full overflow-hidden rounded-2xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Food preview" className="max-h-64 w-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className={`absolute right-3 top-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-surface/90 px-3 text-sm font-semibold text-ink shadow-soft transition-colors duration-200 hover:bg-surface ${focusRing}`}
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    {t("removeImage")}
                  </button>
                </div>
              )}
              <p className="text-sm text-muted">
                {t("aiImageHelp")}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className={primaryButton}
          >
            {isSaving ? t("saving") : t("saveMeal")}
          </button>
        </form>
      </div>
    </div>
  );
}