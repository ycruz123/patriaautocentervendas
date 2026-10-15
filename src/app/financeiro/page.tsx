import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { DespesasPanel, CobrancasAbertasPanel } from "@/components/FinanceiroPanels";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    redirect("/");
  }

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [cobrancasAbertas, cobrancasRecebidasMes, despesas, despesasPagasMes] = await Promise.all([
    prisma.cobranca.findMany({
      where: { status: { in: ["PENDENTE", "ATRASADO"] } },
      orderBy: { vencimento: "asc" },
      include: { cliente: { include: { lead: { select: { nome: true } } } } },
    }),
    prisma.cobranca.aggregate({
      where: { status: "PAGO", pagoEm: { gte: inicioMes } },
      _sum: { valor: true },
    }),
    prisma.despesa.findMany({
      orderBy: { vencimento: "asc" },
    }),
    prisma.despesa.aggregate({
      where: { status: "PAGO", pagoEm: { gte: inicioMes } },
      _sum: { valor: true },
    }),
  ]);

  const totalAReceber = cobrancasAbertas.reduce((soma, c) => soma + Number(c.valor), 0);
  const recebidoMes = Number(cobrancasRecebidasMes._sum.valor ?? 0);
  const totalAPagar = despesas
    .filter((d) => d.status === "PENDENTE" || d.status === "ATRASADO")
    .reduce((soma, d) => soma + Number(d.valor), 0);
  const pagoMes = Number(despesasPagasMes._sum.valor ?? 0);
  const saldoMes = recebidoMes - pagoMes;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="text-sm text-ink-400">Visão consolidada de cobranças (a receber) e despesas (a pagar) da Base One.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total a receber" valor={totalAReceber} tom="neutro" />
        <StatCard label="Recebido este mês" valor={recebidoMes} tom="positivo" />
        <StatCard label="Total a pagar" valor={totalAPagar} tom="neutro" />
        <StatCard label="Pago este mês" valor={pagoMes} tom="negativo" />
        <StatCard label="Saldo do mês" valor={saldoMes} tom={saldoMes >= 0 ? "positivo" : "negativo"} />
      </div>

      <CobrancasAbertasPanel
        cobrancas={cobrancasAbertas.map((c) => ({
          id: c.id,
          clienteId: c.clienteId,
          clienteNome: c.cliente.lead.nome,
          valor: Number(c.valor),
          vencimento: c.vencimento.toISOString(),
          status: c.status,
        }))}
      />

      <DespesasPanel
        despesas={despesas.map((d) => ({
          id: d.id,
          descricao: d.descricao,
          categoria: d.categoria,
          valor: Number(d.valor),
          vencimento: d.vencimento.toISOString(),
          status: d.status,
          pagoEm: d.pagoEm ? d.pagoEm.toISOString() : null,
        }))}
      />
    </div>
  );
}

function StatCard({ label, valor, tom }: { label: string; valor: number; tom: "neutro" | "positivo" | "negativo" }) {
  return (
    <div className="card">
      <p className="text-xs text-ink-400">{label}</p>
      <p
        className={
          "mt-1 text-lg font-semibold " +
          (tom === "positivo" ? "text-emerald-700" : tom === "negativo" ? "text-red-700" : "text-ink-900")
        }
      >
        R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}
