"use client";

import { useState } from "react";

export interface AdminUser {
  id: string;
  nome: string;
  email: string;
  role: "ADMIN" | "VENDEDOR";
  ativo: boolean;
  criadoEm: string;
}

const ROLE_LABELS: Record<string, string> = { ADMIN: "Administrador", VENDEDOR: "Vendedor(a)" };

export function AdminUsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUser[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);

  return (
    <div className="space-y-5">
      <NovoUsuarioForm onCriado={(user) => setUsers((prev) => [...prev, user])} />

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">E-mail</th>
              <th className="px-3 py-2">Papel</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === currentUserId}
                onChange={(atualizado) =>
                  setUsers((prev) => prev.map((u) => (u.id === atualizado.id ? atualizado : u)))
                }
                onDelete={() => setUsers((prev) => prev.filter((u) => u.id !== user.id))}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NovoUsuarioForm({ onCriado }: { onCriado: (user: AdminUser) => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState("VENDEDOR");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function criar() {
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : Object.values(data.error?.fieldErrors ?? data.error ?? {}).flat().join(", ") ||
              "Erro ao criar usuário";
        throw new Error(msg);
      }
      onCriado(data.user);
      setNome("");
      setEmail("");
      setSenha("");
      setRole("VENDEDOR");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="card space-y-3">
      <h2 className="text-sm font-semibold text-ink-900">Novo usuário</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Nome</label>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Senha</label>
          <input type="text" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        <div>
          <label className="label">Papel</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="VENDEDOR">Vendedor(a)</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <button className="btn-gold" onClick={criar} disabled={enviando}>
        {enviando ? "Criando…" : "Criar usuário"}
      </button>
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  onChange,
  onDelete,
}: {
  user: AdminUser;
  isSelf: boolean;
  onChange: (user: AdminUser) => void;
  onDelete: () => void;
}) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function atualizar(patch: Record<string, unknown>) {
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro ao atualizar");
      onChange(data.user);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  async function redefinirSenha() {
    const novaSenha = window.prompt(`Nova senha para ${user.nome} (mínimo 6 caracteres):`);
    if (!novaSenha) return;
    await atualizar({ senha: novaSenha });
  }

  async function excluir() {
    if (!window.confirm(`Excluir o acesso de ${user.nome}? Essa ação não pode ser desfeita.`)) return;
    setCarregando(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro ao excluir");
      onDelete();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <tr className="border-t border-ink-50">
      <td className="px-3 py-2 font-medium text-ink-800">
        {user.nome} {isSelf && <span className="text-xs text-ink-400">(você)</span>}
      </td>
      <td className="px-3 py-2 text-ink-600">{user.email}</td>
      <td className="px-3 py-2">
        <select
          className="input py-1 text-xs"
          value={user.role}
          disabled={carregando || isSelf}
          onChange={(e) => atualizar({ role: e.target.value })}
        >
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <button
          disabled={carregando || isSelf}
          onClick={() => atualizar({ ativo: !user.ativo })}
          className={
            user.ativo
              ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
              : "rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-500"
          }
        >
          {user.ativo ? "Ativo" : "Inativo"}
        </button>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary px-2 py-1 text-xs" onClick={redefinirSenha} disabled={carregando}>
            Redefinir senha
          </button>
          {!isSelf && (
            <button className="btn-danger px-2 py-1 text-xs" onClick={excluir} disabled={carregando}>
              Excluir
            </button>
          )}
        </div>
        {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
      </td>
    </tr>
  );
}
