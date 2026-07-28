// Núcleo puro da tela "hoje" — sem React, sem persistência, sem DOM.
//
// Reúne as transformações sobre o RegistroDeAderencia do dia: criar um registro
// vazio, resolver existente vs novo, alternar Status de Refeição (ADR-0001),
// incrementar água, marcar treino/JJ/checklist, e carimbar editado_em (ADR-0008).
// Cada função é um reducer puro: recebe o registro e devolve um novo registro.
//
// O componente (HojePage) só orquestra: carrega, chama estes reducers e persiste.

import type {
  RegistroDeAderencia,
  RegistroDeRefeicao,
  StatusDeRefeicao,
  ChecklistItemTemplate,
  RegistroId, UsuarioId, PlanoId,
  ISODate, ISOTimestamp,
  Repeticao,
} from "@/types"

export interface ContextoRegistro {
  id: RegistroId
  usuario_id: UsuarioId
  plano_id: PlanoId
  data: ISODate
  checklist_template: readonly ChecklistItemTemplate[]
}

// Registro recém-criado para o dia: nada registrado ainda. editado_em nulo
// (ADR-0008: só é preenchido em edições após a criação). O checklist começa com
// todos os itens do template em false, para a UI renderizar as caixas.
export function criarRegistroVazio(ctx: ContextoRegistro): RegistroDeAderencia {
  const checklist: Record<string, boolean> = {}
  for (const item of ctx.checklist_template) checklist[item.id] = false

  return {
    id: ctx.id,
    usuario_id: ctx.usuario_id,
    plano_id: ctx.plano_id,
    data: ctx.data,
    editado_em: null,
    registros_refeicao: [],
    agua_consumida_ml: null,
    treino_realizado: null,
    jj_realizado: null,
    checklist,
    registros_exercicio: [],
  }
}

// Carrega o registro do dia se já existe; senão devolve um vazio. Não sobrescreve
// o que o usuário já registrou hoje (requisito da fase).
export function resolverRegistroDoDia(
  existente: RegistroDeAderencia | null,
  ctx: ContextoRegistro,
): RegistroDeAderencia {
  return existente ?? criarRegistroVazio(ctx)
}

export function statusDaRefeicao(
  registro: RegistroDeAderencia,
  refeicao_id: string,
): StatusDeRefeicao | null {
  const entrada = registro.registros_refeicao.find((r) => r.refeicao_id === refeicao_id)
  return entrada ? entrada.status : null
}

// Alterna o Status de uma Refeição (ADR-0001: binário Seguiu/NaoSeguiu, sem
// parcial). Clicar no status já ativo desmarca (volta a "não registrado").
// Seguiu exige a Opção seguida; NaoSeguiu não a carrega.
export function alternarStatusRefeicao(
  registro: RegistroDeAderencia,
  refeicao_id: string,
  status: StatusDeRefeicao,
  opcao_seguida_id: string,
): RegistroDeAderencia {
  const atual = statusDaRefeicao(registro, refeicao_id)
  const semEsta = registro.registros_refeicao.filter((r) => r.refeicao_id !== refeicao_id)

  // Mesmo status → desmarca.
  if (atual === status) {
    return { ...registro, registros_refeicao: semEsta }
  }

  const nova: RegistroDeRefeicao =
    status === "Seguiu"
      ? { refeicao_id, status: "Seguiu", opcao_seguida_id }
      : { refeicao_id, status: "NaoSeguiu" }

  return { ...registro, registros_refeicao: [...semEsta, nova] }
}

// Soma (ou subtrai) água; nunca abaixo de zero. null é tratado como 0.
export function incrementarAgua(
  registro: RegistroDeAderencia,
  delta_ml: number,
): RegistroDeAderencia {
  const atual = registro.agua_consumida_ml ?? 0
  return { ...registro, agua_consumida_ml: Math.max(0, atual + delta_ml) }
}

export function definirTreino(
  registro: RegistroDeAderencia,
  feito: boolean,
): RegistroDeAderencia {
  return { ...registro, treino_realizado: feito }
}

export function definirJJ(
  registro: RegistroDeAderencia,
  feito: boolean,
): RegistroDeAderencia {
  return { ...registro, jj_realizado: feito }
}

export function definirChecklistItem(
  registro: RegistroDeAderencia,
  item_id: string,
  marcado: boolean,
): RegistroDeAderencia {
  return { ...registro, checklist: { ...registro.checklist, [item_id]: marcado } }
}

// ADR-0008/0015: o chamador atualiza editado_em antes de salvar. editado_em
// permanece null APENAS quando o Registro é gravado ao vivo no próprio dia
// (retroativo=false) pela primeira vez (jaPersistido=false). Toda escrita
// retroativa — a de um dia passado, inclusive sua primeira gravação — e toda
// edição posterior recebem o timestamp atual, para que um dia preenchido depois
// nunca se confunda com um registrado na hora.
export function carimbarEdicao(
  registro: RegistroDeAderencia,
  jaPersistido: boolean,
  retroativo: boolean,
  agora: () => Date,
): RegistroDeAderencia {
  if (!jaPersistido && !retroativo) return registro
  return { ...registro, editado_em: agora().toISOString() as ISOTimestamp }
}

// Formata a prescrição de repetições (ADR-0009) para exibição.
export function formatarRepeticao(rep: Repeticao): string {
  switch (rep.tipo) {
    case "Faixa":    return `${rep.min}–${rep.max}`
    case "Fixo":     return `${rep.valor}`
    case "Falha":    return "até a falha"
    case "Tempo":    return `${rep.min}–${rep.max}s`
    case "Piramide": return rep.sequencia.join("→")
  }
}
