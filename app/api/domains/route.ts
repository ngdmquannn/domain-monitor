import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { addUserToDomain } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/dev-session";

// Validate path stays within ./data to prevent path traversal
const DATA_DIR = path.resolve("./data");
const EXTRA_DOMAINS_FILE = (() => {
  const p = path.resolve(process.env.EXTRA_DOMAINS_PATH || "./data/domains-extra.json");
  if (!p.startsWith(DATA_DIR)) throw new Error("Invalid EXTRA_DOMAINS_PATH");
  return p;
})();

interface ExtraDomain { name: string; addedAt: string; }

function getManagedDomains(): string[] {
  return (process.env.MANAGED_DOMAINS || "").split(",").map(d => d.trim().toLowerCase()).filter(Boolean);
}

async function loadExtraDomains(): Promise<ExtraDomain[]> {
  try { return JSON.parse(await fs.readFile(EXTRA_DOMAINS_FILE, "utf-8")); } catch { return []; }
}

async function saveExtraDomains(domains: ExtraDomain[]): Promise<void> {
  await fs.mkdir(path.dirname(EXTRA_DOMAINS_FILE), { recursive: true });
  await fs.writeFile(EXTRA_DOMAINS_FILE, JSON.stringify(domains, null, 2), "utf-8");
}

async function checkAdminAccess(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user?.isAdmin;
}

export async function GET() {
  const managed = getManagedDomains();
  const extra = await loadExtraDomains();
  return NextResponse.json({
    managed,
    extra: extra.map(d => d.name),
    all: [...managed, ...extra.map(d => d.name).filter(n => !managed.includes(n))],
  });
}

export async function DELETE(request: NextRequest) {
  if (!await checkAdminAccess()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const domain = request.nextUrl.searchParams.get("domain")?.trim().toLowerCase();
  if (!domain) return NextResponse.json({ error: "Thiếu domain" }, { status: 400 });
  if (getManagedDomains().includes(domain)) return NextResponse.json({ error: "Không thể xóa domain cấu hình gốc" }, { status: 403 });

  const extra = await loadExtraDomains();
  const idx = extra.findIndex(d => d.name === domain);
  if (idx === -1) return NextResponse.json({ error: "Domain không tìm thấy" }, { status: 404 });

  extra.splice(idx, 1);
  await saveExtraDomains(extra);
  return NextResponse.json({ ok: true, domain });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const domain = typeof body?.domain === "string" ? body.domain.trim().toLowerCase() : "";
  if (!domain || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/.test(domain))
    return NextResponse.json({ error: "Domain không hợp lệ" }, { status: 400 });

  const managed = getManagedDomains();
  const extra = await loadExtraDomains();
  const alreadyExists = managed.includes(domain) || extra.some(d => d.name === domain);

  if (!alreadyExists) {
    // Only admin can add new domains to the global list
    if (!user.isAdmin) return NextResponse.json({ error: "Chỉ admin mới có thể thêm domain mới" }, { status: 403 });
    extra.push({ name: domain, addedAt: new Date().toISOString() });
    await saveExtraDomains(extra);
  }

  // Auto-assign domain to the user who added it (non-admin)
  if (!user.isAdmin) {
    await addUserToDomain(user.email, domain);
  }

  return NextResponse.json({ ok: true, domain });
}
