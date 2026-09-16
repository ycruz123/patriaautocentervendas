import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { AdminUsersManager } from "@/components/AdminUsersManager";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { criadoEm: "asc" },
    select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Administração</h1>
        <p className="text-sm text-ink-400">Gerencie quem tem acesso ao sistema.</p>
      </div>
      <AdminUsersManager
        initialUsers={users.map((u) => ({ ...u, criadoEm: u.criadoEm.toISOString() }))}
        currentUserId={session.userId}
      />
    </div>
  );
}
