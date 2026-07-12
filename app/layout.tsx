import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import SessionProvider from "@/app/components/SesstionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CalDay // Daily Calorie Tracker",
  description: "Luxurious and precise daily calorie and metabolic chronometer.",
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
        </SessionProvider>
      </body>
    </html >
  );
}
