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
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="
        relative flex items-center justify-center group
        w-9 h-9 
        bg-white/70 dark:bg-obsidian-900 
        border border-black/10 dark:border-white/10 
        hover:border-gold-accent
        transition-colors duration-300
        focus:outline-none focus:border-gold-accent
        active:scale-95
      "
        >
            {/* Accent corner brackets to enhance sharp mechanical design */}
            <span className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-transparent group-hover:border-gold-accent transition-colors duration-300"></span>
            <span className="absolute -bottom-px -right-px w-1.5 h-1.5 border-b border-r border-transparent group-hover:border-gold-accent transition-colors duration-300"></span>

            <div className="relative w-4 h-4 overflow-hidden">
                <Sun
                    className={`
                        absolute inset-0 w-full h-full text-obsidian-950 dark:text-white group-hover:text-gold-accent
                        transition-all duration-500 ease-spring
                        ${isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}
                    `}
                />
                <Moon
                    className={`
                        absolute inset-0 w-full h-full text-obsidian-950 dark:text-white group-hover:text-gold-accent
                        transition-all duration-500 ease-spring
                        ${isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}
                    `}
                />
            </div>
        </button>
    );
}