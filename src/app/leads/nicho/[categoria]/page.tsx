import { notFound } from "next/navigation";
import { LeadsListView } from "@/components/LeadsListView";

export const dynamic = "force-dynamic";

// Slug reservado pro quadro dos leads sem nicho definido (categoria null).
const SLUG_SEM_NICHO = "sem-nicho";

export default async function NichoLeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{ estagio?: string; tipo?: string; busca?: string }>;
}) {
  const { categoria: slug } = await params;
  const sp = await searchParams;

  if (!slug) notFound();

  const semNicho = slug === SLUG_SEM_NICHO;
  const categoria = semNicho ? null : decodeURIComponent(slug);

  return (
    <LeadsListView
      categoriaFiltro={categoria}
      titulo={semNicho ? "Sem nicho definido" : categoria!}
      voltarHref="/leads"
      novoLeadHref={semNicho ? "/leads/new" : `/leads/new?categoria=${encodeURIComponent(categoria!)}`}
      searchParams={sp}
    />
  );
}
