"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/", label: "Painel", icon: "📊" },
  { href: "/leads", label: "Leads", icon: "📋" },
  { href: "/sourcing", label: "Buscar", icon: "🔎" },
  { href: "/perdas", label: "Perdas", icon: "📉" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-2xl items-stretch">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium",
                active ? "text-brand-600" : "text-slate-500"
              )}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium text-slate-500"
        >
          <span className="text-lg leading-none">🚪</span>
          Sair
        </button>
      </div>
    </nav>
  );
}
