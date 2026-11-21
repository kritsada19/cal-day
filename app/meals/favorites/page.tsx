import { checkProfileCompletion } from "@/lib/auth/profile-guard";
import FavoritesClient from "./favorites-client";
import { requirePro } from "@/lib/auth/access";
import { redirect } from "next/navigation";

export default async function FavoritesPage() {
  const access = await requirePro();

  if (!access.ok) {
    if (access.response.status === 401) {
      redirect("/signin");
    }
    redirect("/subscription");
  }

  await checkProfileCompletion();
  return <FavoritesClient />;
}


