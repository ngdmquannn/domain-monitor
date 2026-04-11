"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      title={isDark ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"}
      style={{
        position: "fixed",
        bottom: 88,
        right: 28,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 14px 8px 10px",
        borderRadius: 9999,
        border: "1px solid rgba(255,255,255,0.1)",
        background: isDark ? "#252836" : "#ffffff",
        boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(45,27,20,0.12)",
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {/* Track */}
      <div style={{
        width: 36, height: 20, borderRadius: 9999, position: "relative",
        background: isDark
          ? "linear-gradient(135deg, #E8341A, #F5A623)"
          : "rgba(0,0,0,0.1)",
        transition: "background 0.25s",
        flexShrink: 0,
      }}>
        {/* Knob */}
        <div style={{
          position: "absolute",
          top: 2, left: isDark ? 18 : 2,
          width: 16, height: 16, borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          transition: "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isDark ? (
            /* Moon filled */
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#E8341A">
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
            </svg>
          ) : (
            /* Sun filled */
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#F5A623">
              <circle cx="12" cy="12" r="5" fill="#F5A623"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </div>
      </div>

      {/* Label */}
      <span style={{
        fontSize: "0.72rem",
        fontWeight: 600,
        color: isDark ? "rgba(255,255,255,0.7)" : "#2D1B14",
        whiteSpace: "nowrap",
        transition: "color 0.25s",
      }}>
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
