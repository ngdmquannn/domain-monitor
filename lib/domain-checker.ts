import { DOMAINS } from "@/config/domains";

// In-memory cache: domain -> { data, cachedAt }
const cache = new Map<string, { data: DomainInfo; cachedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface DomainInfo {
  domain: string;
  expiryDate: string | null;
  registrationDate: string | null;
  registrar: string | null;
  nameservers: string[];
  daysRemaining: number | null;
  status: "active" | "warning" | "expiring" | "expired" | "error";
  source: "rdap" | "whoisxml" | "whois-inet" | "unknown";
  error?: string;
}

function getDaysRemaining(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getStatus(days: number): DomainInfo["status"] {
  if (days <= 0) return "expired";
  if (days <= 30) return "expiring";  // đỏ: ≤ 30 ngày
  if (days <= 90) return "warning";   // vàng: ≤ 90 ngày
  return "active";
}

// TLDs without public RDAP → use whois-inet or other fallback
const WHOIS_INET_TLDS = new Set(["vn"]);

// Cache IANA bootstrap to avoid fetching repeatedly
let ianaBootstrap: Record<string, string[]> | null = null;
let ianaBootstrapFetchedAt = 0;
const IANA_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

async function getIanaBootstrap(): Promise<Record<string, string[]>> {
  if (ianaBootstrap && Date.now() - ianaBootstrapFetchedAt < IANA_CACHE_TTL) {
    return ianaBootstrap;
  }
  try {
    const res = await fetch("https://data.iana.org/rdap/dns.json", {
      next: { revalidate: 86400 },
    });
    const json = await res.json();
    // json.services = [ [["tld1","tld2",...], ["https://rdap.example/"]], ... ]
    const map: Record<string, string[]> = {};
    for (const [tlds, urls] of json.services as [string[], string[]][]) {
      for (const tld of tlds) {
        map[tld.toLowerCase()] = urls;
      }
    }
    ianaBootstrap = map;
    ianaBootstrapFetchedAt = Date.now();
    return map;
  } catch {
    return {};
  }
}

// Get RDAP URL for a given domain using IANA bootstrap
async function getRdapUrl(domain: string): Promise<string | null> {
  // Check configured domains first (explicit override)
  const configured = DOMAINS.find((d) => d.name === domain);
  if (configured?.rdapUrl) return configured.rdapUrl;

  const tld = domain.split(".").pop()?.toLowerCase();
  if (!tld) return null;

  // TLDs without public RDAP
  if (WHOIS_INET_TLDS.has(tld)) return null;

  // Lookup via IANA bootstrap
  const bootstrap = await getIanaBootstrap();
  const urls = bootstrap[tld];
  if (urls && urls.length > 0) {
    // Use first URL, append domain path
    const base = urls[0].replace(/\/$/, "");
    return `${base}/domain/${domain}`;
  }

  return null;
}

/**
 * Fetch domain info via whois.inet.vn JSON API (for .vn domains).
 * No API key required. Endpoint:
 *   GET https://whois.inet.vn/api/whois/domainspecify/<domain>
 *
 * Response fields used:
 *   expirationDate  – "dd-MM-yyyy"
 *   creationDate    – "dd-MM-yyyy"
 *   registrar       – registrar name string
 *   nameServer      – string[]
 */
async function fetchViaWhoisInet(domain: string): Promise<DomainInfo> {
  const url = `https://whois.inet.vn/api/whois/domainspecify/${encodeURIComponent(domain)}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`whois.inet.vn returned ${res.status}`);

  const json = await res.json();
  // code "0" means registered / data available
  if (json.code !== "0") {
    throw new Error(`whois.inet.vn: domain not found or unregistered (code ${json.code})`);
  }

  // expirationDate is "dd-MM-yyyy", e.g. "25-01-2029"
  function parseVnDate(ddmmyyyy: string): string | null {
    if (!ddmmyyyy) return null;
    const [dd, mm, yyyy] = ddmmyyyy.split("-");
    if (!dd || !mm || !yyyy) return null;
    return `${yyyy}-${mm}-${dd}T00:00:00Z`;
  }

  const expiryDate = parseVnDate(json.expirationDate) ?? null;
  const registrationDate = parseVnDate(json.creationDate) ?? null;
  const registrar: string | null = json.registrar ?? null;
  const nameservers: string[] = (json.nameServer ?? []).map((ns: string) =>
    ns.toLowerCase()
  );
  const daysRemaining = expiryDate ? getDaysRemaining(expiryDate) : null;

  return {
    domain,
    expiryDate,
    registrationDate,
    registrar,
    nameservers,
    daysRemaining,
    status: daysRemaining !== null ? getStatus(daysRemaining) : "error",
    source: "whois-inet",
  };
}

async function fetchViaRdap(domain: string, rdapUrl: string): Promise<DomainInfo> {
  const res = await fetch(rdapUrl, {
    headers: { Accept: "application/rdap+json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`RDAP returned ${res.status}`);
  const json = await res.json();

  const events: Array<{ eventAction: string; eventDate: string }> = json.events ?? [];
  const expiryEvent = events.find((e) => e.eventAction === "expiration");
  const regEvent = events.find((e) => e.eventAction === "registration");

  const nameservers: string[] = (json.nameservers ?? []).map(
    (ns: { ldhName?: string }) => (ns.ldhName ?? "").toLowerCase()
  );

  const entities: Array<{ roles: string[]; vcardArray?: unknown[] }> = json.entities ?? [];
  const registrarEntity = entities.find((e) => e.roles.includes("registrar"));
  let registrar: string | null = null;
  if (registrarEntity?.vcardArray) {
    const vcard = registrarEntity.vcardArray[1] as Array<[string, ...unknown[]]>;
    const fnEntry = vcard?.find((v) => v[0] === "fn");
    registrar = fnEntry ? String(fnEntry[3]) : null;
  }

  const expiryDate = expiryEvent?.eventDate ?? null;
  const daysRemaining = expiryDate ? getDaysRemaining(expiryDate) : null;

  return {
    domain,
    expiryDate,
    registrationDate: regEvent?.eventDate ?? null,
    registrar,
    nameservers,
    daysRemaining,
    status: daysRemaining !== null ? getStatus(daysRemaining) : "error",
    source: "rdap",
  };
}

async function fetchViaWhoisXml(domain: string): Promise<DomainInfo> {
  const apiKey = process.env.WHOISXML_API_KEY;
  if (!apiKey) {
    throw new Error("WHOISXML_API_KEY chưa được cấu hình. Thêm vào .env.local");
  }

  const url = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${domain}&outputFormat=JSON`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`WhoisXML returned ${res.status}`);

  const json = await res.json();
  const record = json.WhoisRecord;
  if (!record) throw new Error("Không tìm thấy dữ liệu WHOIS");

  const expiryDate = record.registryData?.expiresDate ?? record.expiresDate ?? null;
  const registrationDate = record.registryData?.createdDate ?? record.createdDate ?? null;
  const registrar = record.registrarName ?? null;
  const nameservers: string[] = (record.nameServers?.hostNames ?? []).map(
    (ns: string) => ns.toLowerCase()
  );
  const daysRemaining = expiryDate ? getDaysRemaining(expiryDate) : null;

  return {
    domain,
    expiryDate,
    registrationDate,
    registrar,
    nameservers,
    daysRemaining,
    status: daysRemaining !== null ? getStatus(daysRemaining) : "error",
    source: "whoisxml",
  };
}

export async function fetchDomainInfo(domain: string): Promise<DomainInfo> {
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const configured = DOMAINS.find((d) => d.name === domain);
    let data: DomainInfo;

    const tld = domain.split(".").pop()?.toLowerCase();
    const isWhoisInet = configured?.protocol === "whois-inet" || WHOIS_INET_TLDS.has(tld ?? "");

    if (isWhoisInet) {
      data = await fetchViaWhoisInet(domain);
    } else {
      const rdapUrl = await getRdapUrl(domain);
      if (rdapUrl) {
        data = await fetchViaRdap(domain, rdapUrl);
      } else {
        data = await fetchViaWhoisXml(domain);
      }
    }

    cache.set(domain, { data, cachedAt: Date.now() });
    return data;
  } catch (err) {
    return {
      domain,
      expiryDate: null,
      registrationDate: null,
      registrar: null,
      nameservers: [],
      daysRemaining: null,
      status: "error",
      source: "unknown",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Fetch domain info for all configured + extra domains in parallel.
 */
export async function fetchAllDomains(): Promise<DomainInfo[]> {
  const allNames = await getAllDomainNames();
  return Promise.all(allNames.map((name) => fetchDomainInfo(name)));
}

/**
 * Get all domain names from MANAGED_DOMAINS env (single source of truth).
 * Falls back to domains.ts if env not set.
 * Also merges domains added via search UI (data/domains-extra.json).
 */
export async function getAllDomainNames(): Promise<string[]> {
  const seen = new Set<string>();
  const all: string[] = [];

  // Primary: MANAGED_DOMAINS env var (comma-separated)
  const managed = process.env.MANAGED_DOMAINS || "";
  const base = managed.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);

  for (const d of base) {
    if (!seen.has(d)) { seen.add(d); all.push(d); }
  }

  // Secondary: domains added via search UI (data/domains-extra.json)
  try {
    const { promises: fs } = await import("fs");
    const path = await import("path");
    const filePath = process.env.EXTRA_DOMAINS_PATH || "./data/domains-extra.json";
    const raw = await fs.readFile(path.resolve(filePath), "utf-8");
    const fileExtra: Array<{ name: string }> = JSON.parse(raw);
    for (const d of fileExtra) {
      if (!seen.has(d.name)) { seen.add(d.name); all.push(d.name); }
    }
  } catch { /* file chưa tồn tại */ }

  return all;
}
