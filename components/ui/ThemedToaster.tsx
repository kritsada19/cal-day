"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";

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
        />
    );
}
