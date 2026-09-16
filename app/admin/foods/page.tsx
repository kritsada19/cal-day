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
  Calendar,
  Layers,
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
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Failed to load food entry data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, search, mealFilter]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchFoodEntries();
    }
  }, [status, session, fetchFoodEntries]);

  if (status === "loading") {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-[#f8f6f1] dark:bg-obsidian-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gold-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono tracking-widest text-gold-accent uppercase">
            Loading Admin Control Center...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-[#f8f6f1] dark:bg-obsidian-950 px-4 py-16">
        <div className="max-w-md w-full text-center p-8 bg-white/80 dark:bg-obsidian-900 border border-red-500/30 relative">
          <span className="absolute -top-px -left-px w-2 h-2 border-t border-l border-red-500" />
          <span className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-red-500" />
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-obsidian-950 dark:text-white uppercase tracking-wider mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-obsidian-950/70 dark:text-white/70 mb-6">
            You do not have administrative permissions to view this section.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-obsidian-950 text-white dark:bg-white dark:text-obsidian-950 font-mono text-xs uppercase tracking-widest hover:bg-gold-accent dark:hover:bg-gold-accent dark:hover:text-obsidian-950 transition-colors"
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
    <div className="min-h-[85vh] flex-1 px-4 py-10 md:py-14 relative overflow-hidden bg-[#f8f6f1] dark:bg-obsidian-950 text-obsidian-950 dark:text-white transition-colors duration-300">
      {/* Subtle Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.06),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.3em] text-gold-accent">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Management</span>
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Food Directory
            </h1>
            <p className="text-xs text-obsidian-950/60 dark:text-white/60 mt-1">
              Monitor, filter, and search system food entries across all meals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchFoodEntries()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider bg-white/80 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 hover:border-gold-accent dark:hover:border-gold-accent transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin text-gold-accent" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 relative group">
            <span className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-gold-accent" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-obsidian-950/60 dark:text-white/60">
                  Total Food Entries
                </p>
                <p className="text-2xl font-bold mt-1 font-mono">{pagination.total}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-gold-accent/10 border border-gold-accent/30 text-gold-accent">
                <Utensils className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 relative group">
            <span className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-amber-500" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-obsidian-950/60 dark:text-white/60">
                  Page Calories
                </p>
                <p className="text-2xl font-bold mt-1 font-mono text-amber-600 dark:text-amber-400">
                  {Math.round(totalPageCalories).toLocaleString()} kcal
                </p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-500">
                <Flame className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="p-5 bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 relative group">
            <span className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-emerald-500" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-obsidian-950/60 dark:text-white/60">
                  Page Protein
                </p>
                <p className="text-2xl font-bold mt-1 font-mono text-emerald-600 dark:text-emerald-400">
                  {Math.round(totalPageProtein).toLocaleString()} g
                </p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
                <Dumbbell className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-white/80 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 mb-6 flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-950/40 dark:text-white/40" />
            <input
              type="text"
              placeholder="Search by food name, user, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-accent focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-obsidian-950/40 dark:text-white/40 hover:text-gold-accent cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-gold-accent" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-obsidian-950/60 dark:text-white/60">
                Filters:
              </span>
            </div>

            {/* Meal Filter */}
            <select
              value={mealFilter}
              onChange={(e) => {
                setMealFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-white dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-accent focus:outline-none transition-colors cursor-pointer"
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
          <div className="p-4 mb-6 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchFoodEntries()}
              className="underline font-mono uppercase text-[10px] hover:text-red-500 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Food Table / Grid */}
        <div className="bg-white/80 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 overflow-hidden relative">
          <span className="absolute -top-px -left-px w-2 h-2 border-t border-l border-gold-accent" />
          <span className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-gold-accent" />

          {loading ? (
            <div className="p-12 text-center text-xs font-mono tracking-widest text-gold-accent uppercase flex items-center justify-center gap-3">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Fetching food records...</span>
            </div>
          ) : foodEntries.length === 0 ? (
            <div className="p-12 text-center text-obsidian-950/60 dark:text-white/60 text-xs font-mono">
              No food entries found matching the search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 font-mono text-[10px] uppercase tracking-widest text-obsidian-950/70 dark:text-white/70">
                    <th className="p-4">Food Item</th>
                    <th className="p-4">Meal Type</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Calories</th>
                    <th className="p-4">Protein</th>
                    <th className="p-4">Logged By</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {foodEntries.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gold-accent/5 transition-colors group cursor-pointer"
                      onClick={() => setSelectedFood(item)}
                    >
                      {/* Food Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 flex items-center justify-center bg-gold-accent/10 border border-gold-accent/30 text-gold-accent font-mono font-bold text-xs shrink-0">
                            <Utensils className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate text-obsidian-950 dark:text-white group-hover:text-gold-accent transition-colors">
                              {item.foodName}
                            </p>
                            <p className="text-[11px] text-obsidian-950/60 dark:text-white/60 truncate font-mono">
                              ID: #{item.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Meal Type */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase bg-black/5 dark:bg-white/5 text-obsidian-950/70 dark:text-white/70 border border-black/10 dark:border-white/10">
                          {item.meal?.mealType || "N/A"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-4 font-mono text-[11px]">
                        {item.amount} {item.unit}
                      </td>

                      {/* Calories */}
                      <td className="p-4 font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {item.calories} kcal
                      </td>

                      {/* Protein */}
                      <td className="p-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.protein} g
                      </td>

                      {/* Logged By */}
                      <td className="p-4">
                        {item.meal?.user ? (
                          <div className="flex flex-col text-[11px]">
                            <span className="font-semibold text-obsidian-950 dark:text-white">
                              {item.meal.user.name || "Unnamed User"}
                            </span>
                            <span className="text-[10px] font-mono text-obsidian-950/50 dark:text-white/50 truncate">
                              {item.meal.user.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-obsidian-950/40 dark:text-white/40 italic">
                            Unknown
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-4 font-mono text-[11px] text-obsidian-950/60 dark:text-white/60">
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
                          className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border border-black/10 dark:border-white/10 hover:border-gold-accent hover:text-gold-accent transition-colors bg-white/50 dark:bg-obsidian-950 cursor-pointer"
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
            <div className="p-4 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
              <span className="text-obsidian-950/60 dark:text-white/60">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="p-2 bg-white dark:bg-obsidian-950 border border-black/10 dark:border-white/10 disabled:opacity-40 hover:border-gold-accent transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-gold-accent/10 border border-gold-accent/30 text-gold-accent font-bold">
                  {page}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages || loading}
                  className="p-2 bg-white dark:bg-obsidian-950 border border-black/10 dark:border-white/10 disabled:opacity-40 hover:border-gold-accent transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Food Details Modal */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#f8f6f1] dark:bg-obsidian-900 border border-gold-accent/40 max-w-lg w-full p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <span className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-gold-accent" />
            <span className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-gold-accent" />

            <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-gold-accent/15 border border-gold-accent/40 text-gold-accent font-mono font-bold text-sm">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-obsidian-950 dark:text-white">
                    {selectedFood.foodName}
                  </h3>
                  <p className="text-xs font-mono text-obsidian-950/60 dark:text-white/60">
                    ID: #{selectedFood.id} &bull; {selectedFood.meal?.mealType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="text-obsidian-950/50 dark:text-white/50 hover:text-gold-accent transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs font-mono">
              {/* Nutritional Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-white/50 dark:bg-obsidian-950 border border-black/5 dark:border-white/5">
                <div>
                  <span className="text-[10px] uppercase text-obsidian-950/50 dark:text-white/50 block">
                    Serving Amount
                  </span>
                  <span className="font-bold text-obsidian-950 dark:text-white mt-0.5 block">
                    {selectedFood.amount} {selectedFood.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-obsidian-950/50 dark:text-white/50 block">
                    Meal Type
                  </span>
                  <span className="font-bold text-gold-accent mt-0.5 block">
                    {selectedFood.meal?.mealType || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-obsidian-950/50 dark:text-white/50 block">
                    Calories
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {selectedFood.calories} kcal
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-obsidian-950/50 dark:text-white/50 block">
                    Protein
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {selectedFood.protein} g
                  </span>
                </div>
              </div>

              {/* User Metadata */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-gold-accent mb-2 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Logged User & Timestamp</span>
                </h4>
                <div className="p-3 bg-white/50 dark:bg-obsidian-950 border border-black/5 dark:border-white/5 space-y-1.5 text-[11px]">
                  <div>
                    User:{" "}
                    <strong className="text-obsidian-950 dark:text-white">
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

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedFood(null)}
                className="px-5 py-2 text-xs font-mono uppercase bg-obsidian-950 text-white dark:bg-white dark:text-obsidian-950 hover:bg-gold-accent dark:hover:bg-gold-accent dark:hover:text-obsidian-950 transition-colors cursor-pointer"
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
