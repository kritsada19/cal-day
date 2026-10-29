"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import axios from "axios";
import {
  LayoutDashboard,
  Plus,
  TrendingUp,
  CreditCard,
  User,
  Users,
  Utensils,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { logger } from "@/lib/logger";
import { setLocaleCookie } from "@/lib/i18n";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useTranslations } from "next-intl";

interface NavItem {
  label: string;
  href: string;
  active: boolean;
  icon: LucideIcon;
}

type ProfileApiResponse = {
  subscription?: {
    plan?: string | null;
  } | null;
  dailyProgress: {
    calories: { consumed: number; target: number; percent: number };
    protein: { consumed: number; target: number; percent: number };
  };
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const sideLinkClass = (active: boolean) =>
  `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-200 ${focusRing} ${active
    ? "bg-primary-tint text-primary"
    : "text-muted hover:bg-primary-tint hover:text-ink"
  }`;

function Brand({ wordmarkClassName = "" }: { wordmarkClassName?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-3 rounded-xl ${focusRing}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden="true"
        >
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
          <polygon points="12 7 17 10 17 14 12 17 7 14 7 10" fill="currentColor" fillOpacity="0.25" />
        </svg>
      </span>
      <span className={`flex flex-col leading-tight ${wordmarkClassName}`}>
        <span className="text-lg font-bold tracking-tight text-ink">CALDAY</span>
        <span className="text-xs text-muted">Daily tracker</span>
      </span>
    </Link>
  );
}

function TabLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={item.active ? "page" : undefined}
      className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-200 ${focusRing} ${item.active ? "text-primary" : "text-muted"
        }`}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function TabAction({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={item.active ? "page" : undefined}
      className={`relative flex min-h-16 flex-col items-center justify-end pb-2 text-xs font-medium ${focusRing} ${item.active ? "text-primary" : "text-muted"
        }`}
    >
      <span className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-on-primary shadow-lift ring-4 ring-surface transition-colors duration-200 hover:bg-primary-hover">
        <Icon className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
      </span>
      {item.label}
    </Link>
  );
}

function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const handleToggleLocale = () => {
    const nextLocale = locale === "th" ? "en" : "th";

    // จัดการการสร้าง cookie ผ่าน helper เพื่อให้โปรเจกต์ไม่ต้องสร้าง raw cookie string
    // กระจายไปตาม component และสามารถบังคับ SameSite/Secure ได้ในที่เดียว
    setLocaleCookie(nextLocale);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleToggleLocale}
      aria-label="Switch language"
      className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-canvas px-3 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-primary-tint ${focusRing}`}
    >
      {locale === "th" ? "EN" : "ไทย"}
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const t = useTranslations("navbar");
  const [userData, setUserData] = useState<ProfileApiResponse | null>(null);

  const consumed = userData?.dailyProgress.calories.consumed ?? 0;
  const target = userData?.dailyProgress.calories.target ?? 0;

  const percentage = Math.min((consumed / target) * 100, 100);
  const remaining = Math.max(target - consumed, 0);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await axios.get<ProfileApiResponse>("/api/profile");
      setUserData(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return;
      }

      logger.error({ err: error }, "Error fetching profile data");
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.user || session.user.role === "ADMIN") {
      return;
    }

    const fetchData = async () => {
      await fetchProfile();
    };
    fetchData();
  }, [fetchProfile, session, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.user || session.user.role === "ADMIN") {
      return;
    }

    // สร้างการเชื่อมต่อ SSE จาก Browser → Server
    const eventSource = new EventSource("/api/events");

    // เมื่อ EventSource ได้รับ message จาก Server → ให้เรียกฟังก์ชันนี้
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (Number(data.userId) !== (session?.user?.id)) {
        return;
      }

      // ถ้าเป็นเหตุการณ์ที่เกี่ยวกับมื้ออาหาร → ให้โหลดข้อมูลโปรไฟล์ใหม่
      if (data.type === "meal.created" || data.type === "meal.deleted" || data.type === "profile.updated") {
        fetchProfile();
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
    };

    // Clean up เมื่อ Component Unmount
    // ไปเรียก cancel() ที่ app/api/events/route.ts
    return () => {
      eventSource.close();
    };
  }, [session?.user, fetchProfile, status]); // ต้องใส่ fetchProfile เป็น Dependency

  if (!mounted) return null;

  const isAdmin = session?.user?.role === "ADMIN";
  const profileHref = isAdmin ? "/admin/profile" : "/profile";
  const plan = userData?.subscription?.plan;

  const dashboardItem: NavItem = { label: t("dashboard"), href: "/dashboard", active: pathname === "/dashboard", icon: LayoutDashboard };
  const newEntryItem: NavItem = { label: t("newEntry"), href: "/meals/new", active: pathname === "/meals/new", icon: Plus };
  const analyticsItem: NavItem = { label: t("analytics"), href: "/analytics", active: pathname === "/analytics", icon: TrendingUp };
  const subscriptionItem: NavItem = { label: t("subscription"), href: "/subscription", active: pathname === "/subscription", icon: CreditCard };
  const profileItem: NavItem = { label: t("profile"), href: profileHref, active: pathname === profileHref, icon: User };

  const navItemsForUser: NavItem[] = [dashboardItem, newEntryItem, analyticsItem, subscriptionItem];

  const navItemsForAdmin: NavItem[] = [
    { label: t("dashboard"), href: "/admin/dashboard", active: pathname === "/admin/dashboard", icon: LayoutDashboard },
    { label: t("users"), href: "/admin/users", active: pathname === "/admin/users", icon: Users },
    { label: t("foods"), href: "/admin/foods", active: pathname === "/admin/foods", icon: Utensils },
  ];

  /* ───────────── Logged out: simple top header ───────────── */
  if (!session?.user) {
    return (
      <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-280 items-center justify-between gap-2 px-4 sm:px-6">
          <Brand wordmarkClassName="hidden min-[400px]:flex" />

          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <Link
              href="/signin"
              className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-ink sm:px-4 ${focusRing}`}
            >
              {t("logIn")}
            </Link>
            <Link
              href="/signup"
              className={`inline-flex min-h-11 items-center rounded-xl bg-primary px-3 text-sm font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover sm:px-4 ${focusRing}`}
            >
              <span className="sm:hidden">{t("signUp")}</span>
              <span className="hidden sm:inline">{t("createAccount")}</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
    );
  }

  /* ───────────── Logged in ───────────── */
  const desktopItems = isAdmin ? navItemsForAdmin : navItemsForUser;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col gap-6 overflow-y-auto border-r border-line bg-surface p-4 lg:flex">
        <div className="px-1 pt-1">
          <Brand />
        </div>

        <nav aria-label="Main" className="flex flex-col gap-1">
          {desktopItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={sideLinkClass(item.active)}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {!isAdmin && (
          <div className="rounded-2xl border border-line bg-canvas p-4">
            {target > 0 ? (
              <>
                <p className="text-sm font-medium text-muted">{t("dailyBalance")}</p>
                <p className="mt-1 text-ink">
                  <span className="text-2xl font-bold tabular-nums">{consumed}</span>
                  <span className="text-sm text-muted tabular-nums"> / {target} {t("dailyCalories")}</span>
                </p>
                <div
                  role="progressbar"
                  aria-label={t("dailyCalories")}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(percentage)}
                  className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary-tint"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted tabular-nums">{remaining} {t("kcalLeft")}</p>
              </>
            ) : (
              <Link
                href="/profile/form"
                className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover ${focusRing}`}
              >
                {t("fillProfile")}
              </Link>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 border-t border-line pt-4">
          <Link
            href={profileHref}
            className={`flex items-center gap-3 rounded-xl p-2 transition-colors duration-200 hover:bg-primary-tint ${focusRing}`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-highlight text-sm font-bold text-ink">
              {session?.user?.name?.substring(0, 2)}
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold text-ink">{session?.user?.name}</span>
              {plan && <span className="text-xs text-muted">{plan} {t("plan")}</span>}
            </span>
          </Link>

          <div className="flex items-center justify-between gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className={`flex min-h-11 flex-1 items-center gap-3 rounded-xl px-3 text-sm font-medium text-danger transition-colors duration-200 hover:bg-primary-tint ${focusRing}`}
            >
              <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              {t("signOut")}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Brand wordmarkClassName="hidden min-[360px]:flex" />

        <div className="flex min-w-0 items-center gap-1">
          <LanguageSwitcher />
          {!isAdmin &&
            (target > 0 ? (
              <div className="mr-1 flex min-w-0 flex-col items-end">
                <span className="text-xs font-semibold text-ink tabular-nums">
                  {consumed} / {target} kcal
                </span>
                <div
                  role="progressbar"
                  aria-label="Daily calories"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(percentage)}
                  className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-primary-tint"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ) : (
              <Link
                href="/profile/form"
                className={`mr-1 inline-flex min-h-11 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover ${focusRing}`}
              >
                Fill profile
              </Link>
            ))}
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            aria-label="Sign out"
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-danger transition-colors duration-200 hover:bg-primary-tint ${focusRing}`}
          >
            <LogOut className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-lift lg:hidden"
      >
        {isAdmin ? (
          <div className="grid grid-cols-4">
            {[...navItemsForAdmin, profileItem].map((item) => (
              <TabLink key={item.label} item={item} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-5">
            <TabLink item={dashboardItem} />
            <TabLink item={analyticsItem} />
            <TabAction item={newEntryItem} />
            <TabLink item={subscriptionItem} />
            <TabLink item={profileItem} />
          </div>
        )}
      </nav>
    </>
  );
}