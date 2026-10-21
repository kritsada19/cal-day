"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
import {
  Utensils,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Flame,
  Dumbbell,
  User as UserIcon,
  X,
} from "lucide-react";

interface AdminUserSummary {
  id: number;
  name: string | null;
  email: string;
}

interface AdminMealSummary {
  id: number;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  createdAt: string;
  userId: number;
  user: AdminUserSummary;
}

interface AdminFoodEntry {
  id: number;
  mealId: number;
  foodName: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  meal: AdminMealSummary;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FoodsApiResponse {
  foodEntries: AdminFoodEntry[];
  foods?: AdminFoodEntry[];
  pagination: PaginationMeta;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const fieldClass = `min-h-11 rounded-xl border border-secondary bg-surface px-4 text-base text-ink placeholder:text-muted transition-colors duration-200 hover:border-primary focus:border-primary ${focusRing}`;
const tintButton = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-tint px-4 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const pageButton = `flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-primary-tint text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

export default function AdminFoodsPage() {
  const { data: session, status } = useSession();

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

  // Selected food item for modal details
  const [selectedFood, setSelectedFood] = useState<AdminFoodEntry | null>(null);

  const fetchFoodEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10");
      if (search.trim()) params.set("search", search.trim());
      if (mealFilter) params.set("mealType", mealFilter);

      const response = await axios.get<FoodsApiResponse>(
        `/api/admin/foods?${params.toString()}`
      );
      const data = response.data.foodEntries || response.data.foods || [];
      setFoodEntries(data);
      setPagination(response.data.pagination);
    } catch (err: unknown) {
      if (axios.isAxiosError<{ message?: string }>(err)) {
        setError(
          err.response?.data?.message || "Failed to load food entry data"
        );
      } else {
        setError("Failed to load food entry data");
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, mealFilter]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchFoodEntries();
    }
  }, [status, session, fetchFoodEntries]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas">
        <div role="status" className="flex flex-col items-center gap-4">
          <div
            aria-hidden="true"
            className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-primary motion-reduce:animate-none"
          />
          <p className="text-base text-muted">Loading admin control center...</p>
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
            Access Denied
          </h2>
          <p className="mb-6 text-base leading-7 text-muted">
            You do not have administrative permissions to view this section.
          </p>
          <Link
            href="/"
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover ${focusRing}`}
          >
            Return to Safety
          </Link>
        </div>
      </div>
    );
  }

  // Page metrics
  const totalPageCalories = foodEntries.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const totalPageProtein = foodEntries.reduce((acc, curr) => acc + (curr.protein || 0), 0);

  return (
    <div className="relative min-h-[85vh] flex-1 overflow-hidden bg-canvas px-4 py-8 text-ink selection:bg-highlight selection:text-ink md:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-280">
        {/* Header Section */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted">
              <Shield className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              <span>Admin Management</span>
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Food Directory
            </h1>
            <p className="mt-1 text-base text-muted">
              Monitor, filter, and search system food entries across all meals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchFoodEntries()}
              disabled={loading}
              className={tintButton}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <dl className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5 shadow-soft">
            <div>
              <dt className="text-sm text-muted">Total Food Entries</dt>
              <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-ink">{pagination.total}</dd>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-tint text-primary">
              <Utensils className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5 shadow-soft">
            <div>
              <dt className="text-sm text-muted">Page Calories</dt>
              <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-primary">
                {Math.round(totalPageCalories).toLocaleString()} <span className="text-base font-medium text-muted">kcal</span>
              </dd>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-tint text-primary">
              <Flame className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5 shadow-soft">
            <div>
              <dt className="text-sm text-muted">Page Protein</dt>
              <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-ink">
                {Math.round(totalPageProtein).toLocaleString()} <span className="text-base font-medium text-muted">g</span>
              </dd>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-highlight text-ink">
              <Dumbbell className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </div>
          </div>
        </dl>

        {/* Filter and Search Bar */}
        <div className="mb-6 flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft md:flex-row md:items-center">
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.75} aria-hidden="true" />
            <input
              type="text"
              aria-label="Search food entries"
              placeholder="Search by food name, user, or email..."
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
                Filters:
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
              <option value="">All Meals</option>
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
              <option value="SNACK">Snack</option>
            </select>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger"
          >
            <span>{error}</span>
            <button
              onClick={() => fetchFoodEntries()}
              className={`min-h-11 cursor-pointer rounded-lg px-3 text-sm font-semibold underline underline-offset-4 ${focusRing}`}
            >
              Retry
            </button>
          </div>
        )}

        {/* Food Table / Grid */}
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
          {loading ? (
            <div role="status" className="flex items-center justify-center gap-3 p-12 text-base text-muted">
              <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" strokeWidth={1.75} aria-hidden="true" />
              <span>Fetching food records...</span>
            </div>
          ) : foodEntries.length === 0 ? (
            <div className="p-12 text-center text-base text-muted">
              No food entries found matching the search criteria.
            </div>
          ) : (
            <div
              role="region"
              aria-label="Food entries table"
              tabIndex={0}
              className={`overflow-x-auto ${focusRing}`}
            >
              <table className="w-full min-w-5xl border-collapse text-left text-base">
                <thead>
                  <tr className="border-b border-line bg-canvas text-sm font-semibold text-muted">
                    <th scope="col" className="p-4">Food Item</th>
                    <th scope="col" className="p-4">Meal Type</th>
                    <th scope="col" className="p-4">Amount</th>
                    <th scope="col" className="p-4">Calories</th>
                    <th scope="col" className="p-4">Protein</th>
                    <th scope="col" className="p-4">Logged By</th>
                    <th scope="col" className="p-4">Date</th>
                    <th scope="col" className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {foodEntries.map((item) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer transition-colors duration-200 hover:bg-primary-tint"
                      onClick={() => setSelectedFood(item)}
                    >
                      {/* Food Info */}
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

                      {/* Logged By */}
                      <td className="p-4">
                        {item.meal?.user ? (
                          <div className="flex min-w-0 flex-col text-sm">
                            <span className="font-semibold text-ink">
                              {item.meal.user.name || "Unnamed User"}
                            </span>
                            <span className="truncate text-sm text-muted">
                              {item.meal.user.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm italic text-muted">
                            Unknown
                          </span>
                        )}
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
                          Details
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
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
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

      {/* Food Details Modal */}
      {selectedFood && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="food-details-title"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-lift">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                  <Utensils className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 id="food-details-title" className="truncate text-lg font-semibold tracking-tight text-ink">
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
              {/* Nutritional Breakdown Grid */}
              <dl className="grid grid-cols-2 gap-4 rounded-xl border border-line bg-canvas p-4">
                <div>
                  <dt className="text-sm text-muted">Serving Amount</dt>
                  <dd className="mt-0.5 text-base font-semibold tabular-nums text-ink">
                    {selectedFood.amount} {selectedFood.unit}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Meal Type</dt>
                  <dd className="mt-0.5 text-base font-semibold text-ink">
                    {selectedFood.meal?.mealType || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Calories</dt>
                  <dd className="mt-0.5 text-base font-semibold tabular-nums text-primary">
                    {selectedFood.calories} kcal
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Protein</dt>
                  <dd className="mt-0.5 text-base font-semibold tabular-nums text-ink">
                    {selectedFood.protein} g
                  </dd>
                </div>
              </dl>

              {/* User Metadata */}
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <UserIcon className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden="true" />
                  <span>Logged User & Timestamp</span>
                </h4>
                <div className="space-y-1.5 rounded-xl border border-line bg-canvas p-4 text-base text-muted">
                  <div>
                    User:{" "}
                    <strong className="font-semibold text-ink">
                      {selectedFood.meal?.user?.name || "Unnamed User"}
                    </strong>{" "}
                    ({selectedFood.meal?.user?.email})
                  </div>
                  <div>
                    Logged Date:{" "}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}