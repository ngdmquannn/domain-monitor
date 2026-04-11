import { NextRequest, NextResponse } from "next/server";
import { checkSsl } from "@/lib/ssl-checker";
import { getAllDomainNames } from "@/lib/domain-checker";

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain");

  if (domain) {
    const result = await checkSsl(domain.toLowerCase().trim());
    return NextResponse.json({ domain, ...result });
  }

  // All domains
  const names = await getAllDomainNames();
  const results = await Promise.all(
    names.map(async (name) => ({ domain: name, ...(await checkSsl(name)) }))
  );
  return NextResponse.json(results);
}
