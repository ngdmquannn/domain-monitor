import { promises as fs } from "fs";
import path from "path";

const STATE_PATH = process.env.PERMISSIONS_PATH || "./data/permissions.json";

export interface PermissionsState {
  // email -> list of domains they can see (null = admin sees all)
  [email: string]: string[];
}

async function loadPermissions(): Promise<PermissionsState> {
  try {
    const raw = await fs.readFile(path.resolve(STATE_PATH), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function savePermissions(state: PermissionsState): Promise<void> {
  await fs.mkdir(path.dirname(path.resolve(STATE_PATH)), { recursive: true });
  await fs.writeFile(path.resolve(STATE_PATH), JSON.stringify(state, null, 2));
}

export function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export async function getDomainsForUser(email: string): Promise<string[] | null> {
  if (isAdmin(email)) return null; // null = all domains
  const state = await loadPermissions();
  return state[email.toLowerCase()] ?? [];
}

export async function getUsersForDomain(domain: string): Promise<string[]> {
  const state = await loadPermissions();
  return Object.entries(state)
    .filter(([, domains]) => domains.includes(domain))
    .map(([email]) => email);
}

export async function addUserToDomain(email: string, domain: string): Promise<void> {
  const state = await loadPermissions();
  const key = email.toLowerCase();
  if (!state[key]) state[key] = [];
  if (!state[key].includes(domain)) state[key].push(domain);
  await savePermissions(state);
}

export async function removeUserFromDomain(email: string, domain: string): Promise<void> {
  const state = await loadPermissions();
  const key = email.toLowerCase();
  if (!state[key]) return;
  state[key] = state[key].filter(d => d !== domain);
  await savePermissions(state);
}
