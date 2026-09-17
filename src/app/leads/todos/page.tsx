import { LeadsListView } from "@/components/LeadsListView";

export const dynamic = "force-dynamic";

export default async function TodosLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ estagio?: string; tipo?: string; busca?: string }>;
}) {
  const params = await searchParams;

  return (
    <LeadsListView
      titulo="Todos os leads"
      voltarHref="/leads"
      novoLeadHref="/leads/new"
      searchParams={params}
    />
  );
}
