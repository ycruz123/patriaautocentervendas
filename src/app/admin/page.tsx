import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { AdminUsersManager } from "@/components/AdminUsersManager";
import { AdminNichosManager } from "@/components/AdminNichosManager";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    redirect("/");
  }

  const [users, porNicho] = await Promise.all([
    prisma.user.findMany({
      orderBy: { criadoEm: "asc" },
      select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
    }),
    prisma.lead.groupBy({ by: ["categoria"], _count: { _all: true } }),
  ]);

  const nichos = porNicho
    .map((c) => ({ categoria: c.categoria, total: c._count._all }))
    .sort((a, b) => {
      if ((a.categoria === null) !== (b.categoria === null)) return a.categoria === null ? 1 : -1;
      return (a.categoria ?? "").localeCompare(b.categoria ?? "");
    });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Administração</h1>
        <p className="text-sm text-ink-400">Gerencie quem tem acesso ao sistema e como os leads são organizados.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-900">Usuários</h2>
        <AdminUsersManager
          initialUsers={users.map((u) => ({ ...u, criadoEm: u.criadoEm.toISOString() }))}
          currentUserId={session.userId}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-ink-900">Nichos / quadros</h2>
          <p className="text-xs text-ink-400">
            Renomeie um nicho (também serve pra mesclar dois nichos parecidos em um só, digitando o
            nome do outro) ou esvazie um nicho pra mandar todo mundo de volta pra &quot;Sem nicho
            definido&quot;. Excluir leads e mudar o nicho de um lead individual são feitos direto na
            tela de Leads, também restritos a administrador.
          </p>
        </div>
        <AdminNichosManager initialNichos={nichos} />
      </section>
    </div>
  );
}
