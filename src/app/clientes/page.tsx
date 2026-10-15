import Link from "next/link";
import { prisma } from "@/lib/db";
import { STATUS_CONTRATO_LABELS, STATUS_COBRANCA_LABELS } from "@/types";
import clsx from "clsx";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      lead: { select: { nome: true, whatsapp: true, categoria: true, cidade: true } },
      contratos: { orderBy: { criadoEm: "desc" }, take: 1 },
      cobrancas: {
        where: { status: { in: ["PENDENTE", "ATRASADO"] } },
        orderBy: { vencimento: "asc" },
        take: 1,
      },
    },
  });

  const ativos = clientes.filter((c) => c.ativo).length;
  const inativos = clientes.length - ativos;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="text-sm text-ink-400">
            {clientes.length} cliente{clientes.length === 1 ? "" : "s"} no pós-venda
            {inativos > 0 ? ` (${ativos} ativo${ativos === 1 ? "" : "s"}, ${inativos} inativo${inativos === 1 ? "" : "s"})` : ""}
          </p>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="card text-center text-sm text-ink-400">
          Nenhum cliente ainda. Um lead vira cliente quando um administrador converte ele, no detalhe do lead.
        </div>
      ) : (
        <div className="space-y-3">
          {clientes.map((cliente) => {
            const contrato = cliente.contratos[0];
            const cobranca = cliente.cobrancas[0];
            const iniciais = cliente.lead.nome
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("");

            return (
              <Link
                key={cliente.id}
                href={`/clientes/${cliente.id}`}
                className="card flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-gold-500">
                    {iniciais || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">{cliente.lead.nome}</p>
                    <p className="truncate text-xs text-ink-400">
                      {cliente.lead.categoria ? `${cliente.lead.categoria} · ` : ""}
                      {cliente.lead.cidade ?? cliente.lead.whatsapp}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {!cliente.ativo && (
                    <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-500">
                      Inativo
                    </span>
                  )}
                  {contrato && (
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        contrato.status === "ATIVO" && "bg-emerald-50 text-emerald-700",
                        contrato.status === "VENCIDO" && "bg-red-50 text-red-700",
                        contrato.status === "CANCELADO" && "bg-ink-100 text-ink-500"
                      )}
                    >
                      Contrato {STATUS_CONTRATO_LABELS[contrato.status]}
                    </span>
                  )}
                  {cobranca && (
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        cobranca.status === "ATRASADO" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {STATUS_COBRANCA_LABELS[cobranca.status]}: R${" "}
                      {Number(cobranca.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em{" "}
                      {cobranca.vencimento.toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
