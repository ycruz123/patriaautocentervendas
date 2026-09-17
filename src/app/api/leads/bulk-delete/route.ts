import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bulkDeleteLeadsSchema } from "@/lib/validation";
import { getSessionUser } from "@/lib/auth";

/** Exclui vários leads de uma vez — ação restrita ao ADMIN. */
export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Só o administrador pode excluir leads" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bulkDeleteLeadsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { count } = await prisma.lead.deleteMany({ where: { id: { in: parsed.data.leadIds } } });
  return NextResponse.json({ excluidos: count });
}
