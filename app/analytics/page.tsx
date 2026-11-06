import { checkProfileCompletion } from "@/lib/auth/profile-guard";
import AnalyticsClient from "./analytics-client";

export default async function AnalyticsPage() {
    await checkProfileCompletion();

    return <AnalyticsClient />;
}