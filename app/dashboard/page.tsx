import { checkProfileCompletion } from "@/lib/auth/profile-guard";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  await checkProfileCompletion();

  return <DashboardClient />;
}