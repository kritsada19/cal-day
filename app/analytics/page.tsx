import { checkProfileCompletion } from "@/lib/auth/profile-guard";
import AnalyticsClient from "./analytics-client";
import { requirePro } from "@/lib/auth/access";
import { redirect } from "next/navigation";


export default async function AnalyticsPage() {
    const access = await requirePro();

    if (!access.ok) {
        if (access.response.status === 401) {
            redirect("/signin");
        }
        redirect("/subscription")
    }
    
    await checkProfileCompletion();
    return <AnalyticsClient />;
}