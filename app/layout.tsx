import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/app/components/Sidebar";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/app/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Domain Monitor",
  description: "Theo dõi ngày hết hạn domain & SSL",
  icons: { icon: "/favicon.svg" },
};

const oidcOn = process.env.NEXT_PUBLIC_OIDC_ENABLED === "true";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const tree = (
    <>
      <Sidebar />
      <div className="main-content" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </>
  );

  return (
    <html lang="en">
      <body className="antialiased" style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
        <ThemeProvider>
          {oidcOn ? <SessionProvider>{tree}</SessionProvider> : tree}
        </ThemeProvider>
      </body>
    </html>
  );
}
