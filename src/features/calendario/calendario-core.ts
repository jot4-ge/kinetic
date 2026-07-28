// Núcleo puro do Calendário — sem React, sem persistência, sem DOM.
//
// Gera a grade de um mês (semanas domingo-primeiro) e navega entre meses. As
// datas de célula são ISODate ("YYYY-MM-DD") montadas por manipulação de string.
// Onde é preciso descobrir o dia da semana ou o número de dias do mês, usa-se o
// construtor NUMÉRICO local de Date — new Date(ano, mesIdx, dia) monta uma data
// no fuso local, ao contrário de new Date("2026-07-12"), que interpreta a string
// como UTC e, em fusos negativos, cai no dia anterior (o cuidado de fuso de
// src/utils/data.ts). Só cálculo local aqui; nada de parse de string.

import type { ISODate } from "@/types"

export interface CelulaDia {
  readonly data: ISODate
  readonly dia: number // 1..31
}

// Uma semana são 7 posições; null = célula de preenchimento (fora do mês).
export type Semana = readonly (CelulaDia | null)[]

export interface MesAno {
  readonly ano: number
  readonly mes: number // 1..12 (humano, não índice 0-based)
}

// Número de dias no mês, com ano bissexto correto. Dia 0 do mês seguinte é o
// último dia deste mês (mes humano vira índice 0-based do mês seguinte).
export function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate()
}

// Índice do dia da semana do dia 1 (0 = domingo … 6 = sábado).
export function diaSemanaDoPrimeiro(ano: number, mes: number): number {
  return new Date(ano, mes - 1, 1).getDay()
}

function iso(ano: number, mes: number, dia: number): ISODate {
  const mm = String(mes).padStart(2, "0")
  const dd = String(dia).padStart(2, "0")
  return `${ano}-${mm}-${dd}` as ISODate
}

export function primeiroDia(ano: number, mes: number): ISODate {
  return iso(ano, mes, 1)
}

export function ultimoDia(ano: number, mes: number): ISODate {
  return iso(ano, mes, diasNoMes(ano, mes))
}

// Grade do mês: semanas de 7 células, domingo-primeiro. Preenchimento antes do
// dia 1 (offset do dia da semana) e depois do último dia é null, de modo que
// toda linha tenha exatamente 7 posições.
export function gerarGradeMes(ano: number, mes: number): Semana[] {
  const total = diasNoMes(ano, mes)
  const offset = diaSemanaDoPrimeiro(ano, mes)

  const celulas: (CelulaDia | null)[] = []
  for (let i = 0; i < offset; i++) celulas.push(null)
  for (let d = 1; d <= total; d++) celulas.push({ data: iso(ano, mes, d), dia: d })
  while (celulas.length % 7 !== 0) celulas.push(null)

  const semanas: Semana[] = []
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7))
  return semanas
}

// Ano e mês (humano) de uma ISODate — para descobrir em que mês uma data cai,
// ex.: navegação por teclado que atravessa a fronteira do mês.
export function mesDe(data: ISODate): MesAno {
  const [ano, mes] = data.split("-").map(Number)
  return { ano, mes }
}

// Índice do dia da semana de uma ISODate (0 = domingo … 6 = sábado), pelo
// construtor NUMÉRICO local — mesmo cuidado de fuso do topo do arquivo.
export function indiceDiaSemana(data: ISODate): number {
  const [ano, mes, dia] = data.split("-").map(Number)
  return new Date(ano, mes - 1, dia).getDay()
}

// Soma (ou subtrai) dias a uma ISODate, atravessando corretamente viradas de
// mês/ano e fevereiro bissexto — o construtor local normaliza dia + n. Base da
// navegação por teclado do calendário (setas = ±1/±7 dias).
export function somarDias(data: ISODate, n: number): ISODate {
  const [ano, mes, dia] = data.split("-").map(Number)
  const d = new Date(ano, mes - 1, dia + n)
  return iso(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

// Uma data é futura se vem DEPOIS de hoje. Comparação lexical de strings basta:
// ISODate é "YYYY-MM-DD" de largura fixa, então a ordem alfabética é a ordem
// cronológica. O próprio hoje não é futuro (dias futuros não são registráveis,
// ADR-0015 — mas hoje é).
export function ehDataFutura(data: ISODate, hoje: ISODate): boolean {
  return data > hoje
}

// Valida o parâmetro de rota /dia/:data e o devolve como ISODate, ou null se for
// malformado ou impossível (ex.: "2026-02-30"). Exige "YYYY-MM-DD" com zero à
// esquerda; monta a data no construtor local e confere que ela não "transbordou"
// (30/fev vira 02/mar → rejeitada). Guarda de defesa da rota do dia (ADR-0015).
export function parseDataISO(s: string): ISODate | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const [ano, mes, dia] = s.split("-").map(Number)
  if (mes < 1 || mes > 12 || dia < 1) return null
  const d = new Date(ano, mes - 1, dia)
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null
  return s as ISODate
}

export function mesAnterior({ ano, mes }: MesAno): MesAno {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 }
}

export function mesProximo({ ano, mes }: MesAno): MesAno {
  return mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 }
}

const MESES_LONGOS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const

// "Julho 2026" para o cabeçalho do calendário.
export function rotuloMes(ano: number, mes: number): string {
  return `${MESES_LONGOS[mes - 1]} ${ano}`
}

// Cabeçalhos das colunas: rótulo curto para o visual, nome completo para o
// leitor de tela (as iniciais D/S/T/Q/Q/S/S são ambíguas). Domingo-primeiro.
export const CABECALHOS_SEMANA = [
  { curto: "D", longo: "Domingo" },
  { curto: "S", longo: "Segunda-feira" },
  { curto: "T", longo: "Terça-feira" },
  { curto: "Q", longo: "Quarta-feira" },
  { curto: "Q", longo: "Quinta-feira" },
  { curto: "S", longo: "Sexta-feira" },
  { curto: "S", longo: "Sábado" },
] as const
