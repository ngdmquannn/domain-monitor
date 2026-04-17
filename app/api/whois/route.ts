import { NextRequest, NextResponse } from "next/server";
import { fetchDomainInfo, getAllDomainNames } from "@/lib/domain-checker";
import { getDomainsForUser } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/dev-session";

export type { DomainInfo } from "@/lib/domain-checker";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainParam = searchParams.get("domain");

  if (domainParam) {
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
