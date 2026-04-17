import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin, getUsersForDomain, addUserToDomain, removeUserFromDomain } from "@/lib/permissions";

function isDevAdmin(): boolean {
  return process.env.OIDC_ENABLED !== "true" && !!process.env.DEV_ADMIN_EMAIL;
}

async function checkAdmin(): Promise<boolean> {
  if (isDevAdmin()) return true;
  const session = await auth();
  return !!(session?.user?.email && isAdmin(session.user.email));
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const domain = req.nextUrl.searchParams.get("domain");
  if (!domain) return NextResponse.json({ error: "domain required" }, { status: 400 });
  const users = await getUsersForDomain(domain);
  return NextResponse.json({ domain, users });
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { email, domain } = await req.json();
  if (!email || !domain) return NextResponse.json({ error: "email and domain required" }, { status: 400 });
  await addUserToDomain(email, domain);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { email, domain } = await req.json();
  if (!email || !domain) return NextResponse.json({ error: "email and domain required" }, { status: 400 });
  await removeUserFromDomain(email, domain);
  return NextResponse.json({ ok: true });
}
