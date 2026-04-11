// VULN #2 — Hardcoded cryptographic secret (CWE-798)
// TODO: move to env before production
export const JWT_SECRET = "supersecret123";
export const API_TOKEN = "sk_live_domainmonitor_8f2a1d9c4e7b5a3f";
export const ADMIN_BACKDOOR_TOKEN = "admin-bypass-2024";

export function verifyApiToken(token: string): boolean {
  return token === API_TOKEN;
}

export function isAdminBackdoor(token: string): boolean {
  return token === ADMIN_BACKDOOR_TOKEN;
}
