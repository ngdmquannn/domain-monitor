"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #1a0a05 0%, #2d1008 30%, #13151F 70%, #0d1220 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    }}>
      {/* Background glow blobs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", left: "30%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,52,26,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "20%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      {/* Card */}
      <div style={{
        position: "relative",
        background: "#252836",
        borderRadius: 24,
        padding: "48px 44px 44px",
        width: 420,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div style={{
            width: 88, height: 88, borderRadius: 22,
            background: "linear-gradient(135deg, rgba(232,52,26,0.15), rgba(245,166,35,0.08))",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/favicon.svg"
              alt="Domain Monitor"
              style={{ width: 56, height: 56, objectFit: "contain", display: "block" }}
            />
          </div>
        </div>

        {/* Text */}
        <h1 style={{ margin: "0 0 10px", fontSize: "1.9rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", textAlign: "center" }}>
          Domain Monitor
        </h1>
        <p style={{ margin: "0 0 40px", fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.6, textAlign: "center" }}>
          Hệ thống giám sát domain & SSL.<br />Đăng nhập để tiếp tục.
        </p>

        {/* SSO Button */}
        <button
          onClick={() => signIn("keycloak", { callbackUrl: "/" })}
          style={{
            width: "100%",
            padding: "15px 20px",
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg, #E8341A 0%, #F5A623 100%)",
            color: "#ffffff",
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 4px 24px rgba(232,52,26,0.4)",
            transition: "opacity 0.15s, transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = "0.92";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(232,52,26,0.55)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 24px rgba(232,52,26,0.4)";
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          Sign in with SSO
        </button>

        <p style={{ margin: "20px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
          Contact your administrator if you need access.
        </p>
      </div>
    </div>
  );
}
