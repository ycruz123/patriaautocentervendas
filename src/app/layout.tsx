import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { getSessionUser } from "@/lib/auth";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Base One — Prospecção",
  description: "CRM de prospecção da Base One",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  const user = session ? { nome: session.nome, role: session.role } : null;

  return (
    <html lang="pt-BR" className={montserrat.variable}>
      <body className="font-sans">
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
