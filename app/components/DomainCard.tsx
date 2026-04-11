"use client";

import React, { useState } from "react";
import type { DomainInfo } from "@/app/api/whois/route";
import type { SslInfo } from "@/lib/ssl-checker";
import UserManageModal from "@/app/components/UserManageModal";

interface Props {
  info: DomainInfo;
  ssl?: SslInfo | null;
  onRemove?: () => Promise<void>;
  isAdmin?: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

const STATUS = {
  active: {
    cardClass: "card-active",
    badgeBg: "var(--green-light)", badgeBorder: "var(--green-border)", badgeText: "var(--green)",
    accentColor: "var(--green)",
    dimBg: "var(--green-dim)",
    label: "Còn hạn", numColor: "var(--green)",
    dot: "#2f9e44", pulse: false,
  },
  warning: {
    cardClass: "card-warning",
    badgeBg: "var(--amber-light)", badgeBorder: "var(--amber-border)", badgeText: "var(--amber)",
    accentColor: "var(--amber)",
    dimBg: "var(--amber-dim)",
    label: "Sắp hết hạn", numColor: "var(--amber)",
    dot: "#e67700", pulse: false,
  },
  expiring: {
    cardClass: "card-expiring",
    badgeBg: "var(--red-light)", badgeBorder: "var(--red-border)", badgeText: "var(--red)",
    accentColor: "var(--red)",
    dimBg: "var(--red-dim)",
    label: "Hết hạn sớm", numColor: "var(--red)",
    dot: "#c92a2a", pulse: true,
  },
  expired: {
    cardClass: "card-expired",
    badgeBg: "var(--red-light)", badgeBorder: "var(--red-border)", badgeText: "var(--red)",
    accentColor: "var(--red)",
    dimBg: "var(--red-dim)",
    label: "Hết hạn", numColor: "var(--red)",
    dot: "#c92a2a", pulse: false,
  },
  error: {
    cardClass: "card-error",
    badgeBg: "#f1f3f5", badgeBorder: "#dee2e6", badgeText: "var(--ink-3)",
    accentColor: "var(--border-md)",
    dimBg: "#f8f9fa",
    label: "Lỗi", numColor: "var(--ink-3)",
    dot: "#adb5bd", pulse: false,
  },
};

export default function DomainCard({ info, ssl, onRemove, isAdmin }: Props) {
  const [removing, setRemoving] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const s = STATUS[info.status];
  const daysNum = info.daysRemaining !== null && info.daysRemaining > 0
    ? info.daysRemaining
    : null;

  return (
    <div className={`card ${s.cardClass}`} style={{ display: "flex", flexDirection: "column" }}>

      {/* ── Top section: domain name + badge ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <h2
              className="font-bold leading-tight truncate"
              style={{ fontSize: "1.1rem", color: "var(--ink-1)", letterSpacing: "-0.01em" }}
            >
              {info.domain}
            </h2>
            {onRemove && (
              <button
                onClick={async () => {
                  setRemoving(true);
                  await onRemove();
                  setRemoving(false);
                }}
                disabled={removing}
                title="Xóa khỏi Dashboard"
                style={{
                  flexShrink: 0,
                  background: "none",
                  border: "none",
                  cursor: removing ? "not-allowed" : "pointer",
                  padding: 2,
                  color: "var(--ink-3)",
                  opacity: removing ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <span
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: s.badgeBg,
              border: `1px solid ${s.badgeBorder}`,
              color: s.badgeText,
              fontSize: "0.7rem",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: s.dot, display: "inline-block", flexShrink: 0,
                animation: s.pulse ? "pulse-dot 1.5s ease-in-out infinite" : undefined,
              }}
            />
            {s.label}
          </span>
        </div>

        {/* ── Domain + SSL hero row ── */}
        <div className="grid gap-2" style={{ gridTemplateColumns: ssl !== undefined ? "1fr 1fr" : "1fr" }}>
          {/* Domain box */}
          <div>
            <p style={{ fontSize: "0.63rem", letterSpacing: "0.08em", color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase", marginBottom: 5 }}>Domain</p>
            <div className="flex flex-col justify-center rounded-xl px-3 py-2.5" style={{ background: s.dimBg, minHeight: 64 }}>
              {daysNum !== null ? (
                <>
                  <span className="font-black tabular-nums leading-none" style={{ fontSize: "1.7rem", color: s.numColor, letterSpacing: "-0.04em" }}>
                    {daysNum}
                  </span>
                  <span className="font-semibold" style={{ color: s.numColor, fontSize: "0.75rem", marginTop: 2 }}>
                    {info.status === "expiring" ? "ngày — sắp hết hạn" : "ngày còn lại"}
                  </span>
                  <span style={{ color: "var(--ink-3)", fontSize: "0.7rem", marginTop: 1 }}>
                    hết {formatDate(info.expiryDate)}
                  </span>
                </>
              ) : (
                <span className="font-bold" style={{ color: s.numColor, fontSize: "0.9rem" }}>
                  {info.status === "expired" ? "Đã hết hạn" : "—"}
                </span>
              )}
            </div>
          </div>

          {/* SSL box */}
          {ssl !== undefined && (
            <div>
              <p style={{ fontSize: "0.63rem", letterSpacing: "0.08em", color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase", marginBottom: 5 }}>SSL</p>
              <SslHero ssl={ssl} domain={info.domain} />
            </div>
          )}
        </div>
      </div>

      {/* ── Error state ── */}
      {info.status === "error" && (
        <p className="px-5 pb-4 text-sm" style={{ color: "var(--red)" }}>
          {info.error ?? "Không thể tải thông tin domain"}
        </p>
      )}

      {/* ── Meta section ── */}
      {info.status !== "error" && (
        <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border)", paddingTop: 12, flex: 1, display: "flex", flexDirection: "column" }}>

          {/* 3-col: reg date, expiry date, registrar */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-3">
            <MetaField label="Ngày đăng ký" value={formatDate(info.registrationDate)} />
            <MetaField label="Ngày hết hạn" value={formatDate(info.expiryDate)} highlight />
            <div className="col-span-2">
              <MetaField label="Registrar" value={info.registrar ?? "—"} />
            </div>
          </div>

          {/* Nameservers */}
          <div>
            <p style={{ fontSize: "0.63rem", letterSpacing: "0.08em", color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase", marginBottom: 5 }}>
              Nameservers
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {info.nameservers.length > 0
                ? info.nameservers.map((ns) => (
                    <span key={ns} style={{ color: "var(--ink-2)", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
                      {ns}
                    </span>
                  ))
                : <span style={{ color: "var(--ink-3)", fontSize: "0.72rem" }}>—</span>
              }
            </div>
          </div>

          {/* Bottom row: Phân quyền (admin) + Mở trang */}
          <div className="flex items-center justify-between" style={{ marginTop: "auto", paddingTop: 10 }}>
            {isAdmin ? (
              <button
                onClick={() => setShowUsers(true)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, color: "var(--ink-3)", padding: 0, display: "inline-flex", alignItems: "center", gap: 4, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--blue)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-3)")}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
                Phân quyền
              </button>
            ) : <span />}

            {ssl && !ssl.error && (
              <a
                href={`https://${info.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--ink-3)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--blue)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-3)")}
              >
                Mở trang
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      )}

      {showUsers && <UserManageModal domain={info.domain} onClose={() => setShowUsers(false)} />}
    </div>
  );
}

function SslHero({ ssl, domain }: { ssl: SslInfo | null; domain: string }) {
  const boxStyle: React.CSSProperties = { borderRadius: 12, padding: "10px 12px", minHeight: 64, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" };
  const neutralBox: React.CSSProperties = { ...boxStyle, background: "transparent", border: "1px dashed var(--border-md)" };

  if (ssl === null) {
    return (
      <div style={{ ...neutralBox, display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-3)", animation: "pulse-dot 1.5s ease-in-out infinite" }} />
        <span style={{ color: "var(--ink-3)", fontSize: "0.75rem" }}>Đang kiểm tra...</span>
      </div>
    );
  }
  if (ssl.error && (ssl.error.includes("ENOTFOUND") || ssl.error.includes("ECONNREFUSED") || ssl.error.includes("Timeout"))) {
    return (
      <div style={{ ...neutralBox, display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
        {/* Shield-off icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.35 }}>
          <path d="M12 3L4 6v6c0 5.25 3.5 9.74 8 11 4.5-1.26 8-5.75 8-11V6l-8-3z" fill="var(--ink-3)" opacity="0.3"/>
          <line x1="4" y1="4" x2="20" y2="20" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div>
          <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "var(--ink-3)" }}>Không có HTTPS</p>
          <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--ink-3)", opacity: 0.7 }}>HTTP only hoặc không reachable</p>
        </div>
      </div>
    );
  }
  if (ssl.error) {
    return (
      <div style={{ ...neutralBox, display: "flex", flexDirection: "row", alignItems: "center", gap: 10 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.35 }}>
          <path d="M12 3L4 6v6c0 5.25 3.5 9.74 8 11 4.5-1.26 8-5.75 8-11V6l-8-3z" fill="var(--ink-3)" opacity="0.3"/>
          <line x1="12" y1="9" x2="12" y2="13" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="16" r="0.5" fill="var(--ink-3)" stroke="var(--ink-3)" strokeWidth="1.5"/>
        </svg>
        <div>
          <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "var(--ink-3)" }}>Không thể kiểm tra</p>
          <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--ink-3)", opacity: 0.7 }}>SSL timeout hoặc lỗi kết nối</p>
        </div>
      </div>
    );
  }

  const days = ssl.daysRemaining;
  const numColor = days === null ? "var(--ink-3)"
    : days <= 0 ? "var(--red)"
    : days <= 30 ? "var(--red)"
    : days <= 90 ? "var(--amber)"
    : "var(--green)";
  const dimBg = days === null ? "#f8f9fa"
    : days <= 30 ? "var(--red-dim)"
    : days <= 90 ? "var(--amber-dim)"
    : "var(--green-dim)";

  return (
    <div style={{ ...boxStyle, background: dimBg }}>
      {days !== null && days > 0 ? (
        <>
          <span className="font-black tabular-nums" style={{ fontSize: "1.7rem", color: numColor, letterSpacing: "-0.04em", lineHeight: 1 }}>
            {days}
          </span>
          <span className="font-semibold" style={{ color: numColor, fontSize: "0.75rem", marginTop: 2 }}>
            {days <= 30 ? "ngày — sắp hết hạn" : "ngày còn lại"}
          </span>
          <span style={{ color: "var(--ink-3)", fontSize: "0.7rem", fontFamily: "var(--font-mono)", marginTop: 1 }}>
            {ssl.issuer ?? "Unknown"}
          </span>
        </>
      ) : (
        <>
          <span style={{ color: numColor, fontWeight: 700, fontSize: "0.85rem" }}>
            {days === null ? "—" : `Đã hết hạn ${Math.abs(days)} ngày`}
          </span>
          <span style={{ color: "var(--ink-3)", fontSize: "0.7rem", fontFamily: "var(--font-mono)", marginTop: 2 }}>
            {ssl.issuer ?? "Unknown"}
          </span>
        </>
      )}
    </div>
  );
}

function MetaField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p
        style={{ fontSize: "0.63rem", letterSpacing: "0.08em", color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}
      >
        {label}
      </p>
      <p
        className="font-semibold truncate"
        style={{
          fontSize: "0.85rem",
          color: highlight ? "var(--ink-1)" : "var(--ink-2)",
        }}
      >
        {value}
      </p>
    </div>
  );
}
