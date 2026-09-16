import Link from "next/link";
import { LeadForm } from "@/components/LeadForm";

export default function NewLeadPage() {
  return (
    <div className="space-y-5">
      <div>
        <Link href="/leads" className="text-xs font-medium text-ink-400 hover:text-ink-600">
          ← Voltar pra leads
        </Link>
        <h1 className="page-title mt-1">Novo lead</h1>
      </div>
      <div className="card max-w-xl">
        <LeadForm />
      </div>
    </div>
  );
}
