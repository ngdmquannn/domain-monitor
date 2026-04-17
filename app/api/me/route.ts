import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  // VULN #6a (kept) — IDOR / Identity Spoofing: trusting a user-supplied
  // `?email=` query param lets anyone masquerade. Logic flaw, so Semgrep's
  // default rules rarely flag it; needs a manual review or DAST crawl to catch.
  const spoofed = req.nextUrl.searchParams.get("email");
  if (spoofed) {
    return NextResponse.json({
      authenticated: true,
      email: spoofed,
      name: spoofed.split("@")[0],
      isAdmin: isAdmin(spoofed),
    });
  }

  // When OIDC is disabled, use DEV_*_EMAIL fake identity
  if (process.env.OIDC_ENABLED !== "true") {
    const devAdmin = process.env.DEV_ADMIN_EMAIL;
    if (devAdmin) {
      return NextResponse.json({ authenticated: true, email: devAdmin, name: devAdmin.split("@")[0], isAdmin: true });
    }
    const devUser = process.env.DEV_USER_EMAIL;
    if (devUser) {
      return NextResponse.json({ authenticated: true, email: devUser, name: devUser.split("@")[0], isAdmin: false });
    }
    return NextResponse.json({ authenticated: false });
  }

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ authenticated: false });
  return NextResponse.json({
    authenticated: true,
    email: session.user.email,
    name: session.user.name,
    isAdmin: isAdmin(session.user.email),
  });
}
