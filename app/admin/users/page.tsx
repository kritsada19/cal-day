"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import {
    Users,
    Search,
    Filter,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Shield,
    Crown,
    User as UserIcon,
    X,
    Trash2,
    AlertTriangle,
} from "lucide-react";

interface UserProfile {
    gender: string | null;
    age: number | null;
    weight: number | null;
    height: number | null;
    exerciseLevel: string | null;
    goal: string | null;
}

interface UserSubscription {
    plan: string;
    status: string;
    startAt: string | null;
    endAt: string | null;
}

interface AdminUser {
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

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface UsersApiResponse {
    users: AdminUser[];
    pagination: PaginationMeta;
}

export default function AdminUsersPage() {
    const { data: session, status } = useSession();

    const [users, setUsers] = useState<AdminUser[]>([]);
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
    const [roleFilter, setRoleFilter] = useState("");
    const [planFilter, setPlanFilter] = useState("");
    const [page, setPage] = useState(1);

    // Delete modal state
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", "10");
            if (search.trim()) params.set("search", search.trim());
            if (roleFilter) params.set("role", roleFilter);
            if (planFilter) params.set("plan", planFilter);

            const response = await axios.get<UsersApiResponse>(
                `/api/admin/users?${params.toString()}`
            );
            setUsers(response.data.users);
            setPagination(response.data.pagination);
        } catch (err: unknown) {
            if (axios.isAxiosError<{ message?: string }>(err)) {
                setError(
                    err.response?.data?.message || "Failed to load user management data"
                );
            } else {
                setError("Failed to load user management data");
            }
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter, planFilter]);

    useEffect(() => {
        if (status === "authenticated" && session?.user?.role === "ADMIN") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchUsers();
        }
    }, [status, session, fetchUsers]);

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        setDeleteError(null);

        try {
            await axios.delete(`/api/admin/users/${userToDelete.id}`);
            setUserToDelete(null);
            fetchUsers();
        } catch (err: unknown) {
            if (axios.isAxiosError<{ message?: string }>(err)) {
                setDeleteError(
                    err.response?.data?.message || "Failed to delete user account"
                );
            } else {
                setDeleteError("Failed to delete user account");
            }
        } finally {
            setIsDeleting(false);
        }
    };

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

    // Summary counts from current page or estimations
    const proCount = users.filter((u) => u.subscription?.plan === "PRO").length;
    const adminCount = users.filter((u) => u.role === "ADMIN").length;

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
                            User Directory
                        </h1>
                        <p className="text-xs text-obsidian-950/60 dark:text-white/60 mt-1">
                            Manage system accounts, subscription tiers, and client profiles.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchUsers()}
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
                                    Total Accounts
                                </p>
                                <p className="text-2xl font-bold mt-1">{pagination.total}</p>
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center bg-gold-accent/10 border border-gold-accent/30 text-gold-accent">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 relative group">
                        <span className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-emerald-accent" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-obsidian-950/60 dark:text-white/60">
                                    PRO Plan Users
                                </p>
                                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                                    {proCount}
                                </p>
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
                                <Crown className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 relative group">
                        <span className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-gold-accent" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-obsidian-950/60 dark:text-white/60">
                                    Administrators
                                </p>
                                <p className="text-2xl font-bold mt-1 text-gold-accent">
                                    {adminCount}
                                </p>
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center bg-gold-accent/10 border border-gold-accent/30 text-gold-accent">
                                <Shield className="w-5 h-5" />
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
                            placeholder="Search by name or email..."
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
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-obsidian-950/40 dark:text-white/40 hover:text-gold-accent"
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

                        {/* Role filter */}
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setPage(1);
                            }}
                            className="px-3 py-2 text-xs bg-white dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-accent focus:outline-none transition-colors"
                        >
                            <option value="">All Roles</option>
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>

                        {/* Plan filter */}
                        <select
                            value={planFilter}
                            onChange={(e) => {
                                setPlanFilter(e.target.value);
                                setPage(1);
                            }}
                            className="px-3 py-2 text-xs bg-white dark:bg-obsidian-950 border border-black/10 dark:border-white/10 focus:border-gold-accent focus:outline-none transition-colors"
                        >
                            <option value="">All Plans</option>
                            <option value="FREE">FREE</option>
                            <option value="PRO">PRO</option>
                        </select>
                    </div>
                </div>

                {/* Error Notification */}
                {error && (
                    <div className="p-4 mb-6 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
                        <span>{error}</span>
                        <button
                            onClick={() => fetchUsers()}
                            className="underline font-mono uppercase text-[10px] hover:text-red-500"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Users Table / Grid */}
                <div className="bg-white/80 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 overflow-hidden relative">
                    <span className="absolute -top-px -left-px w-2 h-2 border-t border-l border-gold-accent" />
                    <span className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-gold-accent" />

                    {loading ? (
                        <div className="p-12 text-center text-xs font-mono tracking-widest text-gold-accent uppercase flex items-center justify-center gap-3">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Fetching user records...</span>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-12 text-center text-obsidian-950/60 dark:text-white/60 text-xs font-mono">
                            No user accounts found matching the search criteria.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 font-mono text-[10px] uppercase tracking-widest text-obsidian-950/70 dark:text-white/70">
                                        <th className="p-4">User Info</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Subscription</th>
                                        <th className="p-4">Profile Stats</th>
                                        <th className="p-4">Registered Date</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                    {users.map((user) => {
                                        const initials = (user.name || user.email)
                                            .slice(0, 2)
                                            .toUpperCase();
                                        const isSelf = user.id === Number(session?.user?.id);

                                        return (
                                            <tr
                                                key={user.id}
                                                className="hover:bg-gold-accent/5 transition-colors group cursor-pointer"
                                            >
                                                {/* User Info */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 flex items-center justify-center bg-gold-accent/10 border border-gold-accent/30 text-gold-accent font-mono font-bold text-xs shrink-0">
                                                            {user.image ? (
                                                                <Image
                                                                    src={user.image}
                                                                    alt={user.name || user.email}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                initials
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold truncate text-obsidian-950 dark:text-white group-hover:text-gold-accent transition-colors">
                                                                {user.name || "Unnamed User"}
                                                            </p>
                                                            <p className="text-[11px] text-obsidian-950/60 dark:text-white/60 truncate font-mono">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Role */}
                                                <td className="p-4">
                                                    {user.role === "ADMIN" ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider uppercase bg-gold-accent/15 text-gold-accent border border-gold-accent/30">
                                                            <Shield className="w-3 h-3" />
                                                            ADMIN
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase bg-black/5 dark:bg-white/5 text-obsidian-950/70 dark:text-white/70 border border-black/10 dark:border-white/10">
                                                            <UserIcon className="w-3 h-3" />
                                                            USER
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Subscription */}
                                                <td className="p-4">
                                                    {user.subscription?.plan === "PRO" ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                                                            <Crown className="w-3 h-3" />
                                                            PRO
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase bg-black/5 dark:bg-white/5 text-obsidian-950/60 dark:text-white/60 border border-black/10 dark:border-white/10">
                                                            FREE
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Profile Stats */}
                                                <td className="p-4 text-obsidian-950/70 dark:text-white/70">
                                                    {user.profile ? (
                                                        <div className="flex flex-col text-[11px]">
                                                            <span>
                                                                {user.profile.gender || "-"},{" "}
                                                                {user.profile.age
                                                                    ? `${user.profile.age} yrs`
                                                                    : "-"}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-obsidian-950/50 dark:text-white/50">
                                                                {user.profile.weight
                                                                    ? `${user.profile.weight} kg`
                                                                    : "-"}{" "}
                                                                /{" "}
                                                                {user.profile.height
                                                                    ? `${user.profile.height} cm`
                                                                    : "-"}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-mono text-obsidian-950/40 dark:text-white/40 italic">
                                                            No profile data
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Registered Date */}
                                                <td className="p-4 font-mono text-[11px] text-obsidian-950/60 dark:text-white/60">
                                                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </td>

                                                {/* Actions */}
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={`/admin/users/${user.id}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border border-black/10 dark:border-white/10 hover:border-gold-accent hover:text-gold-accent transition-colors bg-white/50 dark:bg-obsidian-950"
                                                        >
                                                            View
                                                        </Link>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setUserToDelete(user);
                                                                setDeleteError(null);
                                                            }}
                                                            disabled={isSelf}
                                                            title={isSelf ? "Cannot delete your own account" : "Delete user"}
                                                            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-colors bg-white/50 dark:bg-obsidian-950 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                        <div className="p-4 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                            <span className="text-obsidian-950/60 dark:text-white/60">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total}{" "}
                                total users)
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1 || loading}
                                    className="p-2 bg-white dark:bg-obsidian-950 border border-black/10 dark:border-white/10 disabled:opacity-40 hover:border-gold-accent transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-3 py-1 bg-gold-accent/10 border border-gold-accent/30 text-gold-accent font-bold">
                                    {page}
                                </span>
                                <button
                                    onClick={() =>
                                        setPage((p) => Math.min(pagination.totalPages, p + 1))
                                    }
                                    disabled={page >= pagination.totalPages || loading}
                                    className="p-2 bg-white dark:bg-obsidian-950 border border-black/10 dark:border-white/10 disabled:opacity-40 hover:border-gold-accent transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Delete User Modal */}
            {userToDelete && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white dark:bg-obsidian-900 border border-red-500/40 shadow-2xl p-6 relative">
                        <span className="absolute -top-px -left-px w-2.5 h-2.5 border-t-2 border-l-2 border-red-500" />
                        <span className="absolute -bottom-px -right-px w-2.5 h-2.5 border-b-2 border-r-2 border-red-500" />

                        {/* Modal Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center bg-red-500/10 border border-red-500/30 text-red-500 shrink-0">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-obsidian-950 dark:text-white uppercase tracking-wider">
                                        Confirm Delete User
                                    </h3>
                                    <p className="text-[11px] font-mono text-obsidian-950/60 dark:text-white/60">
                                        Action requires administrator confirmation
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setUserToDelete(null)}
                                disabled={isDeleting}
                                className="text-obsidian-950/40 dark:text-white/40 hover:text-obsidian-950 dark:hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* User Details Box */}
                        <div className="p-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mb-4 text-xs font-mono">
                            <p className="font-semibold text-obsidian-950 dark:text-white truncate">
                                {userToDelete.name || "Unnamed User"}
                            </p>
                            <p className="text-obsidian-950/60 dark:text-white/60 text-[11px] truncate">
                                {userToDelete.email}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-[10px] text-obsidian-950/50 dark:text-white/50">
                                <span>ID: #{userToDelete.id}</span>
                                <span>•</span>
                                <span>Role: {userToDelete.role}</span>
                                <span>•</span>
                                <span>Plan: {userToDelete.subscription?.plan || "FREE"}</span>
                            </div>
                        </div>

                        <p className="text-xs text-obsidian-950/80 dark:text-white/80 mb-4 leading-relaxed">
                            Are you sure you want to permanently delete this user account? All associated profile data, meal records, and subscription history will be removed.
                        </p>

                        {deleteError && (
                            <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono">
                                {deleteError}
                            </div>
                        )}

                        {/* Modal Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setUserToDelete(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 transition-colors bg-white/50 dark:bg-obsidian-950 cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-5 py-2 text-xs font-mono uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-red-500/20"
                            >
                                {isDeleting ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Confirm Delete</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

