"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import { useTranslations } from "next-intl";
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

const focusRing =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const fieldClass = `min-h-11 rounded-xl border border-secondary bg-surface px-4 text-base text-ink placeholder:text-muted transition-colors duration-200 hover:border-primary focus:border-primary ${focusRing}`;
const tintButton = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-tint px-4 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const badgeBase = "inline-flex min-h-7 items-center gap-1 rounded-full px-3 text-sm font-semibold";

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const t = useTranslations("admin");

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

    // Summary counts from current page or estimations
    const proCount = users.filter((u) => u.subscription?.plan === "PRO").length;
    const adminCount = users.filter((u) => u.role === "ADMIN").length;

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
                            <span>{t("adminManagement")}</span>
                        </div>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                            {t("userDirectory")}
                        </h1>
                        <p className="mt-1 text-base text-muted">
                            {t("manageSystemAccounts")}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchUsers()}
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

                {/* Stats Overview */}
                <dl className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5 shadow-soft">
                        <div>
                            <dt className="text-sm text-muted">{t("totalAccounts")}</dt>
                            <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-ink">{pagination.total}</dd>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-tint text-primary">
                            <Users className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5 shadow-soft">
                        <div>
                            <dt className="text-sm text-muted">{t("proPlanUsers")}</dt>
                            <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-primary">
                                {proCount}
                            </dd>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-tint text-primary">
                            <Crown className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-5 shadow-soft">
                        <div>
                            <dt className="text-sm text-muted">{t("administrators")}</dt>
                            <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-ink">
                                {adminCount}
                            </dd>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-highlight text-ink">
                            <Shield className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                        </div>
                    </div>
                </dl>

                {/* Filter and Search Bar */}
                <div className="mb-6 flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft md:flex-row md:items-center">
                    <div className="relative w-full md:w-80">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.75} aria-hidden="true" />
                        <input
                            type="text"
                            aria-label={t("searchUsers")}
                            placeholder={t("searchByNameEmail")}
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
                                aria-label={t("clearSearch")}
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

                        {/* Role filter */}
                        <select
                            aria-label="Filter by role"
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setPage(1);
                            }}
                            className={`${fieldClass} cursor-pointer`}
                        >
                            <option value="">{t("allRoles")}</option>
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>

                        {/* Plan filter */}
                        <select
                            aria-label="Filter by plan"
                            value={planFilter}
                            onChange={(e) => {
                                setPlanFilter(e.target.value);
                                setPage(1);
                            }}
                            className={`${fieldClass} cursor-pointer`}
                        >
                            <option value="">{t("allPlans")}</option>
                            <option value="FREE">FREE</option>
                            <option value="PRO">PRO</option>
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
                            onClick={() => fetchUsers()}
                            className={`min-h-11 cursor-pointer rounded-lg px-3 text-sm font-semibold underline underline-offset-4 ${focusRing}`}
                        >
                            {t("retry")}
                        </button>
                    </div>
                )}

                {/* Users Table / Grid */}
                <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
                    {loading ? (
                        <div role="status" className="flex items-center justify-center gap-3 p-12 text-base text-muted">
                            <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" strokeWidth={1.75} aria-hidden="true" />
                            <span>{t("fetchingUserRecords")}</span>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-12 text-center text-base text-muted">
                            {t("noUsersFound")}
                        </div>
                    ) : (
                        <div
                            role="region"
                            aria-label="Users table"
                            tabIndex={0}
                            className={`overflow-x-auto ${focusRing}`}
                        >
                            <table className="w-full min-w-4xl border-collapse text-left text-base">
                                <thead>
                                    <tr className="border-b border-line bg-canvas text-sm font-semibold text-muted">
                                        <th scope="col" className="p-4">{t("userInfo")}</th>
                                        <th scope="col" className="p-4">{t("role")}</th>
                                        <th scope="col" className="p-4">{t("subscription")}</th>
                                        <th scope="col" className="p-4">{t("profileStats")}</th>
                                        <th scope="col" className="p-4">{t("registeredDate")}</th>
                                        <th scope="col" className="p-4 text-right">{t("actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {users.map((user) => {
                                        const initials = (user.name || user.email)
                                            .slice(0, 2)
                                            .toUpperCase();
                                        const isSelf = user.id === Number(session?.user?.id);

                                        return (
                                            <tr
                                                key={user.id}
                                                className="transition-colors duration-200 hover:bg-primary-tint"
                                            >
                                                {/* User Info */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-highlight text-sm font-bold text-ink">
                                                            {user.image ? (
                                                                <Image
                                                                    src={user.image}
                                                                    alt={user.name || user.email}
                                                                    width={40}
                                                                    height={40}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                initials
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-ink">
                                                                {user.name || t("unnamedUser")}
                                                            </p>
                                                            <p className="truncate text-sm text-muted">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Role */}
                                                <td className="p-4">
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
                                                </td>

                                                {/* Subscription */}
                                                <td className="p-4">
                                                    {user.subscription?.plan === "PRO" ? (
                                                        <span className={`${badgeBase} bg-primary-tint text-primary`}>
                                                            <Crown className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                                                            PRO
                                                        </span>
                                                    ) : (
                                                        <span className={`${badgeBase} border border-line text-muted`}>
                                                            FREE
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Profile Stats */}
                                                <td className="p-4 text-ink">
                                                    {user.profile ? (
                                                        <div className="flex flex-col text-sm">
                                                            <span>
                                                                {user.profile.gender || "-"},{" "}
                                                                {user.profile.age
                                                                    ? `${user.profile.age} yrs`
                                                                    : "-"}
                                                            </span>
                                                            <span className="text-sm text-muted tabular-nums">
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
                                                        <span className="text-sm italic text-muted">
                                                            {t("noProfileData")}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Registered Date */}
                                                <td className="p-4 text-sm text-muted tabular-nums">
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
                                                            className={tintButton}
                                                        >
                                                            {t("view")}
                                                        </Link>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setUserToDelete(user);
                                                                setDeleteError(null);
                                                            }}
                                                            disabled={isSelf}
                                                            title={isSelf ? t("cannotDeleteYourself") : t("deleteUser")}
                                                            className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-danger/40 px-4 text-sm font-semibold text-danger transition-colors duration-200 hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                                                        >
                                                            <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                                                            <span>{t("delete")}</span>
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
                        <div className="flex flex-col items-center justify-between gap-3 border-t border-line p-4 text-sm sm:flex-row">
                            <span className="text-muted">
                                {t("page")} {pagination.page} {t("of")} {pagination.totalPages} ({pagination.total}{" "}
                                {t("totalUsers")})
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1 || loading}
                                    aria-label="Previous page"
                                    className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-primary-tint text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                                >
                                    <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                                </button>
                                <span aria-current="page" className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-highlight px-3 font-bold text-ink tabular-nums">
                                    {page}
                                </span>
                                <button
                                    onClick={() =>
                                        setPage((p) => Math.min(pagination.totalPages, p + 1))
                                    }
                                    disabled={page >= pagination.totalPages || loading}
                                    aria-label="Next page"
                                    className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-primary-tint text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                                >
                                    <ChevronRight className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Delete User Modal */}
            {userToDelete && (
                <div
                    className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-user-title"
                >
                    <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lift">
                        {/* Modal Header */}
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
                                    <AlertTriangle className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                                </div>
                                <div>
                                    <h3 id="delete-user-title" className="text-lg font-semibold tracking-tight text-ink">
                                        {t("confirmDeleteUser")}
                                    </h3>
                                    <p className="text-sm text-muted">
                                        {t("actionRequiresConfirmation")}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setUserToDelete(null)}
                                disabled={isDeleting}
                                aria-label="Close dialog"
                                className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-ink disabled:opacity-50 ${focusRing}`}
                            >
                                <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                            </button>
                        </div>

                        {/* User Details Box */}
                        <div className="mb-4 rounded-xl border border-line bg-canvas p-3">
                            <p className="truncate font-semibold text-ink">
                                {userToDelete.name || "Unnamed User"}
                            </p>
                            <p className="truncate text-sm text-muted">
                                {userToDelete.email}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                                <span>{t("id")}: #{userToDelete.id}</span>
                                <span aria-hidden="true">•</span>
                                <span>{t("roleLabel")}: {userToDelete.role}</span>
                                <span aria-hidden="true">•</span>
                                <span>{t("plan")}: {userToDelete.subscription?.plan || "FREE"}</span>
                            </div>
                        </div>

                        <p className="mb-4 text-base leading-7 text-muted">
                            {t("confirmDeletePrompt")}
                        </p>

                        {deleteError && (
                            <div role="alert" className="mb-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm font-medium text-danger">
                                {deleteError}
                            </div>
                        )}

                        {/* Modal Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setUserToDelete(null)}
                                disabled={isDeleting}
                                className={tintButton}
                            >
                                {t("cancel")}
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={isDeleting}
                                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-danger px-5 text-sm font-semibold text-on-primary transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                            >
                                {isDeleting ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" strokeWidth={1.75} aria-hidden="true" />
                                        <span>{t("deleting")}</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                                        <span>{t("confirmDelete")}</span>
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