"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      if (!res.ok) {
        setErro("E-mail ou senha incorretos");
        return;
      }
      router.push(searchParams.get("next") || "/");
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" showTagline />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
          <h1 className="mb-1 text-sm font-semibold text-white">Acesso ao sistema</h1>
          <p className="mb-5 text-xs text-ink-300">Sistema interno de prospecção — uso restrito.</p>

          <div className="space-y-3">
            <input
              type="email"
              autoFocus
              autoComplete="username"
              className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2.5 text-sm text-white placeholder:text-ink-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && entrar()}
            />
            <input
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2.5 text-sm text-white placeholder:text-ink-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && entrar()}
            />
            {erro && <p className="text-sm text-red-400">{erro}</p>}
            <button className="btn-gold w-full" onClick={entrar} disabled={enviando}>
              {enviando ? "Entrando…" : "Entrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
