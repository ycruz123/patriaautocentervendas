import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Base One — Prospecção",
  description: "CRM de prospecção da Base One",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col pb-20">
          <main className="flex-1 px-4 py-4">{children}</main>
          <Nav />
        </div>
      </body>
    </html>
  );
}
