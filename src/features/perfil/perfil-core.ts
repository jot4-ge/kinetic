// Núcleo puro do Perfil — sem React, sem persistência, sem DOM.
//
// O bloco de identidade só FORMATA dados já persistidos (Usuario + Plano
// Ativo) — não coleta nada novo. `formatarDataCurta` vem de historico-core:
// mesma gramática de data em toda a UI, não uma segunda convenção.

import type { ObjetivoDePlano, ISODate } from "@/types"
import { formatarDataCurta } from "@/features/historico/historico-core"

export const OBJETIVO_LABEL: Record<ObjetivoDePlano, string> = {
  Cutting: "Cutting",
  Manutencao: "Manutenção",
  Bulk: "Bulk",
  Recomposicao: "Recomposição",
}

// Dias corridos entre duas ISODate (0 quando `ate` é o próprio `de`). Mesmo
// cuidado de fuso de src/utils/data.ts: construtor NUMÉRICO local, nunca
// new Date(iso) — que parseia como UTC e, em fusos negativos, erra o dia.
export function diasEntre(de: ISODate, ate: ISODate): number {
  const [anoDe, mesDe, diaDe] = de.split("-").map(Number)
  const [anoAte, mesAte, diaAte] = ate.split("-").map(Number)
  const t1 = new Date(anoDe, mesDe - 1, diaDe).getTime()
  const t2 = new Date(anoAte, mesAte - 1, diaAte).getTime()
  return Math.round((t2 - t1) / 86_400_000)
}

// "desde 6 jul 2026 · 24 dias" — a legenda sob o objetivo em destaque, no
// bloco de identidade. Singular sem "1" solto seria mais bonito, mas contagem
// é dado: numeral, sempre (mesma régua de formatarContagemEras).
export function formatarDesde(inicio: ISODate, hoje: ISODate): string {
  const dias = diasEntre(inicio, hoje)
  const rotuloDias = dias === 1 ? "1 dia" : `${dias} dias`
  return `desde ${formatarDataCurta(inicio)} · ${rotuloDias}`
}
