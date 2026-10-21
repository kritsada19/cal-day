import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans, Noto_Sans_Thai } from "next/font/google";
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

// CalDay Design System fonts
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai"],
  display: "swap",
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
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} ${notoSansThai.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col bg-canvas text-ink selection:bg-highlight selection:text-ink antialiased transition-colors duration-300">
        <SessionProvider session={session}>
          <ThemeProvider>
            <Navbar />
            <main
              className={`flex-1 flex flex-col ${session?.user ? "pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-64" : ""}`}
            >
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