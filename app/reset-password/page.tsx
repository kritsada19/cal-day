"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import axios from "axios";
import { toast } from "sonner";
import { passwordSchema, resetPasswordSchema } from "@/lib/validation/auth";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const passwordMismatch = Boolean(confirmPassword && password && password !== confirmPassword);
    const passwordValid = passwordSchema.safeParse(password).success;
    const confirmValid = !passwordMismatch && confirmPassword.length > 0;
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const passwordChecks = [
        { label: "At least 8 characters", valid: password.length >= 8 },
        { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
        { label: "One lowercase letter", valid: /[a-z]/.test(password) },
        { label: "One number", valid: /\d/.test(password) },
    ];

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!token) {
            toast.error("Invalid reset password link.");
            return;
        }

        const validationResult = resetPasswordSchema.safeParse({ token, password, confirmPassword });

        if (!validationResult.success) {
            const message = validationResult.error.issues[0]?.message || "Please check your password.";
            setError(message);
            toast.error(message);
            return;
        }

        setError("");
        setLoading(true);

        try {
            const res = await axios.post("/api/auth/reset-password", {
                token,
                password,
                confirmPassword,
            });

            if (res.status === 200 || res.status === 201) {
                toast.success("Password reset successfully!");

                setTimeout(() => {
                    router.push("/signin");
                }, 1500);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data;

                const message =
                    data &&
                        typeof data === "object" &&
                        "message" in data &&
                        typeof data.message === "string"
                        ? data.message
                        : "Something went wrong. Please try again.";

                setError(message);
                toast.error(message);
            } else {
                setError("Something went wrong. Please try again.");
                toast.error("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex-1 flex items-center justify-center px-4 relative overflow-hidden bg-[#f8f6f1] dark:bg-obsidian-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="max-w-md w-full bg-white/80 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 p-8 md:p-10 shadow-glow-gold relative overflow-hidden">
                <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-gold-accent to-transparent"></div>

                <span className="absolute -top-px -left-px w-2.5 h-2.5 border-t border-l border-gold-accent"></span>
                <span className="absolute -top-px -right-px w-2.5 h-2.5 border-t border-r border-gold-accent"></span>
                <span className="absolute -bottom-px -left-px w-2.5 h-2.5 border-b border-l border-gold-accent"></span>
                <span className="absolute -bottom-px -right-px w-2.5 h-2.5 border-b border-r border-gold-accent"></span>

                <div className="flex flex-col items-center mb-8 select-none">
                    <div className="relative w-12 h-12 flex items-center justify-center bg-black/5 dark:bg-obsidian-950 border border-gold-accent/40 group hover:border-gold-accent transition-colors duration-300">
                        <span className="absolute -top-px -left-px w-1.25 h-1.25 border-t border-l border-gold-accent"></span>
                        <span className="absolute -bottom-px -right-px w-1.25 h-1.25 border-b border-r border-gold-accent"></span>

                        <svg
                            viewBox="0 0 24 24"
                            className="w-6 h-6 text-gold-accent group-hover:scale-110 group-hover:text-white transition-all duration-300"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
                            <polygon points="12 7 17 10 17 14 12 17 7 14 7 10" fill="currentColor" fillOpacity="0.2" />
                        </svg>
                    </div>

                    <div className="flex flex-col items-center mt-4 text-center">
                        <span className="text-xl font-bold tracking-[0.3em] text-obsidian-950 dark:text-white font-sans">
                            CALDAY
                        </span>
                        <span className="text-[9px] tracking-[0.45em] text-obsidian-950/40 dark:text-white/40 font-mono mt-1 uppercase">
                            RESET PASSWORD
                        </span>
                    </div>
                </div>

                {!token ? (
                    <div className="text-center space-y-6">
                        <p className="text-sm text-obsidian-950/60 dark:text-white/50 font-mono leading-relaxed">
                            This reset link is missing a token. Request a new password reset from the sign in page.
                        </p>
                        <Link
                            href="/forgot-password"
                            className="w-full block relative px-6 py-3.5 text-center bg-black/5 dark:bg-obsidian-950 border border-gold-accent/40 text-gold-accent hover:bg-gold-accent/10 hover:border-gold-accent hover:text-obsidian-950 dark:hover:text-white text-xs font-bold tracking-[0.25em] font-sans transition-all duration-300 group rounded-none"
                        >
                            Request a new link
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[9px] tracking-[0.25em] text-obsidian-950/50 dark:text-white/50 font-mono font-bold uppercase">
                                NEW PASSWORD
                            </label>
                            <div className="relative group">
                                <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>
                                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>

                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    aria-invalid={Boolean(password) && !passwordValid}
                                    className="w-full bg-white dark:bg-obsidian-950 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 focus:border-gold-accent/60 focus:outline-none px-4 py-3 text-sm text-obsidian-950 dark:text-white placeholder-obsidian-950/20 dark:placeholder-white/20 transition-all duration-300 font-mono rounded-none"
                                    placeholder="Enter a new password"
                                />
                            </div>

                            {password && (
                                <ul className="grid grid-cols-2 gap-1 text-[10px] tracking-wide font-mono text-obsidian-950/60 dark:text-white/60">
                                    {passwordChecks.map((rule) => (
                                        <li key={rule.label} className={rule.valid ? "text-emerald-600" : "text-red-500"}>
                                            {rule.valid ? "✓" : "•"} {rule.label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[9px] tracking-[0.25em] text-obsidian-950/50 dark:text-white/50 font-mono font-bold uppercase">
                                CONFIRM PASSWORD
                            </label>
                            <div className="relative group">
                                <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>
                                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>

                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    aria-invalid={Boolean(confirmPassword) && passwordMismatch}
                                    className="w-full bg-white dark:bg-obsidian-950 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 focus:border-gold-accent/60 focus:outline-none px-4 py-3 text-sm text-obsidian-950 dark:text-white placeholder-obsidian-950/20 dark:placeholder-white/20 transition-all duration-300 font-mono rounded-none"
                                    placeholder="Repeat your new password"
                                />
                            </div>
                            {passwordMismatch && (
                                <p className="text-[10px] tracking-wider font-mono text-red-400">Passwords do not match</p>
                            )}
                            {confirmPassword && !passwordMismatch && (
                                <p className="text-[10px] tracking-wider font-mono text-emerald-600">Passwords match</p>
                            )}
                        </div>

                        <div className="pt-2">
                            {error && (
                                <p role="alert" className="text-sm text-red-500 font-mono">
                                    {error}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    !password ||
                                    !confirmPassword ||
                                    passwordMismatch ||
                                    !passwordValid ||
                                    !confirmValid
                                }
                                className="w-full relative px-6 py-3.5 bg-black/5 dark:bg-obsidian-950 border border-gold-accent/40 text-gold-accent hover:text-obsidian-950 dark:hover:text-white hover:bg-gold-accent/10 hover:border-gold-accent text-xs font-bold tracking-[0.25em] font-sans transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group rounded-none"
                            >
                                <span className="absolute bottom-1.5 left-2.5 w-1.5 h-1.5 border-b border-l border-gold-accent/0 group-hover:border-gold-accent/60 transition-all duration-300"></span>
                                <span className="absolute top-1.5 right-2.5 w-1.5 h-1.5 border-t border-r border-gold-accent/0 group-hover:border-gold-accent/60 transition-all duration-300"></span>

                                {loading ? "Resetting..." : "Reset password"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 text-center relative">
                    <span className="text-[9px] tracking-widest text-obsidian-950/30 dark:text-white/30 font-mono">
                        <Link
                            href="/signin"
                            className="text-gold-accent hover:text-white transition-colors duration-300 font-bold underline underline-offset-4 decoration-gold-accent/20 hover:decoration-white/40"
                        >
                            Back to log in
                        </Link>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[85vh] flex-1 flex items-center justify-center bg-[#f8f6f1] dark:bg-obsidian-950">
                    <div className="w-5 h-5 border border-gold-accent/40 border-t-gold-accent animate-spin" />
                </div>
            }
        >
            <ResetPasswordContent />
        </Suspense>
    );
}
