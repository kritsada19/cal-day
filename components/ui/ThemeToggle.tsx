"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const isDark = resolvedTheme === "dark";

    return (
        <button
            aria-label="Toggle theme"
            aria-pressed={isDark}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95 motion-reduce:transition-none"
        >
            <span className="relative h-5 w-5">
                <Sun
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className={`absolute inset-0 h-full w-full transition-all duration-200 motion-reduce:transition-none ${isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                        }`}
                />
                <Moon
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className={`absolute inset-0 h-full w-full transition-all duration-200 motion-reduce:transition-none ${isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
                        }`}
                />
            </span>
        </button>
    );
}