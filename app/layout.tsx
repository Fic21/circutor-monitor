
import type { Metadata } from "next";
import "./globals.css";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ConnectionProvider } from "@/components/providers/ConnectionProvider";

export const metadata: Metadata = {
  title: "CIRCUTOR Energy Monitoring",
  description: "Electrical Energy Monitoring System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-slate-100 text-slate-900">
        <ConnectionProvider>
          <div className="flex min-h-screen">
            <Sidebar />

            <div className="flex min-w-0 flex-1 flex-col">
              <Header />

              <main className="flex-1 p-6">
                {children}
              </main>
            </div>
          </div>
        </ConnectionProvider>
      </body>
    </html>
  );
}
