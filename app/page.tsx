"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import DomainCard from "@/app/components/DomainCard";
import UserChip from "@/app/components/UserChip";
import { useTheme } from "@/app/components/ThemeProvider";
import type { DomainInfo } from "@/app/api/whois/route";
import type { SslInfo } from "@/lib/ssl-checker";

const REFRESH_MS = 60 * 60 * 1000;

function ThemeToggleTopbar() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button onClick={toggle} title={isDark ? "Light mode" : "Dark mode"} style={{
      display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
      borderRadius: 9999, border: "1px solid var(--border)",
      background: "var(--surface)", cursor: "pointer",
      transition: "all 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-md)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
    >
      {isDark ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#F5A623" }}>
          <circle cx="12" cy="12" r="5" opacity="0.9"/>
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#6c5ce7">
          <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
        </svg>
      )}
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-2)" }}>
        {isDark ? "Light" : "Dark"}
      </span>
    </button>
  );
}

function FilteredCards({
  domains, sslMap, filter, filterTab, search, setDomains, isAdmin,
}: {
  domains: DomainInfo[];
  sslMap: Record<string, SslInfo>;
  filter: string;
  filterTab: "domain" | "ssl";
  search: string;
  isAdmin: boolean;
  setDomains: React.Dispatch<React.SetStateAction<DomainInfo[]>>;
}) {
  const [animKey, setAnimKey] = useState(0);
  const prevFilter = React.useRef(filter);
  const prevSearch = React.useRef(search);
  const prevTab = React.useRef(filterTab);

  if (prevFilter.current !== filter || prevSearch.current !== search || prevTab.current !== filterTab) {
    prevFilter.current = filter;
    prevSearch.current = search;
    prevTab.current = filterTab;
    setAnimKey(k => k + 1);
  }

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return domains.filter(d => {
      if (kw && !d.domain.includes(kw)) return false;
      const ssl = sslMap[d.domain];

      if (filterTab === "ssl") {
        // Filter theo SSL days
        const sslDays = ssl?.daysRemaining ?? null;
        if (filter === "lt90") return sslDays !== null && sslDays < 90;
        if (filter === "lt30") return sslDays !== null && sslDays < 30;
        if (filter === "lt7") return sslDays !== null && sslDays < 7;
        if (filter === "expired") return sslDays !== null && sslDays <= 0;
        return true;
      }

      // Filter theo domain days
      const days = d.daysRemaining;
      if (filter === "lt90") return days !== null && days < 90;
      if (filter === "lt30") return days !== null && days < 30;
      if (filter === "lt7") return days !== null && days < 7;
      if (filter === "expired") return d.status === "expired";
      if (filter === "no-ssl") return !ssl || !!ssl.error;
      return true;
    });
  }, [domains, sslMap, filter, filterTab, search]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ color: "var(--ink-3)" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, opacity: 0.4 }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <p className="text-sm">Không có domain nào phù hợp</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map((d, i) => (
        <div key={`${animKey}-${d.domain}`} className="card-animate" style={{ animationDelay: `${i * 30}ms`, height: "100%", display: "flex", flexDirection: "column" }}>
          <DomainCard
            info={d}
            ssl={sslMap[d.domain] ?? null}
            isAdmin={isAdmin}
            onRemove={async () => {
              const res = await fetch(`/api/domains?domain=${encodeURIComponent(d.domain)}`, { method: "DELETE" });
              if (res.ok) setDomains((prev) => prev.filter((x) => x.domain !== d.domain));
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [sslMap, setSslMap] = useState<Record<string, SslInfo>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"domain" | "ssl">("domain");
  const [filter, setFilter] = useState<string>("all");
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => setUserIsAdmin(d.isAdmin === true)).catch(() => {});
  }, []);

  const fetchDomains = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [whoisRes, sslRes] = await Promise.all([
        fetch("/api/whois"),
        fetch("/api/ssl"),
      ]);
      if (!whoisRes.ok) throw new Error(`HTTP ${whoisRes.status}`);
      const domainData: DomainInfo[] = await whoisRes.json();
      setDomains(domainData);
      if (sslRes.ok) {
        const sslData: Array<{ domain: string } & SslInfo> = await sslRes.json();
        const map: Record<string, SslInfo> = {};
        for (const s of sslData) {
          const { domain, ...ssl } = s;
          map[domain] = ssl;
        }
        setSslMap(map);
      }
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains();
    const t = setInterval(fetchDomains, REFRESH_MS);
    return () => clearInterval(t);
  }, [fetchDomains]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Page header */}
      <div
        className="flex items-center justify-between px-4 sm:px-7 py-4"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <h1 style={{
            fontWeight: 800, fontSize: "1.45rem", letterSpacing: "-0.02em", margin: 0,
            background: "linear-gradient(135deg, #E8341A 0%, #F5A623 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Domain Monitor
          </h1>
          {lastUpdated && (
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
              Cập nhật lúc <span style={{ color: "var(--ink-2)" }}>{lastUpdated.toLocaleTimeString("vi-VN")}</span>
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ThemeToggleTopbar />
          <UserChip />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-7 py-6" style={{ flex: 1 }}>

        {/* KPI cards */}
        {!loading && domains.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "TỔNG DOMAIN", count: domains.length, gradient: "linear-gradient(135deg, #E8341A 0%, #F5A623 100%)", shadow: "rgba(232,52,26,0.35)" },
              { label: "CÒN HẠN", count: domains.filter(d => d.status === "active").length, gradient: "linear-gradient(135deg, #00D68F 0%, #4A90D9 100%)", shadow: "rgba(0,214,143,0.35)" },
              { label: "CẢNH BÁO", count: domains.filter(d => d.status === "warning" || d.status === "expiring").length, gradient: "linear-gradient(135deg, #F5A623 0%, #E8341A 100%)", shadow: "rgba(245,166,35,0.35)" },
              { label: "HẾT HẠN", count: domains.filter(d => d.status === "expired").length, gradient: "linear-gradient(135deg, #7C4DFF 0%, #E8341A 100%)", shadow: "rgba(124,77,255,0.35)" },
            ].map(({ label, count, gradient, shadow }) => (
              <div key={label} style={{
                background: gradient, borderRadius: 16, padding: "18px 20px",
                boxShadow: `0 8px 28px ${shadow}`, position: "relative", overflow: "hidden",
                transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s",
                cursor: "default",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; e.currentTarget.style.boxShadow = `0 12px 36px ${shadow.replace("0.35","0.5")}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 8px 28px ${shadow}`; }}
              >
                {/* Decorative circles */}
                <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                <div style={{ position: "absolute", top: 15, right: 15, width: 45, height: 45, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                <p style={{ margin: "0 0 6px", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.75)" }}>{label}</p>
                <p style={{ margin: 0, fontSize: "2.4rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.04em", lineHeight: 1 }}>{count}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter bar */}
        {!loading && domains.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div />
            {/* Search + Filter group */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 9, color: "var(--ink-3)", pointerEvents: "none" }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Tìm domain..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  fontSize: "0.8rem",
                  padding: "6px 10px 6px 28px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--ink-1)",
                  outline: "none",
                  width: 160,
                  transition: "border-color 0.15s, width 0.2s",
                }}
                onFocus={e => { e.target.style.borderColor = "var(--blue)"; e.target.style.width = "200px"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.width = "160px"; }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 0, display: "flex" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Tab + Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
              {(["domain", "ssl"] as const).map(tab => (
                <button key={tab} onClick={() => { setFilterTab(tab); setFilter("all"); }} style={{
                  fontSize: "0.75rem", fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: filterTab === tab ? "var(--blue)" : "transparent",
                  color: filterTab === tab ? "#fff" : "var(--ink-3)",
                  transition: "all 0.15s",
                }}>
                  {tab === "domain" ? "Domain" : "SSL"}
                </button>
              ))}
            </div>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{
                fontSize: "0.8rem", fontWeight: 500, padding: "6px 28px 6px 10px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--surface)",
                color: filter === "all" ? "var(--ink-2)" : "var(--blue)",
                cursor: "pointer", outline: "none", appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23868e96' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
              }}
            >
              <option value="all">Tất cả</option>
              <option value="lt90">Dưới 90 ngày</option>
              <option value="lt30">Dưới 30 ngày</option>
              <option value="lt7">Dưới 7 ngày</option>
              <option value="expired">{filterTab === "ssl" ? "Đã hết hạn (SSL)" : "Đã hết hạn"}</option>
              {filterTab === "domain" && <option value="no-ssl">Không có SSL</option>}
            </select>
            </div> {/* end Search + Filter group */}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-xl p-4 mb-6 text-sm flex items-center gap-2.5"
            style={{
              background: "var(--red-muted)",
              border: "1px solid var(--red-border)",
              color: "var(--red-text)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {loading && domains.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card" style={{ borderTop: "3px solid var(--border)" }}>
                <div className="px-5 pt-5 pb-4 flex items-start justify-between">
                  <div>
                    <div className="h-2.5 w-12 skeleton mb-2" />
                    <div className="h-4 w-28 skeleton" />
                  </div>
                  <div className="h-6 w-20 skeleton rounded-md" />
                </div>
                <div className="mx-5 mb-4 rounded-xl h-16 skeleton" />
                <div className="px-5 pb-5 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="h-9 skeleton rounded" />
                    <div className="h-9 skeleton rounded" />
                  </div>
                  <div className="h-2.5 w-20 skeleton mb-2" />
                  <div className="h-3.5 w-36 skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : !loading && domains.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 20px", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", marginBottom: 20,
              background: "linear-gradient(135deg, rgba(232,52,26,0.1), rgba(245,166,35,0.08))",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="2" fill="#E8341A" opacity="0.7"/>
                <rect x="13" y="3" width="8" height="8" rx="2" fill="#F5A623" opacity="0.5"/>
                <rect x="3" y="13" width="8" height="8" rx="2" fill="#F5A623" opacity="0.5"/>
                <rect x="13" y="13" width="8" height="8" rx="2" fill="#E8341A" opacity="0.3"/>
              </svg>
            </div>
            <p style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--ink-1)", marginBottom: 8, letterSpacing: "-0.01em" }}>
              Chưa có domain nào
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--ink-3)", lineHeight: 1.6, maxWidth: 320, marginBottom: 0 }}>
              {userIsAdmin
                ? "Chưa có domain nào được cấu hình. Thêm domain qua trang Tra cứu hoặc env MANAGED_DOMAINS."
                : "Tài khoản của bạn chưa được cấp quyền xem domain nào. Liên hệ admin để được phân quyền."}
            </p>
            {!userIsAdmin && (
              <p style={{ fontSize: "0.78rem", color: "var(--ink-3)", marginTop: 12, padding: "8px 14px", borderRadius: 8, border: "1px dashed var(--border-md)" }}>
                Liên hệ admin để được cấp quyền
              </p>
            )}
          </div>
        ) : (
          <FilteredCards domains={domains} sslMap={sslMap} filter={filter} filterTab={filterTab} search={search} setDomains={setDomains} isAdmin={userIsAdmin} />
        )}
      </div>

      {/* Floating refresh button */}
      <button
        onClick={fetchDomains}
        disabled={loading}
        title="Làm mới"
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 40,
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "none",
          background: loading ? "var(--ink-3)" : "var(--blue)",
          color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          transition: "background 0.15s, transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.22)"; }}}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.18)"; }}
      >
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
        >
          <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"/>
          <path d="M8 16H3v5"/>
        </svg>
      </button>
    </div>
  );
}
