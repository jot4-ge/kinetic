import { describe, it, expect } from "vitest"
import {
  LIMIAR_DIVERGENCIA_PESO,
  variacaoDesdeBase,
  divergenciaExigeSugestao,
  sugerirNovoPlano,
  serieParaGrafico,
  estadoProgresso,
  pontosSvg,
  linhaSvgPath,
  areaSvgPath,
  pesosRecentes,
  criarRegistroPesoVazio,
  resolverRegistroPeso,
  carimbarEdicaoPeso,
  validarPesoInput,
} from "./progresso-peso-core"
import { FAIXA_PESO_KG } from "@/features/onboarding/onboarding-core"
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

describe("estadoProgresso", () => {
  it("zero pesos: vazio", () => {
    expect(estadoProgresso(0)).toBe("vazio")
  })

  it("um peso: unico", () => {
    expect(estadoProgresso(1)).toBe("unico")
  })

  it("dois ou mais: serie", () => {
    expect(estadoProgresso(2)).toBe("serie")
    expect(estadoProgresso(30)).toBe("serie")
  })
})

describe("pontosSvg", () => {
  it("um só ponto: centralizado horizontalmente", () => {
    const serie = serieParaGrafico([makeRegistro("2026-07-01" as ISODate, 80)])!
    const pontos = pontosSvg(serie, { largura: 100, altura: 50 })
    expect(pontos).toHaveLength(1)
    expect(pontos[0].x).toBe(50)
  })

  it("amplitude zero (todos os pesos iguais): linha reta no centro vertical", () => {
    const serie = serieParaGrafico([
      makeRegistro("2026-07-01" as ISODate, 80, "p1"),
      makeRegistro("2026-07-02" as ISODate, 80, "p2"),
    ])!
    const pontos = pontosSvg(serie, { largura: 100, altura: 50 })
    expect(pontos[0].y).toBe(25)
    expect(pontos[1].y).toBe(25)
  })

  it("primeiro e último ponto respeitam o padding X", () => {
    const serie = serieParaGrafico([
      makeRegistro("2026-07-01" as ISODate, 80, "p1"),
      makeRegistro("2026-07-02" as ISODate, 82, "p2"),
    ])!
    const pontos = pontosSvg(serie, { largura: 100, altura: 50, paddingX: 10, paddingY: 5 })
    expect(pontos[0].x).toBe(10)
    expect(pontos[1].x).toBe(90)
  })

  it("peso maior fica mais alto na tela (y menor)", () => {
    const serie = serieParaGrafico([
      makeRegistro("2026-07-01" as ISODate, 80, "p1"), // min
      makeRegistro("2026-07-02" as ISODate, 90, "p2"), // max
    ])!
    const pontos = pontosSvg(serie, { largura: 100, altura: 50 })
    expect(pontos[1].y).toBeLessThan(pontos[0].y)
  })

  it("preserva data e peso_kg nos pontos gerados", () => {
    const serie = serieParaGrafico([makeRegistro("2026-07-01" as ISODate, 80)])!
    const pontos = pontosSvg(serie, { largura: 100, altura: 50 })
    expect(pontos[0].data).toBe("2026-07-01")
    expect(pontos[0].peso_kg).toBe(80)
  })
})

describe("linhaSvgPath / areaSvgPath", () => {
  it("linhaSvgPath: sem pontos é string vazia", () => {
    expect(linhaSvgPath([])).toBe("")
  })

  it("linhaSvgPath: começa com M e usa L para os demais", () => {
    const serie = serieParaGrafico([
      makeRegistro("2026-07-01" as ISODate, 80, "p1"),
      makeRegistro("2026-07-02" as ISODate, 82, "p2"),
    ])!
    const pontos = pontosSvg(serie, { largura: 100, altura: 50 })
    const path = linhaSvgPath(pontos)
    expect(path.startsWith("M")).toBe(true)
    expect(path).toContain("L")
  })

  it("areaSvgPath: sem pontos é string vazia", () => {
    expect(areaSvgPath([], 50)).toBe("")
  })

  it("areaSvgPath: fecha o caminho na base do gráfico (Z)", () => {
    const serie = serieParaGrafico([
      makeRegistro("2026-07-01" as ISODate, 80, "p1"),
      makeRegistro("2026-07-02" as ISODate, 82, "p2"),
    ])!
    const pontos = pontosSvg(serie, { largura: 100, altura: 50 })
    const path = areaSvgPath(pontos, 50)
    expect(path.endsWith("Z")).toBe(true)
    expect(path).toContain("L88.00,50") // desce até a base sob o último ponto (x com padding default)
  })
})

describe("pesosRecentes", () => {
  const hoje = "2026-07-10" as ISODate

  it("exclui o dia de hoje", () => {
    const lista = pesosRecentes(
      [makeRegistro(hoje, 80, "hoje"), makeRegistro("2026-07-09" as ISODate, 81, "ontem")],
      hoje,
    )
    expect(lista.map((r) => r.id)).toEqual(["ontem"])
  })

  it("ordena mais recente primeiro", () => {
    const lista = pesosRecentes(
      [
        makeRegistro("2026-07-01" as ISODate, 82, "antigo"),
        makeRegistro("2026-07-05" as ISODate, 81, "meio"),
      ],
      hoje,
    )
    expect(lista.map((r) => r.id)).toEqual(["meio", "antigo"])
  })

  it("respeita o limite", () => {
    const registros = Array.from({ length: 20 }, (_, i) =>
      makeRegistro(`2026-06-${String(i + 1).padStart(2, "0")}` as ISODate, 80, `r${i}`),
    )
    expect(pesosRecentes(registros, hoje, 5)).toHaveLength(5)
  })

  it("sem pesos além de hoje: lista vazia", () => {
    expect(pesosRecentes([makeRegistro(hoje, 80)], hoje)).toEqual([])
  })
})

describe("criarRegistroPesoVazio / resolverRegistroPeso", () => {
  const ctx = {
    id: "novo-id" as RegistroPesoId,
    usuario_id: uid,
    data: "2026-07-10" as ISODate,
    criado_em: ts,
  }

  it("criarRegistroPesoVazio: editado_em nulo", () => {
    const r = criarRegistroPesoVazio(80, ctx)
    expect(r.editado_em).toBeNull()
    expect(r.peso_kg).toBe(80)
    expect(r.id).toBe("novo-id")
  })

  it("resolverRegistroPeso sem existente: cria novo com o contexto", () => {
    const r = resolverRegistroPeso(null, 80, ctx)
    expect(r).toEqual(criarRegistroPesoVazio(80, ctx))
  })

  it("resolverRegistroPeso com existente: reaproveita id/criado_em, troca peso_kg", () => {
    const existente = makeRegistro("2026-07-10" as ISODate, 80, "existente")
    const r = resolverRegistroPeso(existente, 83, ctx)
    expect(r.id).toBe("existente")
    expect(r.criado_em).toBe(existente.criado_em)
    expect(r.peso_kg).toBe(83)
  })
})

describe("carimbarEdicaoPeso", () => {
  const agoraFixo = () => new Date("2026-07-15T12:00:00.000Z")

  it("primeira gravação (não persistido): editado_em permanece null", () => {
    const registro = criarRegistroPesoVazio(80, {
      id: "r1" as RegistroPesoId, usuario_id: uid, data: "2026-07-15" as ISODate, criado_em: ts,
    })
    expect(carimbarEdicaoPeso(registro, false, agoraFixo).editado_em).toBeNull()
  })

  it("edição de registro já persistido: carimba editado_em com agora()", () => {
    const registro = makeRegistro("2026-07-10" as ISODate, 83)
    const r = carimbarEdicaoPeso(registro, true, agoraFixo)
    expect(r.editado_em).toBe("2026-07-15T12:00:00.000Z")
  })
})

describe("validarPesoInput", () => {
  it("aceita número válido", () => {
    expect(validarPesoInput("80")).toEqual({ valor: 80 })
  })

  it("aceita vírgula decimal", () => {
    expect(validarPesoInput("80,5")).toEqual({ valor: 80.5 })
  })

  it("vazio: erro", () => {
    expect(validarPesoInput("")).toEqual({ erro: "Informe o peso." })
    expect(validarPesoInput("   ")).toEqual({ erro: "Informe o peso." })
  })

  it("não numérico: erro", () => {
    expect(validarPesoInput("abc")).toEqual({ erro: "Use apenas números." })
  })

  it("fora da faixa plausível: erro", () => {
    const abaixo = validarPesoInput(String(FAIXA_PESO_KG.min - 1))
    const acima = validarPesoInput(String(FAIXA_PESO_KG.max + 1))
    expect(abaixo).toEqual({ erro: `Valor fora da faixa (${FAIXA_PESO_KG.min}–${FAIXA_PESO_KG.max}).` })
    expect(acima).toEqual({ erro: `Valor fora da faixa (${FAIXA_PESO_KG.min}–${FAIXA_PESO_KG.max}).` })
  })

  it("limites da faixa são aceitos (inclusivo)", () => {
    expect(validarPesoInput(String(FAIXA_PESO_KG.min))).toEqual({ valor: FAIXA_PESO_KG.min })
    expect(validarPesoInput(String(FAIXA_PESO_KG.max))).toEqual({ valor: FAIXA_PESO_KG.max })
  })
})
