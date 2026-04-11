"use client";

import { useState, useEffect } from "react";

interface Props {
  domain: string;
  onClose: () => void;
}

export default function UserManageModal({ domain, onClose }: Props) {
  const [users, setUsers] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/permissions?domain=${encodeURIComponent(domain)}`)
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setLoading(false); })
      .catch(() => { setError("Không thể tải danh sách"); setLoading(false); });
  }, [domain]);

  async function addUser() {
    if (!newEmail.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim().toLowerCase(), domain }),
    });
    if (res.ok) {
      setUsers(prev => [...prev, newEmail.trim().toLowerCase()]);
      setNewEmail("");
    } else {
      setError("Không thể thêm user");
    }
    setSaving(false);
  }

  async function removeUser(email: string) {
    const res = await fetch("/api/permissions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, domain }),
    });
    if (res.ok) setUsers(prev => prev.filter(u => u !== email));
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface)", borderRadius: 14, width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", overflow: "hidden", fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif)" }}>
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.63rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>Phân quyền</p>
            <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--ink-1)", letterSpacing: "-0.01em" }}>{domain}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 4, display: "flex" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px" }}>
          {/* Add user */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              type="email"
              placeholder="email@vng.com.vn"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addUser()}
              style={{ flex: 1, fontSize: "0.82rem", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink-1)", outline: "none" }}
            />
            <button
              onClick={addUser}
              disabled={saving || !newEmail.trim()}
              style={{
                padding: "7px 14px", borderRadius: 8, border: "none", background: "var(--blue)", color: "#fff",
                fontSize: "0.8rem", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving || !newEmail.trim() ? 0.5 : 1,
              }}
            >
              Thêm
            </button>
          </div>

          {error && <p style={{ fontSize: "0.75rem", color: "var(--red)", marginBottom: 10 }}>{error}</p>}

          {/* User list */}
          <p style={{ margin: "0 0 8px", fontSize: "0.63rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>
            Người dùng có quyền
          </p>
          {loading ? (
            <p style={{ fontSize: "0.8rem", color: "var(--ink-3)" }}>Đang tải...</p>
          ) : users.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--ink-3)" }}>Chưa có user nào (chỉ admin xem được)</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {users.map(email => (
                <div key={email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--ink-2)", fontFamily: "var(--font-mono)" }}>{email}</span>
                  <button
                    onClick={() => removeUser(email)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 2, display: "flex" }}
                    title="Xóa quyền"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
