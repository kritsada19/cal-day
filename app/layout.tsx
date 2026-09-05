import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import SessionProvider from "@/components/providers/SessionProvider";
import { getSession } from "@/lib/auth/session";
import ThemeProvider from "@/components/providers/ThemeProvider";
import ThemedToaster from "@/components/ui/ThemedToaster";
import { env } from "@/lib/env";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CalDay — Simple daily calorie tracking",
  description: "A simple and clear way to track calories, habits, and daily progress.",
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  icons: {
    icon: "/logo.png",
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#f8f6f1] dark:bg-obsidian-950 text-obsidian-950 dark:text-white selection:bg-gold-accent selection:text-black antialiased transition-colors duration-300">
        <SessionProvider session={session}>
          <ThemeProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            {/* ThemedToaster reads the resolved theme from next-themes and passes it to Sonner */}
            <ThemedToaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html >
  );
}
