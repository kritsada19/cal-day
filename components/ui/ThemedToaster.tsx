"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";
import { useEffect, useState, type CSSProperties } from "react";

// CalDay Design System colors for Sonner (values come from the CSS variables in globals.css,
// so they follow Light/Dark automatically).
const toastStyle = {
    fontFamily: "inherit",
    "--border-radius": "0.75rem",
    "--normal-bg": "var(--ds-surface)",
    "--normal-text": "var(--ds-ink)",
    "--normal-border": "var(--ds-line)",
    "--success-bg": "var(--ds-primary-tint)",
    "--success-text": "var(--ds-primary)",
    "--success-border": "var(--ds-line)",
    "--info-bg": "var(--ds-highlight)",
    "--info-text": "var(--ds-ink)",
    "--info-border": "var(--ds-line)",
    "--warning-bg": "var(--ds-highlight)",
    "--warning-text": "var(--ds-ink)",
    "--warning-border": "var(--ds-line)",
    "--error-bg": "color-mix(in srgb, var(--ds-danger) 10%, var(--ds-surface))",
    "--error-text": "var(--ds-danger)",
    "--error-border": "color-mix(in srgb, var(--ds-danger) 35%, var(--ds-surface))",
} as CSSProperties;

/**
 * Reads the resolved theme from next-themes and forwards it to Sonner's
 * <Toaster> so that toast notifications always match the active colour scheme.
 */
export default function ThemedToaster() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <Toaster
            theme={resolvedTheme === "light" ? "light" : "dark"}
            richColors
            position="bottom-right"
            closeButton
            duration={5000}
            style={toastStyle}
        />
    );
}