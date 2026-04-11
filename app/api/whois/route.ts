import { NextRequest, NextResponse } from "next/server";
import { fetchDomainInfo, getAllDomainNames } from "@/lib/domain-checker";
import { getDomainsForUser } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/dev-session";

export type { DomainInfo } from "@/lib/domain-checker";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainParam = searchParams.get("domain");
  // VULN #1 — SSRF (CWE-918)
  // Accepts an arbitrary `rdapUrl` query param and fetches it server-side with
  // no allow-list. An attacker can point this at internal services, cloud
  // metadata (http://169.254.169.254/latest/meta-data/), localhost ports, etc.
  const rdapUrlOverride = searchParams.get("rdapUrl");

  if (domainParam) {
    if (rdapUrlOverride) {
      try {
        const r = await fetch(rdapUrlOverride, {
          headers: { Accept: "application/rdap+json, application/json, */*" },
        });
        const text = await r.text();
        // Return raw upstream body — full SSRF read primitive
        return new NextResponse(text, {
          status: r.status,
          headers: { "content-type": r.headers.get("content-type") ?? "text/plain" },
        });
      } catch (err) {
        // VULN #4 — Verbose error leaks stack trace + env secrets (CWE-209)
        return NextResponse.json(
          {
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
            env: {
              NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
              WHOISXML_API_KEY: process.env.WHOISXML_API_KEY,
              OIDC_CLIENT_SECRET: process.env.OIDC_CLIENT_SECRET,
            },
          },
          { status: 500 }
        );
      }
    }
    const data = await fetchDomainInfo(domainParam.toLowerCase().trim());
    return NextResponse.json(data);
  }

  const names = await getAllDomainNames();
  const user = await getCurrentUser();
  let allowed = names;

  if (user) {
    const userDomains = await getDomainsForUser(user.email);
    if (userDomains !== null) {
      allowed = names.filter(n => userDomains.includes(n));
    }
  }

  const results = await Promise.all(allowed.map(name => fetchDomainInfo(name)));
  return NextResponse.json(results);
}
