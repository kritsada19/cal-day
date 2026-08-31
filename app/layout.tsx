import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import SessionProvider from "@/app/components/providers/SesstionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Toaster } from "sonner";


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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-obsidian-950 text-white selection:bg-gold-accent selection:text-black antialiased">
        <SessionProvider session={session}>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          {/* A single root-level host lets every client page show consistent toast feedback. */}
          <Toaster theme="dark" richColors position="top-right" />
        </SessionProvider>
      </body>
    </html >
  );
}
