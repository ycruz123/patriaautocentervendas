"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TIPO_LABELS, ORIGEM_LABELS } from "@/types";

export interface LeadFormInitial {
  id?: string;
  nome?: string;
  contato?: string | null;
  whatsapp?: string;
  tipo?: string;
  origem?: string;
  valor?: number | string | null;
  notas?: string | null;
  cidade?: string | null;
  uf?: string | null;
}

export function LeadForm({ initial }: { initial?: LeadFormInitial }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [nome, setNome] = useState(initial?.nome ?? "");
  const [contato, setContato] = useState(initial?.contato ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? "");
  const [tipo, setTipo] = useState(initial?.tipo ?? "B2B_PROFISSIONAL");
  const [origem, setOrigem] = useState(initial?.origem ?? "PROSPECCAO_ATIVA");
  const [valor, setValor] = useState(initial?.valor?.toString() ?? "");
  const [notas, setNotas] = useState(initial?.notas ?? "");
  const [cidade, setCidade] = useState(initial?.cidade ?? "");
  const [uf, setUf] = useState(initial?.uf ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setErro(null);
    setEnviando(true);
    try {
      const payload = {
        nome,
        contato: contato || null,
        whatsapp,
        tipo,
        origem,
        valor: valor ? Number(valor) : null,
        notas: notas || null,
        cidade: cidade || null,
        uf: uf || null,
      };

      const res = await fetch(isEdit ? `/api/leads/${initial!.id}` : "/api/leads", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const mensagem =
          typeof data.error === "string"
            ? data.error
            : Object.values(data.error?.fieldErrors ?? {}).flat().join(", ") ||
              Object.values(data.error ?? {}).flat().join(", ") ||
              "Erro ao salvar lead";
        throw new Error(mensagem);
      }

      router.push(isEdit ? `/leads/${initial!.id}` : `/leads/${data.lead.id}`);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Nome *</label>
        <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>

      <div>
        <label className="label">Contato (pessoa/cargo)</label>
        <input className="input" value={contato ?? ""} onChange={(e) => setContato(e.target.value)} />
      </div>

      <div>
        <label className="label">WhatsApp * (DDD + número)</label>
        <input
          className="input"
          placeholder="(11) 91234-5678"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tipo *</label>
          <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {Object.entries(TIPO_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Origem *</label>
          <select className="input" value={origem} onChange={(e) => setOrigem(e.target.value)}>
            {Object.entries(ORIGEM_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Cidade</label>
          <input className="input" value={cidade ?? ""} onChange={(e) => setCidade(e.target.value)} />
        </div>
        <div>
          <label className="label">UF</label>
          <input className="input" maxLength={2} value={uf ?? ""} onChange={(e) => setUf(e.target.value.toUpperCase())} />
        </div>
      </div>

      <div>
        <label className="label">Valor de contrato (R$)</label>
        <input
          className="input"
          type="number"
          min={0}
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Notas</label>
        <textarea className="input" rows={3} value={notas ?? ""} onChange={(e) => setNotas(e.target.value)} />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <button className="btn-primary w-full" onClick={salvar} disabled={enviando}>
        {enviando ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar lead"}
      </button>
    </div>
  );
}
