// Helpers de data locais ao dispositivo. A data do registro (ADR-0008) e o dia
// da semana usados na tela "hoje" seguem o relógio local do usuário, não UTC —
// caso contrário, perto da meia-noite o app mostraria o dia errado.

import type { ISODate, DiaDaSemana } from "@/types"

// Índice = Date.getDay() (0 = domingo … 6 = sábado).
const DIAS: readonly DiaDaSemana[] = [
  "Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado",
]

export function formatarISODate(d: Date): ISODate {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, "0")
  const dia = String(d.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}` as ISODate
}

export function diaDaSemanaDe(d: Date): DiaDaSemana {
  return DIAS[d.getDay()]
}

// Dia da semana de uma ISODate ("YYYY-MM-DD"). Monta a data com o construtor
// NUMÉRICO local (new Date(ano, mesIdx, dia)) — nunca new Date(iso), que parseia
// como UTC e, em fusos negativos, devolve o dia anterior.
export function diaDaSemanaDeISO(iso: ISODate): DiaDaSemana {
  const [ano, mes, dia] = iso.split("-").map(Number)
  return DIAS[new Date(ano, mes - 1, dia).getDay()]
}
