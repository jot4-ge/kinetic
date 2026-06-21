import { describe, it, expect } from "vitest"
import { montarSessoesTreino } from "./selecao-treino"
import { SESSOES_SEMANA } from "@/banco-opcoes"
import type { DiaDaSemana } from "@/types"

const DIAS_PADRAO_TREINO: readonly DiaDaSemana[] = ["Segunda", "Terca", "Quarta", "Quinta", "Sabado"]
const DIAS_PADRAO_JJ:     readonly DiaDaSemana[] = ["Segunda", "Quarta", "Sexta"]

describe("SESSOES_SEMANA (banco de treinos)", () => {
  it("contém 5 sessões (Seg/Ter/Qua/Qui/Sab)", () => {
    expect(SESSOES_SEMANA.length).toBe(5)
  })

  it("cobre os dias corretos", () => {
    const dias = SESSOES_SEMANA.map(s => s.dia_da_semana)
    expect(dias).toContain("Segunda")
    expect(dias).toContain("Terca")
    expect(dias).toContain("Quarta")
    expect(dias).toContain("Quinta")
    expect(dias).toContain("Sabado")
    expect(dias).not.toContain("Sexta")   // JJ only — não é dia de academia
    expect(dias).not.toContain("Domingo") // descanso
  })

  it("todos os slots têm ordem ≥ 1", () => {
    SESSOES_SEMANA.forEach(s =>
      s.slots.forEach(slot =>
        expect(slot.ordem).toBeGreaterThanOrEqual(1)
      )
    )
  })

  it("todos os slots têm pelo menos uma OpcaoDeExercicio", () => {
    SESSOES_SEMANA.forEach(s =>
      s.slots.forEach(slot =>
        expect(slot.opcoes.length).toBeGreaterThan(0)
      )
    )
  })

  it("Segunda (Treino A) tem 5 slots (Peito + Tríceps)", () => {
    const seg = SESSOES_SEMANA.find(s => s.dia_da_semana === "Segunda")!
    expect(seg.slots.length).toBe(5)
  })

  it("Sábado (Treino C) tem 11 slots (Pernas + Abdômen + Finisher Costas)", () => {
    const sab = SESSOES_SEMANA.find(s => s.dia_da_semana === "Sabado")!
    expect(sab.slots.length).toBe(11)
  })

  it("IDs de slot são únicos dentro de cada sessão", () => {
    SESSOES_SEMANA.forEach(s => {
      const ids = s.slots.map(slot => slot.id)
      const uniq = new Set(ids)
      expect(uniq.size).toBe(ids.length)
    })
  })
})

describe("montarSessoesTreino", () => {
  it("retorna array vazio se dias_treino é vazio", () => {
    const resultado = montarSessoesTreino([], DIAS_PADRAO_JJ)
    expect(resultado).toHaveLength(0)
  })

  it("retorna apenas os dias que estão em dias_treino", () => {
    const resultado = montarSessoesTreino(["Segunda", "Quarta"], DIAS_PADRAO_JJ)
    expect(resultado).toHaveLength(2)
    const dias = resultado.map(s => s.dia_da_semana)
    expect(dias).toContain("Segunda")
    expect(dias).toContain("Quarta")
    expect(dias).not.toContain("Terca")
    expect(dias).not.toContain("Quinta")
    expect(dias).not.toContain("Sabado")
  })

  it("com dias_treino padrão, retorna 5 sessões", () => {
    const resultado = montarSessoesTreino(DIAS_PADRAO_TREINO, DIAS_PADRAO_JJ)
    expect(resultado).toHaveLength(5)
  })

  describe("flag tem_jj", () => {
    const resultado = montarSessoesTreino(DIAS_PADRAO_TREINO, DIAS_PADRAO_JJ)
    const porDia = Object.fromEntries(resultado.map(s => [s.dia_da_semana, s]))

    it("Segunda tem_jj=true (Seg está em dias_jj padrão)", () => {
      expect(porDia["Segunda"].tem_jj).toBe(true)
    })

    it("Quarta tem_jj=true (Qua está em dias_jj padrão)", () => {
      expect(porDia["Quarta"].tem_jj).toBe(true)
    })

    it("Terça tem_jj=false (Ter não está em dias_jj padrão)", () => {
      expect(porDia["Terca"].tem_jj).toBe(false)
    })

    it("Quinta tem_jj=false (Qui não está em dias_jj padrão)", () => {
      expect(porDia["Quinta"].tem_jj).toBe(false)
    })

    it("Sábado tem_jj=false (Sab não está em dias_jj padrão)", () => {
      expect(porDia["Sabado"].tem_jj).toBe(false)
    })
  })

  it("Sexta em dias_treino é ignorada (não há template para Sex — JJ only)", () => {
    const resultado = montarSessoesTreino(["Sexta"], DIAS_PADRAO_JJ)
    // Não há SessaoTreinoTemplate para Sexta no Banco → resultado vazio
    expect(resultado).toHaveLength(0)
  })

  it("IDs de SessaoTreino são únicos", () => {
    const resultado = montarSessoesTreino(DIAS_PADRAO_TREINO, DIAS_PADRAO_JJ)
    const ids = resultado.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("slots de cada sessão são os do Banco (não modificados)", () => {
    const resultado = montarSessoesTreino(["Segunda"], DIAS_PADRAO_JJ)
    const seg = resultado[0]
    const template = SESSOES_SEMANA.find(t => t.dia_da_semana === "Segunda")!
    expect(seg.slots.length).toBe(template.slots.length)
    expect(seg.slots[0].id).toBe(template.slots[0].id)
  })

  it("com dias_jj vazio, nenhuma sessão tem tem_jj=true", () => {
    const resultado = montarSessoesTreino(DIAS_PADRAO_TREINO, [])
    resultado.forEach(s => expect(s.tem_jj).toBe(false))
  })

  it("é determinístico: mesmo input → mesmo output", () => {
    const r1 = montarSessoesTreino(DIAS_PADRAO_TREINO, DIAS_PADRAO_JJ)
    const r2 = montarSessoesTreino(DIAS_PADRAO_TREINO, DIAS_PADRAO_JJ)
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2))
  })
})
