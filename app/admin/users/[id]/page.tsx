"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Shield,
  Crown,
  User as UserIcon,
  Utensils,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Flame,
  Dumbbell,
  Activity,
  X,
  Mail,
} from "lucide-react";

interface UserProfile {
  gender: string | null;
  age: number | null;
  weight: number | null;
  height: number | null;
  exerciseLevel: string | null;
  goal: string | null;
  bmr: number | null;
  tdee: number | null;
  targetCalories: number | null;
  targetProtein: number | null;
}

interface UserSubscription {
  plan: string;
  status: string;
  startAt: string | null;
  endAt: string | null;
}

interface AdminUserDetail {
  id: number;
  name: string | null;
  email: string;
  emailVerified: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
  subscription: UserSubscription | null;
  profile: UserProfile | null;
}

interface AdminMeal {
  id: number;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  createdAt: string;
}

interface AdminFoodEntry {
  id: number;
  mealId: number;
  foodName: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  meal: AdminMeal;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UserDetailApiResponse {
  user: AdminUserDetail;
  foodEntries: AdminFoodEntry[];
  foods?: AdminFoodEntry[];
  pagination: PaginationMeta;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const fieldClass = `min-h-11 rounded-xl border border-secondary bg-surface px-4 text-base text-ink placeholder:text-muted transition-colors duration-200 hover:border-primary focus:border-primary ${focusRing}`;
const tintButton = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-tint px-4 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const pageButton = `flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-primary-tint text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;
const badgeBase = "inline-flex min-h-7 items-center gap-1 rounded-full px-3 text-sm font-semibold";
const tileClass = "rounded-xl border border-line bg-canvas p-3";

function ProfileTile({ label, value, span = false }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={`${tileClass} ${span ? "col-span-2" : ""}`}>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold text-ink tabular-nums">{value}</dd>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const t = useTranslations("admin");

  const userId = params?.id ? String(params.id) : "";

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [foodEntries, setFoodEntries] = useState<AdminFoodEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [mealFilter, setMealFilter] = useState("");
  const [page, setPage] = useState(1);

  // Selected food entry for modal
  const [selectedFood, setSelectedFood] = useState<AdminFoodEntry | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set("page", page.toString());
      searchParams.set("limit", "10");
      if (search.trim()) searchParams.set("search", search.trim());
      if (mealFilter) searchParams.set("mealType", mealFilter);

      const response = await axios.get<UserDetailApiResponse>(
        `/api/admin/users/${userId}?${searchParams.toString()}`
      );

      setUser(response.data.user);
      const foods = response.data.foodEntries || response.data.foods || [];
      setFoodEntries(foods);
      setPagination(response.data.pagination);
    } catch (err: unknown) {
      if (axios.isAxiosError<{ message?: string }>(err)) {
        setError(
          err.response?.data?.message || "Failed to load user detail data"
        );
      } else {
        setError("Failed to load user detail data");
      }
    } finally {
      setLoading(false);
    }
  }, [userId, page, search, mealFilter]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUserData();
    }
  }, [status, session, fetchUserData]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas">
        <div role="status" className="flex flex-col items-center gap-4">
          <div
            aria-hidden="true"
            className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-primary motion-reduce:animate-none"
          />
          <p className="text-base text-muted">{t("loadingAdminControlCenter")}</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
    return (
      <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
            <Shield className="h-8 w-8" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-ink">
            {t("accessDenied")}
          </h2>
          <p className="mb-6 text-base leading-7 text-muted">
            {t("accessDeniedMessage")}
          </p>
          <Link
            href="/"
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover ${focusRing}`}
          >
            {t("returnToSafety")}
          </Link>
        </div>
      </div>
    );
  }

  const initials = (user?.name || user?.email || "U").slice(0, 2).toUpperCase();
  const totalPageCalories = foodEntries.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalPageProtein = foodEntries.reduce((acc, curr) => acc + (curr.protein || 0), 0);

  return (
    <div className="relative min-h-[85vh] flex-1 overflow-hidden bg-canvas px-4 py-8 text-ink selection:bg-highlight selection:text-ink md:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-280 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link
              href="/admin/users"
              className={`mb-3 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-hover ${focusRing}`}
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              <span>{t("backToUsers")}</span>
            </Link>

            <div className="flex items-center gap-2 text-sm font-medium text-muted">
              <Shield className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              <span>{t("adminManagement")}</span>
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {t("userProfileAndActivity")}
            </h1>
            <p className="mt-1 text-base text-muted">
              {t("userDetailSubtitle")}{userId}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUserData()}
              disabled={loading}
              className={tintButton}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>{t("refresh")}</span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger"
          >
            <span>{error}</span>
            <button
              onClick={() => fetchUserData()}
              className={`min-h-11 cursor-pointer rounded-lg px-3 text-sm font-semibold underline underline-offset-4 ${focusRing}`}
            >
              {t("retry")}
            </button>
          </div>
        )}

        {/* User Account Overview Card */}
        {user && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Account Card */}
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-highlight text-lg font-bold text-ink">
                  {user.image ? (
                    <Image src={user.image} alt={user.name || user.email} width={56} height={56} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-xl font-semibold tracking-tight text-ink">
                    {user.name || t("unnamedUser")}
                  </h2>
                  <div className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted">
                    <Mail className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {user.role === "ADMIN" ? (
                      <span className={`${badgeBase} bg-highlight text-ink`}>
                        <Shield className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        ADMIN
                      </span>
                    ) : (
                      <span className={`${badgeBase} border border-line text-muted`}>
                        <UserIcon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        USER
                      </span>
                    )}

                    {user.subscription?.plan === "PRO" ? (
                      <span className={`${badgeBase} bg-primary-tint text-primary`}>
                        <Crown className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        PRO
                      </span>
                    ) : (
                      <span className={`${badgeBase} border border-line text-muted`}>
                        {t("free")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <dl className="mt-6 space-y-3 border-t border-line pt-4 text-base">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t("userId")}</dt>
                  <dd className="font-semibold tabular-nums text-ink">#{user.id}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t("registered")}</dt>
                  <dd className="text-ink">{new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{t("subscriptionStatus")}</dt>
                  <dd className="font-semibold uppercase text-ink">{user.subscription?.status || "ACTIVE"}</dd>
                </div>
              </dl>
            </div>

            {/* Health & Physical Profile Card */}
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft lg:col-span-2">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
                <Activity className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <span>{t("physicalProfile")}</span>
              </h2>

              {user.profile ? (
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ProfileTile label={t("gender")} value={user.profile.gender || "N/A"} />
                  <ProfileTile label={t("age")} value={user.profile.age ? `${user.profile.age} yrs` : "N/A"} />
                  <ProfileTile label={t("weight")} value={user.profile.weight ? `${user.profile.weight} kg` : "N/A"} />
                  <ProfileTile label={t("height")} value={user.profile.height ? `${user.profile.height} cm` : "N/A"} />

                  <ProfileTile label={t("bmr")} value={user.profile.bmr ? `${Math.round(user.profile.bmr)} kcal` : "N/A"} />
                  <ProfileTile label={t("tdee")} value={user.profile.tdee ? `${Math.round(user.profile.tdee)} kcal` : "N/A"} />
                  <ProfileTile label={t("targetCal")} value={user.profile.targetCalories ? `${Math.round(user.profile.targetCalories)} kcal` : "N/A"} />
                  <ProfileTile label={t("targetProtein")} value={user.profile.targetProtein ? `${Math.round(user.profile.targetProtein)} g` : "N/A"} />

                  <ProfileTile label={t("exerciseLevel")} value={user.profile.exerciseLevel || "N/A"} span />
                  <ProfileTile label={t("fitnessGoal")} value={user.profile.goal || "N/A"} span />
                </dl>
              ) : (
                <div className="rounded-xl border border-line bg-canvas p-8 text-center text-base italic text-muted">
                  {t("noPhysicalProfile")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Summary Cards for User Food Entries */}
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5 shadow-soft">
            <div>
              <dt className="text-sm text-muted">{t("userFoodLogs")}</dt>
              <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-ink">{pagination.total}</dd>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-tint text-primary">
              <Utensils className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5 shadow-soft">
            <div>
              <dt className="text-sm text-muted">{t("pageCalories")}</dt>
              <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-primary">
                {Math.round(totalPageCalories).toLocaleString()} <span className="text-base font-medium text-muted">{t("kcal")}</span>
              </dd>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-tint text-primary">
              <Flame className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5 shadow-soft">
            <div>
              <dt className="text-sm text-muted">{t("pageProtein")}</dt>
              <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-ink">
                {Math.round(totalPageProtein).toLocaleString()} <span className="text-base font-medium text-muted">{t("g")}</span>
              </dd>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-highlight text-ink">
              <Dumbbell className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>
        </dl>

        {/* Filter and Search Controls */}
        <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft md:flex-row md:items-center">
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.75} aria-hidden="true" />
            <input
              type="text"
              aria-label={t("searchFoodEntries")}
              placeholder={t("searchFoodEntries")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`${fieldClass} w-full pl-10 pr-12`}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
                className={`absolute right-0.5 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:text-primary ${focusRing}`}
              >
                <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-3 md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
              <span className="text-sm font-medium text-muted">
                {t("filters")}:
              </span>
            </div>

            {/* Meal Filter */}
            <select
              aria-label="Filter by meal type"
              value={mealFilter}
              onChange={(e) => {
                setMealFilter(e.target.value);
                setPage(1);
              }}
              className={`${fieldClass} cursor-pointer`}
            >
              <option value="">{t("allMeals")}</option>
              <option value="BREAKFAST">{t("breakfast")}</option>
              <option value="LUNCH">{t("lunch")}</option>
              <option value="DINNER">{t("dinner")}</option>
              <option value="SNACK">{t("snack")}</option>
            </select>
          </div>
        </div>

        {/* User Food Entries Table */}
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
          {loading ? (
            <div role="status" className="flex items-center justify-center gap-3 p-12 text-base text-muted">
              <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" strokeWidth={1.75} aria-hidden="true" />
              <span>{t("fetchingFoodRecords")}</span>
            </div>
          ) : foodEntries.length === 0 ? (
            <div className="p-12 text-center text-base text-muted">
              {t("noEntriesForUser")}
            </div>
          ) : (
            <div
              role="region"
              aria-label="User food entries table"
              tabIndex={0}
              className={`overflow-x-auto ${focusRing}`}
            >
              <table className="w-full min-w-208 border-collapse text-left text-base">
                <thead>
                  <tr className="border-b border-line bg-canvas text-sm font-semibold text-muted">
                    <th scope="col" className="p-4">{t("foodItem")}</th>
                    <th scope="col" className="p-4">{t("mealType")}</th>
                    <th scope="col" className="p-4">{t("amount")}</th>
                    <th scope="col" className="p-4">{t("calories")}</th>
                    <th scope="col" className="p-4">{t("protein")}</th>
                    <th scope="col" className="p-4">{t("date")}</th>
                    <th scope="col" className="p-4 text-right">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {foodEntries.map((item) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer transition-colors duration-200 hover:bg-primary-tint"
                      onClick={() => setSelectedFood(item)}
                    >
                      {/* Food Item */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                            <Utensils className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">
                              {item.foodName}
                            </p>
                            <p className="truncate text-sm text-muted">
                              ID: #{item.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Meal Type */}
                      <td className="p-4">
                        <span className="inline-flex min-h-7 items-center rounded-full border border-line px-3 text-sm font-semibold text-muted">
                          {item.meal?.mealType || "N/A"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-4 text-sm tabular-nums text-ink">
                        {item.amount} {item.unit}
                      </td>

                      {/* Calories */}
                      <td className="p-4 font-semibold tabular-nums text-primary">
                        {item.calories} kcal
                      </td>

                      {/* Protein */}
                      <td className="p-4 font-semibold tabular-nums text-ink">
                        {item.protein} g
                      </td>

                      {/* Date */}
                      <td className="p-4 text-sm tabular-nums text-muted">
                        {item.meal?.createdAt
                          ? new Date(item.meal.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                          : "-"}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFood(item);
                          }}
                          className={tintButton}
                        >
                          {t("details")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-line p-4 text-sm sm:flex-row">
              <span className="text-muted">
                {t("page")} {pagination.page} {t("of")} {pagination.totalPages} ({pagination.total} {t("totalItems")})
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  aria-label="Previous page"
                  className={pageButton}
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <span aria-current="page" className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-highlight px-3 font-bold tabular-nums text-ink">
                  {page}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages || loading}
                  aria-label="Next page"
                  className={pageButton}
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Food Entry Details Modal */}
      {selectedFood && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-food-details-title"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-lift">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                  <Utensils className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 id="user-food-details-title" className="truncate text-lg font-semibold tracking-tight text-ink">
                    {selectedFood.foodName}
                  </h3>
                  <p className="text-sm text-muted">
                    ID: #{selectedFood.id} &bull; {selectedFood.meal?.mealType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                aria-label="Close dialog"
                className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-ink ${focusRing}`}
              >
                <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-5 py-4">
              <dl className="grid grid-cols-2 gap-4 rounded-xl border border-line bg-canvas p-4">
                <div>
                  <dt className="text-sm text-muted">{t("servingAmount")}</dt>
                  <dd className="mt-0.5 text-base font-semibold tabular-nums text-ink">
                    {selectedFood.amount} {selectedFood.unit}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{t("mealType")}</dt>
                  <dd className="mt-0.5 text-base font-semibold text-ink">
                    {selectedFood.meal?.mealType || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{t("calories")}</dt>
                  <dd className="mt-0.5 text-base font-semibold tabular-nums text-primary">
                    {selectedFood.calories} {t("kcal")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{t("protein")}</dt>
                  <dd className="mt-0.5 text-base font-semibold tabular-nums text-ink">
                    {selectedFood.protein} {t("g")}
                  </dd>
                </div>
              </dl>

              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <UserIcon className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden="true" />
                  <span>{t("loggedUserAndTimestamp")}</span>
                </h4>
                <div className="space-y-1.5 rounded-xl border border-line bg-canvas p-4 text-base text-muted">
                  <div>
                    {t("user")}: {" "}
                    <strong className="font-semibold text-ink">
                      {user?.name || t("unnamedUser")}
                    </strong>{" "}
                    ({user?.email})
                  </div>
                  <div>
                    {t("loggedDate")}: {" "}
                    {selectedFood.meal?.createdAt
                      ? new Date(selectedFood.meal.createdAt).toLocaleString("en-US")
                      : "-"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedFood(null)}
                className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-6 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover ${focusRing}`}
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}