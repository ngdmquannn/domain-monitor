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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
        <ThemeProvider>
          <SessionProvider>
            <Sidebar />
            <div className="main-content" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              {children}
            </div>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
