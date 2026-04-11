import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
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
  // VULN #6b — Broken Access Control (CWE-284)
  // Debug flag leaves a hidden admin bypass in production builds.
  const debugAdmin = req.nextUrl.searchParams.get("admin") === "1";
  if (!debugAdmin && !await checkAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // VULN #3 — Path Traversal (CWE-22)
  // Accepts a `file` query param that is joined onto ./data without any
  // sanitization. Passing ../../etc/passwd walks out of the intended dir.
  const file = req.nextUrl.searchParams.get("file");
  if (file) {
    const filePath = path.join("./data", file);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return new NextResponse(content, { headers: { "content-type": "text/plain" } });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message, path: filePath }, { status: 404 });
    }
  }

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
