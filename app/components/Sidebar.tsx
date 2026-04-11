"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";

const NAV = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: "/search",
    label: "Tra cứu",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
];

function ThemeToggleInline({ compact }: { compact?: boolean } = {}) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  if (compact) {
    return (
      <button onClick={toggle} title={isDark ? "Light mode" : "Dark mode"} style={{
        background: "none", border: "none", cursor: "pointer", padding: 6,
        color: isDark ? "#F5A623" : "#6c5ce7", display: "flex", alignItems: "center",
      }}>
        {isDark ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
          </svg>
        )}
      </button>
    );
  }

  return (
    <button onClick={toggle} style={{
      display: "flex", alignItems: "center", gap: 8, background: "none",
      border: "none", cursor: "pointer", padding: "4px 0", width: "100%",
    }}>
      <div style={{
        width: 36, height: 20, borderRadius: 9999, position: "relative", flexShrink: 0,
        background: isDark ? "linear-gradient(135deg, #E8341A, #F5A623)" : "rgba(0,0,0,0.15)",
        transition: "background 0.25s",
      }}>
        <div style={{
          position: "absolute", top: 2, left: isDark ? 18 : 2,
          width: 16, height: 16, borderRadius: "50%", background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          transition: "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--ink-3)" }}>
        {isDark ? "Dark mode" : "Light mode"}
      </span>
    </button>
  );
}

export default function Sidebar() {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (path === "/login") return null;

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="sidebar-desktop"
        style={{
          width: 220,
          flexShrink: 0,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.svg" alt="Logo" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{
            fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #E8341A 0%, #F5A623 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Domain Monitor
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150"
                style={
                  active
                    ? { background: "linear-gradient(135deg, #E8341A 0%, #F5A623 100%)", color: "#ffffff", fontWeight: 700, fontSize: "0.875rem", boxShadow: "0 4px 12px rgba(232,52,26,0.3)" }
                    : { background: "transparent", color: "var(--ink-2)", fontWeight: 500, fontSize: "0.875rem" }
                }
              >
                <span style={{ opacity: active ? 1 : 0.55, flexShrink: 0, filter: active ? "brightness(0) invert(1)" : "none" }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
          <p style={{ color: "var(--ink-3)", fontSize: "0.68rem", margin: 0 }}>
            Auto-refresh · 1 giờ/lần
          </p>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header
        className="mobile-topbar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 52,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.svg" alt="Logo" style={{ width: 22, height: 22, objectFit: "contain" }} />
          <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--ink-1)" }}>Domain Monitor</span>
        </div>

        {/* Right side: theme toggle + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <ThemeToggleInline compact />
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--ink-2)" }}
          aria-label="Menu"
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <nav
            style={{
              position: "absolute",
              top: 52,
              left: 0,
              right: 0,
              background: "var(--surface)",
              borderBottom: "1px solid var(--border)",
              padding: "8px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {NAV.map(({ href, label, icon }) => {
              const active = path === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-150"
                  style={
                    active
                      ? { background: "linear-gradient(135deg, #E8341A, #F5A623)", color: "#fff", fontWeight: 700, fontSize: "0.9rem", boxShadow: "0 4px 12px rgba(232,52,26,0.3)" }
                      : { background: "transparent", color: "var(--ink-2)", fontWeight: 500, fontSize: "0.9rem" }
                  }
                >
                  <span style={{ opacity: active ? 1 : 0.55, filter: active ? "brightness(0) invert(1)" : "none" }}>{icon}</span>
                  {label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
    </>
  );
}
