"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { Heart, Flame, Dumbbell, UtensilsCrossed, ArrowLeft, Plus, Pencil, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { deduplicateRequest } from "@/lib/http/request-deduplication";

type FavoriteMeal = {
  id: number;
  userId: number;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  createdAt: string;
  updatedAt: string;
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const secondaryLink = `inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-tint px-5 py-2.5 text-base font-semibold text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink ${focusRing}`;
const primaryLink = `inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover ${focusRing}`;
const fieldClass = `w-full rounded-xl border border-secondary bg-surface px-4 py-2.5 text-base text-ink placeholder:text-muted transition-colors duration-200 hover:border-primary focus:border-primary ${focusRing}`;

export default function FavoritesClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const t = useTranslations("favoriteMeals");

  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProError, setIsProError] = useState(false);

  // Popup Modal States
  const [addModalMeal, setAddModalMeal] = useState<FavoriteMeal | null>(null);
  const [addMealType, setAddMealType] = useState<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACK">("BREAKFAST");
  const [isAddingMeal, setIsAddingMeal] = useState(false);

  const [deleteModalMeal, setDeleteModalMeal] = useState<FavoriteMeal | null>(null);
  const [isDeletingMeal, setIsDeletingMeal] = useState(false);
  const [editModalMeal, setEditModalMeal] = useState<FavoriteMeal | null>(null);
  const [isEditingMeal, setIsEditingMeal] = useState(false);
  const [editForm, setEditForm] = useState({
    amount: 1,
    unit: "",
  });

  const getErrorMessage = useCallback(
    (err: unknown, fallbackKey: "addError" | "editError" | "deleteError") => {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) return t("unauthorized");
        if (status === 403) return t("proRequiredError");
        if (status === 404) return t("notFound");
        if (status === 429) return t("rateLimited");
        if (status === 400) return t("invalidData");
      }
      return t(fallbackKey);
    },
    [t]
  );

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await deduplicateRequest(
        "meals:favorites:fetch",
        () => axios.get<FavoriteMeal[]>("/api/meals/favorites")
      );
      setFavorites(res.data);
      setErrorMessage(null);
      setIsProError(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403) {
          setIsProError(true);
          return;
        }
        if (err.response?.status === 429) {
          setErrorMessage(t("rateLimited"));
          return;
        }
        if (err.response?.status === 401) {
          setErrorMessage(t("unauthorized"));
          return;
        }
      }
      setErrorMessage(t("fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const handleConfirmAddMeal = async () => {
    if (!addModalMeal || isAddingMeal) return;

    setIsAddingMeal(true);
    try {
      const now = new Date();
      const localDateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const res = await axios.post("/api/meals/favorites", {
        favoriteId: addModalMeal.id,
        mealType: addMealType,
        date: localDateString,
      });

      if (res.status === 200 || res.status === 201) {
        toast.success(t("addSuccess"));
        setAddModalMeal(null);
        setTimeout(() => router.push("/dashboard"), 900);
      } else {
        toast.error(t("addError"));
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "addError"));
    } finally {
      setIsAddingMeal(false);
    }
  };

  const handleConfirmEditMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalMeal || isEditingMeal) return;

    setIsEditingMeal(true);
    try {
      const res = await axios.put(`/api/meals/favorites/${editModalMeal.id}`, {
        amount: Number(editForm.amount),
        unit: editForm.unit.trim(),
      });

      if (res.status === 200) {
        toast.success(t("editSuccess"));
        setEditModalMeal(null);
        await fetchFavorites();
      } else {
        toast.error(t("editError"));
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "editError"));
    } finally {
      setIsEditingMeal(false);
    }
  };

  const handleConfirmDeleteMeal = async () => {
    if (!deleteModalMeal || isDeletingMeal) return;

    setIsDeletingMeal(true);
    try {
      const res = await axios.delete(`/api/meals/favorites/${deleteModalMeal.id}`);
      if (res.status === 200) {
        toast.success(t("deleteSuccess"));
        setDeleteModalMeal(null);
        await fetchFavorites();
      } else {
        toast.error(t("deleteError"));
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "deleteError"));
    } finally {
      setIsDeletingMeal(false);
    }
  };

  const openEditModal = (meal: FavoriteMeal) => {
    setEditModalMeal(meal);
    setEditForm({
      amount: meal.amount,
      unit: meal.unit,
    });
  };

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchData = async () => {
      await fetchFavorites();
    };
    fetchData();
  }, [status, fetchFavorites]);

  // จัดการ Real-time SSE
  useEffect(() => {
    if (status !== "authenticated") return;

    const eventSource = new EventSource("/api/events");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // กรองเฉพาะ event ของ user คนนี้
        if (String(data.userId) !== String(session?.user?.id)) return;

        // อัปเดตรายการเมื่อเกิด event เกี่ยวกับ favorites หรือ meal
        if (
          data.type === "favorite.updated" ||
          data.type === "favorite.created" ||
          data.type === "favorite.deleted" ||
          data.type === "meal.created"
        ) {
          fetchFavorites();
        }
      } catch {
        // ignore non-json messages (e.g. heartbeat)
      }
    };

    eventSource.onerror = () => {
      // Browser จะ auto reconnect
    };

    return () => {
      eventSource.close();
    };
  }, [status, session?.user?.id, fetchFavorites]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas px-4 py-10">
        <p role="status" className="text-base text-muted">
          {t("loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[85vh] flex-1 overflow-hidden bg-canvas px-4 py-8 text-ink selection:bg-highlight selection:text-ink md:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl space-y-6">
        {/* Header Section */}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted">{t("pageLabel")}</p>
              <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight text-ink">
                <Heart className="h-7 w-7 text-primary fill-primary/20" />
                {t("pageTitle")}
              </h1>
              <p className="mt-2 text-sm text-muted">{t("pageDescription")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/meals/new" className={secondaryLink}>
                <Plus className="h-4 w-4" />
                {t("backToMeals")}
              </Link>
              <Link href="/dashboard" className={secondaryLink}>
                <ArrowLeft className="h-4 w-4" />
                {t("backToDashboard")}
              </Link>
            </div>
          </div>
        </div>

        {/* Pro Plan Warning */}
        {isProError && (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
            <Heart className="mx-auto h-12 w-12 text-muted" />
            <h2 className="mt-3 text-xl font-semibold text-ink">{t("proRequired")}</h2>
            <div className="mt-6">
              <Link href="/subscription" className={primaryLink}>
                {t("upgradeToPro")}
              </Link>
            </div>
          </div>
        )}

        {/* General Error */}
        {errorMessage && (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center text-rose-500 shadow-soft">
            {errorMessage}
          </div>
        )}

        {/* Empty State */}
        {!isProError && !errorMessage && favorites.length === 0 && (
          <div className="rounded-2xl border border-dashed border-secondary bg-surface/50 p-12 text-center">
            <UtensilsCrossed className="mx-auto h-12 w-12 text-muted" />
            <h2 className="mt-4 text-lg font-semibold text-ink">{t("emptyTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">{t("emptyDescription")}</p>
            <div className="mt-6">
              <Link href="/meals/new" className={primaryLink}>
                <Plus className="h-4 w-4" />
                {t("backToMeals")}
              </Link>
            </div>
          </div>
        )}

        {/* Favorites List */}
        {!isProError && !errorMessage && favorites.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {favorites.map((meal) => (
              <div
                key={meal.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 shadow-soft transition-all duration-200 hover:border-primary/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-ink group-hover:text-primary transition-colors">
                      {meal.name}
                    </h2>
                    <span className="inline-flex items-center rounded-lg bg-primary-tint px-2.5 py-1 text-xs font-medium text-primary">
                      {meal.amount} {meal.unit}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 font-medium text-ink">
                      <Flame className="h-4 w-4 text-amber-500" />
                      <span>
                        {Math.round(meal.calories)} {t("kcal")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-medium text-ink">
                      <Dumbbell className="h-4 w-4 text-emerald-500" />
                      <span>
                        {Math.round(meal.protein)} {t("g")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAddModalMeal(meal)}
                      className={`inline-flex h-8 items-center gap-1 rounded-lg bg-primary-tint px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-highlight hover:text-ink ${focusRing}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t("addMeal")}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={t("edit")}
                      onClick={() => openEditModal(meal)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:border-primary hover:text-primary ${focusRing}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={t("delete")}
                      onClick={() => setDeleteModalMeal(meal)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:border-rose-500 hover:text-rose-500 ${focusRing}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal 1: ยืนยันเพิ่มมื้ออาหาร ── */}
      {addModalMeal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setAddModalMeal(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-7">
            <h3 className="text-lg font-semibold text-ink">{t("confirmAddTitle")}</h3>
            <p className="mt-2 text-sm text-muted">
              {t("confirmAddDesc")}
            </p>
            <div className="mt-4 rounded-xl border border-line bg-canvas p-3">
              <p className="font-medium text-ink">{addModalMeal.name}</p>
              <p className="text-xs text-muted mt-1">
                {addModalMeal.amount} {addModalMeal.unit} • {Math.round(addModalMeal.calories)} {t("kcal")} • {Math.round(addModalMeal.protein)} {t("g")}
              </p>
            </div>

            <div className="mt-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted">{t("mealTypeLabel")}</span>
                <select
                  value={addMealType}
                  onChange={(e) => setAddMealType(e.target.value as typeof addMealType)}
                  className={`${fieldClass} cursor-pointer`}
                >
                  <option value="BREAKFAST">{t("breakfast")}</option>
                  <option value="LUNCH">{t("lunch")}</option>
                  <option value="DINNER">{t("dinner")}</option>
                  <option value="SNACK">{t("snack")}</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isAddingMeal}
                onClick={() => setAddModalMeal(null)}
                className={secondaryLink}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={isAddingMeal}
                onClick={handleConfirmAddMeal}
                className={primaryLink}
              >
                {isAddingMeal ? t("adding") : t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: แก้ไขรายการโปรด ── */}
      {editModalMeal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setEditModalMeal(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-ink">{t("editTitle")}</h3>
                <p className="mt-0.5 text-sm font-medium text-primary">{editModalMeal.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalMeal(null)}
                className="rounded-lg p-1.5 text-muted hover:bg-highlight hover:text-ink transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleConfirmEditMeal}
              className="mt-5 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted">{t("editAmount")}</span>
                  <input
                    type="number"
                    step="any"
                    value={editForm.amount}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted">{t("editUnit")}</span>
                  <input
                    type="text"
                    value={editForm.unit}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, unit: e.target.value }))
                    }
                    className={fieldClass}
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isEditingMeal}
                  onClick={() => setEditModalMeal(null)}
                  className={secondaryLink}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isEditingMeal}
                  className={primaryLink}
                >
                  {isEditingMeal ? t("saving") : t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 3: ยืนยันการลบ ── */}
      {deleteModalMeal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDeleteModalMeal(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-7">
            <h3 className="text-lg font-semibold text-rose-500">{t("confirmDeleteTitle")}</h3>
            <p className="mt-2 text-sm text-muted">
              {t("confirmDeleteDesc")}
            </p>
            <div className="mt-4 rounded-xl border border-line bg-canvas p-3">
              <p className="font-medium text-ink">{deleteModalMeal.name}</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeletingMeal}
                onClick={() => setDeleteModalMeal(null)}
                className={secondaryLink}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={isDeletingMeal}
                onClick={handleConfirmDeleteMeal}
                className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-600 px-5 py-2.5 text-base font-semibold text-white transition-colors duration-200 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`}
              >
                {isDeletingMeal ? t("deleting") : t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

