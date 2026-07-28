// planoVigenteEm — qual Plano governava uma data (ADR-0002/0003/0015).
//
// Planos são contíguos por construção: arquivar define fim = início do próximo
// (ADR-0002). O Plano vigente numa data é o de maior `inicio` menor-ou-igual à
// data; empate de `inicio` (regeneração no mesmo dia) desempata por `criado_em`,
// com o mais recente vencendo — coerente com o Plano que passou a Ativo naquele
// dia. Um Plano arquivado que terminou ANTES da data não conta (guarda contra
// eventuais lacunas). Datas anteriores ao primeiro Plano não têm vigente → null.
//
// Só é usado para dias SEM Registro: um dia com Registro usa o plano_id imutável
// do próprio Registro, que é a autoridade (ADR-0003).

import type { Plano, ISODate } from "@/types"

export function planoVigenteEm(planos: readonly Plano[], data: ISODate): Plano | null {
  let melhor: Plano | null = null

  for (const p of planos) {
    if (p.vigencia.inicio > data) continue // ainda não havia começado nessa data
    if (p.vigencia.status === "arquivado" && p.vigencia.fim < data) continue // já terminara

    if (
      melhor === null ||
      p.vigencia.inicio > melhor.vigencia.inicio ||
      (p.vigencia.inicio === melhor.vigencia.inicio && p.criado_em > melhor.criado_em)
    ) {
      melhor = p
    }
  }

  return melhor
}
