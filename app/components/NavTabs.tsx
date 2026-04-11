"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/",       label: "Dashboard" },
  { href: "/search", label: "Tra cứu"   },
];

export default function NavTabs() {
  const path = usePathname();

  return (
    <div
      className="inline-flex items-center rounded-lg p-0.5"
      style={{ background: "var(--bg)", border: "1px solid var(--border)", gap: 1 }}
    >
      {TABS.map(({ href, label }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            className="px-3.5 py-1.5 rounded-md text-sm transition-all duration-150"
            style={
              active
                ? {
                    background: "var(--surface)",
                    color: "var(--ink-1)",
                    fontWeight: 500,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }
                : {
                    background: "transparent",
                    color: "var(--ink-3)",
                    fontWeight: 400,
                  }
            }
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
