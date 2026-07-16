// Ciclo de vida do Plano — lógica pura, sem persistência, sem React, sem DOM.
//
// arquivar é a transição ativo → arquivado do Período de Vigência (ADR-0002):
// um Plano Ativo, ao ser substituído, recebe data de arquivamento e preserva
// tudo o mais. O Plano é imutável em seus números-base (ADR-0003) — arquivar
// só troca status/vigência, nunca as metas nutricionais nem o conteúdo.
//
// Total function, testável isoladamente. A atomicidade da troca (arquivar o
// atual + ativar o novo sem instante com zero ou dois ativos) é responsabilidade
// da Camada de Persistência (PlanoRepositorio.arquivarEAtivar), não daqui.

import type { PlanoAtivo, PlanoArquivado, ISODate } from "@/types"

// Arquiva um Plano Ativo na data `fim`. Preserva `inicio` e todos os campos-base
// via spread; só a Vigência muda (ADR-0002 + ADR-0003). O Vínculo dos Registros
// de Aderência ao Plano é pelo id — que também é preservado —, então nenhum
// Registro é afetado por esta transformação.
export function arquivarPlano(plano: PlanoAtivo, fim: ISODate): PlanoArquivado {
  return {
    ...plano,
    vigencia: { status: "arquivado", inicio: plano.vigencia.inicio, fim },
  }
}
