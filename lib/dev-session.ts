/**
 * Get current user email — works both in prod (next-auth session)
 * and local dev (DEV_ADMIN_EMAIL / DEV_USER_EMAIL env vars).
 */
import { auth } from "@/auth";
import { isAdmin } from "@/lib/permissions";

export interface DevUser {
  email: string;
  isAdmin: boolean;
}

export async function getCurrentUser(): Promise<DevUser | null> {
  // When OIDC is disabled, resolve identity from DEV_*_EMAIL env vars
  // (lets you preview admin/user UIs locally without Keycloak)
  if (process.env.OIDC_ENABLED !== "true") {
    const adminEmail = process.env.DEV_ADMIN_EMAIL;
    if (adminEmail) return { email: adminEmail, isAdmin: true };
    const userEmail = process.env.DEV_USER_EMAIL;
    if (userEmail) return { email: userEmail, isAdmin: false };
    return null;
  }

  const session = await auth();
  if (!session?.user?.email) return null;
  return { email: session.user.email, isAdmin: isAdmin(session.user.email) };
}
