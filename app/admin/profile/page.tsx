"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Shield, User as UserIcon, Mail, Fingerprint, LogOut, ArrowLeft } from "lucide-react";
import { signOut } from "next-auth/react";

export default function AdminProfilePage() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="min-h-[85vh] flex items-center justify-center bg-[#f8f6f1] dark:bg-obsidian-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-gold-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-mono tracking-widest text-gold-accent uppercase">
                        Loading Admin Profile...
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

    const user = session?.user;

    return (
        <div className="min-h-[85vh] flex-1 px-4 py-10 md:py-14 relative overflow-hidden bg-[#f8f6f1] dark:bg-obsidian-950 text-obsidian-950 dark:text-white transition-colors duration-300">
            {/* Subtle Background Gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.06),transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] pointer-events-none" />

            <div className="max-w-3xl mx-auto relative">

                <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-obsidian-950/50 dark:text-white/50 hover:text-gold-accent mb-8 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Dashboard</span>
                </Link>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Column: Avatar & Quick Actions */}
                    <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
                        <div className="bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 p-6 flex flex-col items-center text-center relative group">
                            <span className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 border-gold-accent" />
                            <span className="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 border-gold-accent" />

                            <div className="w-24 h-24 mb-4 bg-gold-accent/10 border border-gold-accent flex items-center justify-center text-3xl font-bold text-gold-accent uppercase relative">
                                {user?.name?.substring(0, 2) || "AD"}
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-obsidian-950 dark:bg-white border border-gold-accent flex items-center justify-center text-white dark:text-obsidian-950">
                                    <Shield className="w-4 h-4 text-gold-accent" />
                                </div>
                            </div>

                            <h2 className="text-lg font-bold">{user?.name || "Administrator"}</h2>
                            <p className="text-[10px] font-mono tracking-widest text-gold-accent uppercase mt-1">Super Admin</p>
                        </div>

                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="w-full flex items-center justify-center gap-2 p-4 bg-white/50 dark:bg-obsidian-900 border border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500 transition-all font-mono text-xs uppercase tracking-wider"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                        </button>
                    </div>

                    {/* Right Column: Details */}
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 p-6 relative">
                            <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-black/20 dark:border-white/20" />
                            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-black/20 dark:border-white/20" />

                            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.3em] text-gold-accent mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                                <Fingerprint className="w-4 h-4" />
                                <span>Identity Information</span>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-obsidian-950/50 dark:text-white/50 mb-1 flex items-center gap-2">
                                        <UserIcon className="w-3 h-3" />
                                        Full Name
                                    </p>
                                    <p className="text-base font-medium text-obsidian-950 dark:text-white">{user?.name || "Not specified"}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-obsidian-950/50 dark:text-white/50 mb-1 flex items-center gap-2">
                                        <Mail className="w-3 h-3" />
                                        Email Address
                                    </p>
                                    <p className="text-base font-medium text-obsidian-950 dark:text-white">{user?.email}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-obsidian-950/50 dark:text-white/50 mb-1 flex items-center gap-2">
                                        <Shield className="w-3 h-3" />
                                        System Role
                                    </p>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold tracking-wider uppercase bg-gold-accent/15 text-gold-accent border border-gold-accent/30">
                                        <Shield className="w-3 h-3" />
                                        {user?.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 p-6 relative">
                            <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-black/20 dark:border-white/20" />
                            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-black/20 dark:border-white/20" />

                            <h3 className="text-sm font-bold tracking-wider uppercase mb-2">Administrative Access</h3>
                            <p className="text-xs text-obsidian-950/60 dark:text-white/60 leading-relaxed font-mono">
                                You are currently logged in with <span className="text-gold-accent">Administrator Privileges</span>.
                                This account is exempt from daily calorie tracking and profile requirements. You have full access to the User Directory and Food Database management systems.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
