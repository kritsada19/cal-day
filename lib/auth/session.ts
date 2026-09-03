import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Global helper function to get the current server session.
 * Use this function instead of directly calling `getServerSession(authOptions)` 
 * to ensure consistency across the project.
 * 
 * @returns {Promise<Session | null>} The current user session or null if unauthenticated.
 */
export async function getSession() {
  const session = await getServerSession(authOptions);
  return session;
}
