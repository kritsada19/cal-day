"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import axios from "axios";
import { toast } from "sonner";
import { passwordSchema, resetPasswordSchema } from "@/lib/validation/auth";

const focusRing =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const inputBase = `w-full min-h-11 rounded-xl border bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors duration-200 ${focusRing}`;
const inputClass = `${inputBase} border-secondary hover:border-primary focus:border-primary`;
const primaryButton = `inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

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
        <div className="relative flex min-h-[85vh] flex-1 items-center justify-center overflow-hidden bg-canvas px-4 py-10 text-ink selection:bg-highlight selection:text-ink">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/50 blur-3xl"
            />

            <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-8 md:p-10">
                <div className="mb-8 flex select-none flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-on-primary">
                        <svg
                            viewBox="0 0 24 24"
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            aria-hidden="true"
                        >
                            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
                            <polygon points="12 7 17 10 17 14 12 17 7 14 7 10" fill="currentColor" fillOpacity="0.25" />
                        </svg>
                    </div>

                    <span className="mt-4 text-xl font-bold tracking-tight text-ink">CALDAY</span>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Reset password</h1>
                </div>

                {!token ? (
                    <div className="space-y-6 text-center">
                        <p className="text-base leading-7 text-muted">
                            This reset link is missing a token. Request a new password reset from the sign in page.
                        </p>
                        <Link href="/forgot-password" className={primaryButton}>
                            Request a new link
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="reset-password" className="block text-sm font-medium text-ink">
                                New password
                            </label>
                            <input
                                id="reset-password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                aria-invalid={Boolean(password) && !passwordValid}
                                aria-describedby={password ? "reset-password-rules" : undefined}
                                className={inputClass}
                                placeholder="Enter a new password"
                            />

                            {password && (
                                <ul id="reset-password-rules" className="grid grid-cols-1 gap-1 pt-1 text-sm sm:grid-cols-2">
                                    {passwordChecks.map((rule) => (
                                        <li key={rule.label} className={rule.valid ? "font-medium text-primary" : "text-muted"}>
                                            <span aria-hidden="true">{rule.valid ? "✓" : "•"}</span> {rule.label}
                                            <span className="sr-only">{rule.valid ? " (met)" : " (not met)"}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-ink">
                                Confirm password
                            </label>
                            <input
                                id="reset-confirm-password"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                aria-invalid={Boolean(confirmPassword) && passwordMismatch}
                                aria-describedby={confirmPassword ? "reset-confirm-status" : undefined}
                                className={
                                    passwordMismatch
                                        ? `${inputBase} border-danger focus:border-danger`
                                        : inputClass
                                }
                                placeholder="Repeat your new password"
                            />
                            {passwordMismatch && (
                                <p id="reset-confirm-status" role="alert" className="text-sm font-medium text-danger">
                                    Passwords do not match
                                </p>
                            )}
                            {confirmPassword && !passwordMismatch && (
                                <p id="reset-confirm-status" className="text-sm font-medium text-primary">
                                    Passwords match
                                </p>
                            )}
                        </div>

                        <div className="space-y-3 pt-1">
                            {error && (
                                <p role="alert" className="text-sm font-medium text-danger">
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
                                className={primaryButton}
                            >
                                {loading ? "Resetting..." : "Reset password"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-8 border-t border-line pt-6 text-center text-sm">
                    <Link
                        href="/signin"
                        className={`rounded font-semibold text-primary underline underline-offset-4 transition-colors duration-200 hover:text-primary-hover ${focusRing}`}
                    >
                        Back to log in
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas">
                    <div role="status">
                        <span className="sr-only">Loading...</span>
                        <div
                            aria-hidden="true"
                            className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-primary motion-reduce:animate-none"
                        />
                    </div>
                </div>
            }
        >
            <ResetPasswordContent />
        </Suspense>
    );
}