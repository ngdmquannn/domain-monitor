"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

interface MeData {
  authenticated: boolean;
  email?: string;
  name?: string;
  isAdmin?: boolean;
}

export default function UserChip() {
  const [me, setMe] = useState<MeData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(setMe).catch(() => {});
  }, []);

  if (!me?.authenticated) return null;

  const initials = (me.name ?? me.email ?? "?")
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const displayName = me.name ?? me.email ?? "";

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 10 }}
      >
        {/* Avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #6c5ce7, #4c3fd1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: "0.9rem",
        }}>
          {initials}
        </div>
        {/* Name + role */}
        <div style={{ textAlign: "left" }}>
          <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "var(--ink-1)", whiteSpace: "nowrap" }}>{displayName}</p>
          {me.isAdmin && (
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#6c5ce7", background: "#ede9fe", padding: "1px 7px", borderRadius: 10 }}>Admin</span>
          )}
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            minWidth: 200, overflow: "hidden",
          }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--ink-1)" }}>{me.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{me.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                width: "100%", padding: "10px 14px", background: "none", border: "none",
                cursor: "pointer", textAlign: "left", fontSize: "0.8rem", color: "var(--red)",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
