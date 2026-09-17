import Link from "next/link";
import { prisma } from "@/lib/db";
import { LeadBoardsSearch } from "@/components/LeadBoardsSearch";

export const dynamic = "force-dynamic";

const SLUG_SEM_NICHO = "sem-nicho";

interface Quadro {
  categoria: string | null;
  total: number;
  novos: number;
}

export default async function LeadsBoardsPage() {
  const [porCategoria, novosPorCategoria] = await Promise.all([
    prisma.lead.groupBy({ by: ["categoria"], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["categoria"], where: { estagio: "NOVO_LEAD" }, _count: { _all: true } }),
  ]);

  const novosPorChave = new Map(novosPorCategoria.map((c) => [c.categoria, c._count._all]));

  const quadros: Quadro[] = porCategoria.map((c) => ({
    categoria: c.categoria,
    total: c._count._all,
    novos: novosPorChave.get(c.categoria) ?? 0,
  }));

  // Nichos reais primeiro (quem precisa de ligação primeiro, depois por
  // tamanho), "Sem nicho definido" sempre por último.
  quadros.sort((a, b) => {
    if ((a.categoria === null) !== (b.categoria === null)) return a.categoria === null ? 1 : -1;
    if (b.novos !== a.novos) return b.novos - a.novos;
    if (b.total !== a.total) return b.total - a.total;
    return (a.categoria ?? "").localeCompare(b.categoria ?? "");
  });

  const totalGeral = quadros.reduce((soma, q) => soma + q.total, 0);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="text-sm text-ink-400">
            {totalGeral} lead{totalGeral === 1 ? "" : "s"} no total, organizados por nicho
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads/importar" className="btn-secondary">
            Importar CSV
          </Link>
          <Link href="/leads/new" className="btn-gold">
            + Novo lead
          </Link>
        </div>
      </div>

      <LeadBoardsSearch />

      {quadros.length === 0 ? (
        <div className="card text-center text-sm text-ink-400">
          Nenhum lead ainda. Importe um CSV, busque leads novos ou crie um manualmente.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quadros.map((q) => (
            <QuadroCard key={q.categoria ?? SLUG_SEM_NICHO} quadro={q} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuadroCard({ quadro }: { quadro: Quadro }) {
  const semNicho = quadro.categoria === null;
  const href = `/leads/nicho/${semNicho ? SLUG_SEM_NICHO : encodeURIComponent(quadro.categoria!)}`;
  const iniciais = semNicho
    ? "?"
    : quadro.categoria!
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");

  return (
    <Link
      href={href}
      className="card flex flex-col gap-4 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={
              semNicho
                ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-100 text-sm font-semibold text-ink-400"
                : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-gold-500"
            }
          >
            {iniciais}
          </div>
          <div>
            <p className="font-semibold text-ink-900">{semNicho ? "Sem nicho definido" : quadro.categoria}</p>
            <p className="text-xs text-ink-400">
              {quadro.total} lead{quadro.total === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      {quadro.novos > 0 ? (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
          {quadro.novos} novo{quadro.novos === 1 ? "" : "s"} pra ligar
        </span>
      ) : (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1 text-xs font-medium text-ink-400">
          Nenhum novo no momento
        </span>
      )}
    </Link>
  );
}
