import { getSessionUser } from "@/lib/auth";
import { ImportarLeadsForm } from "@/components/ImportarLeadsForm";

export const dynamic = "force-dynamic";

export default async function ImportarLeadsPage() {
  const session = await getSessionUser();
  return <ImportarLeadsForm isAdmin={session?.role === "ADMIN"} />;
}
