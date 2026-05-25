"use client";

import { useState } from "react";
import DomainCard from "@/app/components/DomainCard";
import type { DomainInfo } from "@/app/api/whois/route";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DomainInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add domain flow
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const domain = query.trim().toLowerCase();
    if (!domain) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAddSuccess(false);
    setAddError(null);
    try {
      const res = await fetch(`/api/whois?domain=${encodeURIComponent(domain)}`);
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!result) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: result.domain }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAddError(json.error ?? "Thêm thất bại");
      } else {
        setAddSuccess(true);
        setShowAddModal(false);
      }
    } catch {
      setAddError("Lỗi kết nối");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Page header */}
      <div
        className="flex items-center px-4 sm:px-7 py-4"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <h1 style={{
            fontWeight: 800, fontSize: "1.45rem", letterSpacing: "-0.02em", margin: 0,
            background: "linear-gradient(135deg, #E8341A 0%, #F5A623 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Domain Monitor
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
            Nhập tên domain bất kỳ để kiểm tra trạng thái
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-7 py-6" style={{ flex: 1 }}>
        {/* Search form */}
        <div
          className="rounded-xl p-4 sm:p-5 mb-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)", maxWidth: 560 }}
        >
          <form onSubmit={handleSearch} className="flex gap-2.5">
            <div className="relative flex-1 min-w-0">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--ink-3)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ví dụ: example.com, google.com..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--ink-1)" }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "#93c5fd";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(25,113,194,0.1)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
              style={{ background: "var(--blue)", color: "#fff", boxShadow: "var(--shadow-btn)" }}
            >
              {loading ? "Đang tra..." : "Tra cứu"}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-xl p-4 mb-5 text-sm flex items-center gap-2.5"
            style={{ background: "var(--red-muted)", border: "1px solid var(--red-border)", color: "var(--red-text)", maxWidth: 560 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Success toast */}
        {addSuccess && (
          <div
            className="rounded-xl p-4 mb-5 text-sm flex items-center gap-2.5"
            style={{ background: "var(--green-dim)", border: "1px solid var(--green-border)", color: "var(--green)", maxWidth: 560 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M20 6 9 17l-5-5"/>
            </svg>
            Domain <strong>{result?.domain}</strong> đã được thêm vào Dashboard.
          </div>
        )}

        {/* Empty state — chưa search */}
        {!result && !loading && !error && (
          <div style={{ maxWidth: 560, textAlign: "center", padding: "40px 20px" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", margin: "0 auto 16px",
              background: "linear-gradient(135deg, rgba(232,52,26,0.1), rgba(245,166,35,0.08))",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" fill="rgba(232,52,26,0.15)" stroke="#E8341A" strokeWidth="1.5"/>
                <path d="m21 21-4.35-4.35" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--ink-1)", marginBottom: 6 }}>Tra cứu domain bất kỳ</p>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-3)", lineHeight: 1.6 }}>
              Nhập tên domain để kiểm tra ngày hết hạn, SSL,<br/>registrar và nameservers.
            </p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ maxWidth: 380 }}>
            <div className="flex items-center justify-between mb-3">
              {result.source && (
                <p className="text-xs" style={{ color: "var(--ink-3)" }}>
                  Nguồn:{" "}
                  <span className="font-medium" style={{ color: "var(--ink-2)" }}>
                    {result.source.toUpperCase()}
                  </span>
                </p>
              )}
              {/* Add button — only show if status != error and not already added */}
              {result.status !== "error" && !addSuccess && (
                <button
                  onClick={() => { setShowAddModal(true); setAddError(null); }}
                  className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-all"
                  style={{ background: "var(--blue)", color: "#fff", boxShadow: "var(--shadow-btn)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Thêm vào Dashboard
                </button>
              )}
            </div>
            <DomainCard info={result} />
          </div>
        )}
      </div>

      {/* ── Add confirmation modal ── */}
      {showAddModal && result && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div
            className="rounded-2xl w-full"
            style={{ maxWidth: 400, background: "var(--surface)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", padding: 24 }}
          >
            <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--ink-1)", marginBottom: 8 }}>
              Thêm domain vào Dashboard?
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--ink-2)", marginBottom: 20 }}>
              Domain <strong style={{ color: "var(--ink-1)" }}>{result.domain}</strong> sẽ được thêm vào danh sách theo dõi và hiển thị trên Dashboard.
            </p>

            {addError && (
              <p className="text-sm mb-4" style={{ color: "var(--red)" }}>{addError}</p>
            )}

            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--ink-2)" }}
              >
                Huỷ
              </button>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: "var(--blue)", color: "#fff", boxShadow: "var(--shadow-btn)" }}
              >
                {adding ? "Đang thêm..." : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
