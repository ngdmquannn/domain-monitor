// Domain list is managed via MANAGED_DOMAINS env var.
// This file is kept for the DomainConfig type only.
// Do NOT hardcode domains here.

export type DomainProtocol = "rdap" | "whois-inet";

export interface DomainConfig {
  name: string;
  protocol?: DomainProtocol;
  rdapUrl?: string;
}

/** Empty — all domains come from MANAGED_DOMAINS env */
export const DOMAINS: DomainConfig[] = [];
