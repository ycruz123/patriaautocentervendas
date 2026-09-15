"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
        body: JSON.stringify({ senha }),
      });
      if (!res.ok) {
        setErro("Senha incorreta");
        return;
      }
      router.push(searchParams.get("next") || "/");
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-xl font-bold">Base One — Prospecção</h1>
      <div className="w-full max-w-xs space-y-3">
        <input
          type="password"
          className="input"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && entrar()}
        />
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button className="btn-primary w-full" onClick={entrar} disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </div>
    </div>
  );
}
