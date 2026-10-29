"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Shield, User as UserIcon, Mail, Fingerprint, LogOut, ArrowLeft } from "lucide-react";
import { signOut } from "next-auth/react";

const focusRing =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function AdminProfilePage() {
    const { data: session, status } = useSession();
    const t = useTranslations("admin");

    if (status === "loading") {
        return (
            <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas">
                <div role="status" className="flex flex-col items-center gap-4">
                    <div
                        aria-hidden="true"
                        className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-primary motion-reduce:animate-none"
                    />
                    <p className="text-base text-muted">{t("loadingAdminProfile")}</p>
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

    const user = session?.user;

    return (
        <div className="relative min-h-[85vh] flex-1 overflow-hidden bg-canvas px-4 py-8 text-ink selection:bg-highlight selection:text-ink md:py-12">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/40 blur-3xl"
            />

            <div className="relative mx-auto max-w-3xl">

                <Link
                    href="/admin/dashboard"
                    className={`mb-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-hover ${focusRing}`}
                >
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    <span>{t("backToDashboard")}</span>
                </Link>

                <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                    {/* Left Column: Avatar & Quick Actions */}
                    <div className="flex w-full shrink-0 flex-col gap-4 md:w-64">
                        <div className="flex flex-col items-center rounded-2xl border border-line bg-surface p-6 text-center shadow-soft">
                            <div className="relative mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-highlight text-3xl font-bold uppercase text-ink">
                                {user?.name?.substring(0, 2) || "AD"}
                                <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-primary text-on-primary">
                                    <Shield className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                                </div>
                            </div>

                            <h2 className="text-lg font-semibold tracking-tight text-ink">{user?.name || t("administrator")}</h2>
                            <p className="mt-1 text-sm font-medium text-muted">{t("superAdmin")}</p>
                        </div>

                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className={`flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-danger/40 bg-surface p-3 text-base font-semibold text-danger transition-colors duration-200 hover:bg-danger/10 ${focusRing}`}
                        >
                            <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                            <span>{t("signOut")}</span>
                        </button>
                    </div>

                    {/* Right Column: Details */}
                    <div className="flex flex-1 flex-col gap-6">
                        <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
                            <h1 className="mb-6 flex items-center gap-2 border-b border-line pb-4 text-lg font-semibold text-ink">
                                <Fingerprint className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
                                <span>{t("identityInformation")}</span>
                            </h1>

                            <dl className="space-y-6">
                                <div>
                                    <dt className="mb-1 flex items-center gap-2 text-sm text-muted">
                                        <UserIcon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                                        {t("fullName")}
                                    </dt>
                                    <dd className="text-base font-medium text-ink">{user?.name || t("notSpecified")}</dd>
                                </div>

                                <div>
                                    <dt className="mb-1 flex items-center gap-2 text-sm text-muted">
                                        <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                                        {t("emailAddress")}
                                    </dt>
                                    <dd className="break-all text-base font-medium text-ink">{user?.email}</dd>
                                </div>

                                <div>
                                    <dt className="mb-1 flex items-center gap-2 text-sm text-muted">
                                        <Shield className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                                        {t("systemRole")}
                                    </dt>
                                    <dd>
                                        <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-highlight px-3 text-sm font-semibold text-ink">
                                            <Shield className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                                            {user?.role}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
                            <h2 className="mb-2 text-lg font-semibold text-ink">{t("administrativeAccess")}</h2>
                            <p className="text-base leading-7 text-muted">
                                {t("adminAccessDescription").split("Administrator Privileges").length > 1 ? (
                                    <>
                                        {t("adminAccessDescription").split("Administrator Privileges")[0]}
                                        <span className="font-semibold text-ink">{t("adminPrivileges")}</span>
                                        {t("adminAccessDescription").split("Administrator Privileges")[1]}
                                    </>
                                ) : (
                                    t("adminAccessDescription")
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}