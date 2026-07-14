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
