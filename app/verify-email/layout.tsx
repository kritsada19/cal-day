import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Verification — CalDay",
  description: "Verify your email address to activate your CalDay account and start tracking your nutrition.",
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
