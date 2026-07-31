import { describe, it, expect } from "vitest"
import {
  LIMIAR_DIVERGENCIA_PESO,
  variacaoDesdeBase,
  divergenciaExigeSugestao,
  sugerirNovoPlano,
  serieParaGrafico,
} from "./progresso-peso-core"
import type { ISODate, ISOTimestamp, UsuarioId, RegistroPesoId, RegistroDePeso } from "@/types"

const uid = "user-1" as UsuarioId
const ts  = "2026-07-01T09:00:00.000Z" as ISOTimestamp

function makeRegistro(data: ISODate, peso_kg: number, id = "peso-1"): RegistroDePeso {
  return {
    id: id as RegistroPesoId,
    usuario_id: uid,
    data,
    peso_kg,
    criado_em: ts,
    editado_em: null,
  }
}

describe("variacaoDesdeBase", () => {
  it("calcula diferença em kg e em fração (não percentual)", () => {
    expect(variacaoDesdeBase(84, 80)).toEqual({ diferencaKg: 4, diferencaPct: 0.05 })
  })

  it("peso igual à base: variação zero", () => {
    expect(variacaoDesdeBase(80, 80)).toEqual({ diferencaKg: 0, diferencaPct: 0 })
  })

  it("peso abaixo da base: diferença negativa", () => {
    expect(variacaoDesdeBase(76, 80)).toEqual({ diferencaKg: -4, diferencaPct: -0.05 })
  })
})

describe("divergenciaExigeSugestao", () => {
  it("abaixo do limiar não exige sugestão", () => {
    expect(divergenciaExigeSugestao(83, 80)).toBe(false) // 3.75%
  })

  it("exatamente no limiar exige sugestão (>=, não >)", () => {
    expect(divergenciaExigeSugestao(84, 80)).toBe(true) // exatos 5%
  })

  it("acima do limiar exige sugestão", () => {
    expect(divergenciaExigeSugestao(90, 80)).toBe(true)
  })

  it("divergência para baixo também conta (usa módulo)", () => {
    expect(divergenciaExigeSugestao(76, 80)).toBe(true) // -5%
  })

  it("peso igual à base nunca exige sugestão", () => {
    expect(divergenciaExigeSugestao(80, 80)).toBe(false)
  })

  it("limiar é ajustável por parâmetro", () => {
    expect(divergenciaExigeSugestao(84, 80, 0.1)).toBe(false) // 5% < limiar de 10%
    expect(LIMIAR_DIVERGENCIA_PESO).toBe(0.05) // padrão documentado
  })
})

describe("sugerirNovoPlano", () => {
  it("sem peso registrado ainda: não sugere, não quebra", () => {
    expect(sugerirNovoPlano(null, 80)).toBe(false)
  })

  it("sem Plano ativo (pesoBase null): não sugere, não quebra", () => {
    expect(sugerirNovoPlano(makeRegistro("2026-07-01" as ISODate, 90), null)).toBe(false)
  })

  it("nem peso nem Plano ativo: não sugere", () => {
    expect(sugerirNovoPlano(null, null)).toBe(false)
  })

  it("peso diverge ≥5% do peso-base do Plano ativo: sugere", () => {
    expect(sugerirNovoPlano(makeRegistro("2026-07-01" as ISODate, 90), 80)).toBe(true)
  })

  it("peso dentro da margem: não sugere", () => {
    expect(sugerirNovoPlano(makeRegistro("2026-07-01" as ISODate, 81), 80)).toBe(false)
  })
})

describe("serieParaGrafico", () => {
  it("sem pesos ainda: null (não uma série vazia)", () => {
    expect(serieParaGrafico([])).toBeNull()
  })

  it("um só peso: min e max iguais a ele", () => {
    const serie = serieParaGrafico([makeRegistro("2026-07-01" as ISODate, 82)])
    expect(serie).toEqual({
      pontos: [{ data: "2026-07-01", peso_kg: 82 }],
      minKg: 82,
      maxKg: 82,
    })
  })

  it("ordena os pontos por data crescente, independente da ordem de entrada", () => {
    const serie = serieParaGrafico([
      makeRegistro("2026-07-10" as ISODate, 79, "p3"),
      makeRegistro("2026-07-01" as ISODate, 82, "p1"),
      makeRegistro("2026-07-05" as ISODate, 80, "p2"),
    ])
    expect(serie?.pontos.map((p) => p.data)).toEqual(["2026-07-01", "2026-07-05", "2026-07-10"])
  })

  it("calcula min e max sobre toda a série", () => {
    const serie = serieParaGrafico([
      makeRegistro("2026-07-01" as ISODate, 82, "p1"),
      makeRegistro("2026-07-05" as ISODate, 79, "p2"),
      makeRegistro("2026-07-10" as ISODate, 85, "p3"),
    ])
    expect(serie?.minKg).toBe(79)
    expect(serie?.maxKg).toBe(85)
  })
})
