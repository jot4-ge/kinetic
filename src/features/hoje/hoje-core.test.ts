import { describe, it, expect } from "vitest"
import {
  criarRegistroVazio,
  resolverRegistroDoDia,
  statusDaRefeicao,
  alternarStatusRefeicao,
  incrementarAgua,
  definirTreino,
  definirChecklistItem,
  carimbarEdicao,
  formatarRepeticao,
  saudacaoDoDia,
  type ContextoRegistro,
} from "./hoje-core"
import { parseRegistroDeAderencia } from "@/types"
import type {
  RegistroDeAderencia, RegistroId, UsuarioId, PlanoId, ISODate, ISOTimestamp,
} from "@/types"

const ctx: ContextoRegistro = {
  id: "reg-1" as RegistroId,
  usuario_id: "usuario-local" as UsuarioId,
  plano_id: "plano-1" as PlanoId,
  data: "2026-07-14" as ISODate,
  checklist_template: [
    { id: "agua", descricao: "Beber toda a água" },
    { id: "sono", descricao: "Dormir 7h" },
  ],
}

describe("criarRegistroVazio", () => {
  it("cria um registro válido (passa o parser do schema), sem nada registrado", () => {
    const reg = criarRegistroVazio(ctx)
    expect(() => parseRegistroDeAderencia(reg)).not.toThrow()
    expect(reg.editado_em).toBeNull()
    expect(reg.registros_refeicao).toEqual([])
    expect(reg.agua_consumida_ml).toBeNull()
    expect(reg.checklist).toEqual({ agua: false, sono: false })
  })
})

describe("resolverRegistroDoDia", () => {
  it("devolve o registro existente sem sobrescrever", () => {
    const existente = { ...criarRegistroVazio(ctx), agua_consumida_ml: 500 }
    expect(resolverRegistroDoDia(existente, ctx)).toBe(existente)
  })

  it("cria um vazio quando não há registro do dia", () => {
    expect(resolverRegistroDoDia(null, ctx).agua_consumida_ml).toBeNull()
  })
})

describe("alternarStatusRefeicao (ADR-0001)", () => {
  const base = criarRegistroVazio(ctx)

  it("marca Seguiu com a Opção seguida", () => {
    const r = alternarStatusRefeicao(base, "cafe", "Seguiu", "opt-1")
    expect(statusDaRefeicao(r, "cafe")).toBe("Seguiu")
    expect(r.registros_refeicao[0]).toEqual({
      refeicao_id: "cafe",
      status: "Seguiu",
      opcao_seguida_id: "opt-1",
    })
  })

  it("NaoSeguiu não carrega opcao_seguida_id", () => {
    const r = alternarStatusRefeicao(base, "cafe", "NaoSeguiu", "opt-1")
    expect(r.registros_refeicao[0]).toEqual({ refeicao_id: "cafe", status: "NaoSeguiu" })
  })

  it("clicar no status ativo desmarca a refeição", () => {
    const marcado = alternarStatusRefeicao(base, "cafe", "Seguiu", "opt-1")
    const desmarcado = alternarStatusRefeicao(marcado, "cafe", "Seguiu", "opt-1")
    expect(statusDaRefeicao(desmarcado, "cafe")).toBeNull()
  })

  it("troca de Seguiu para NaoSeguiu sem duplicar a refeição", () => {
    const seguiu = alternarStatusRefeicao(base, "cafe", "Seguiu", "opt-1")
    const trocado = alternarStatusRefeicao(seguiu, "cafe", "NaoSeguiu", "opt-1")
    expect(trocado.registros_refeicao).toHaveLength(1)
    expect(statusDaRefeicao(trocado, "cafe")).toBe("NaoSeguiu")
  })

  it("mantém o resultado válido no schema após alterações", () => {
    const r = alternarStatusRefeicao(base, "cafe", "Seguiu", "opt-1")
    expect(() => parseRegistroDeAderencia(r)).not.toThrow()
  })
})

describe("incrementarAgua", () => {
  const base = criarRegistroVazio(ctx)

  it("soma a partir de null tratando como zero", () => {
    expect(incrementarAgua(base, 250).agua_consumida_ml).toBe(250)
  })

  it("acumula incrementos", () => {
    const r = incrementarAgua(incrementarAgua(base, 250), 500)
    expect(r.agua_consumida_ml).toBe(750)
  })

  it("nunca desce abaixo de zero", () => {
    const r = incrementarAgua(incrementarAgua(base, 250), -1000)
    expect(r.agua_consumida_ml).toBe(0)
  })
})

describe("definirTreino / definirChecklistItem", () => {
  const base = criarRegistroVazio(ctx)

  it("marca treino realizado", () => {
    expect(definirTreino(base, true).treino_realizado).toBe(true)
  })

  it("marca um item do checklist preservando os demais", () => {
    const r = definirChecklistItem(base, "agua", true)
    expect(r.checklist).toEqual({ agua: true, sono: false })
  })
})

describe("carimbarEdicao (ADR-0008/0015)", () => {
  const base = criarRegistroVazio(ctx)
  const agora = () => new Date("2026-07-14T12:00:00.000Z")

  it("registro ao vivo, primeiro salvamento (criação) mantém editado_em nulo", () => {
    expect(carimbarEdicao(base, false, false, agora).editado_em).toBeNull()
  })

  it("em edições posteriores carimba o timestamp atual", () => {
    expect(carimbarEdicao(base, true, false, agora).editado_em).toBe("2026-07-14T12:00:00.000Z")
  })

  it("escrita retroativa carimba já na primeira gravação (ADR-0015)", () => {
    expect(carimbarEdicao(base, false, true, agora).editado_em).toBe("2026-07-14T12:00:00.000Z")
  })

  it("edição retroativa de registro existente também carimba", () => {
    expect(carimbarEdicao(base, true, true, agora).editado_em).toBe("2026-07-14T12:00:00.000Z")
  })

  it("nunca altera data (imutável)", () => {
    const carimbado = carimbarEdicao(base, true, false, agora)
    expect(carimbado.data).toBe(base.data)
  })
})

describe("formatarRepeticao (ADR-0009)", () => {
  it("formata cada variante da união", () => {
    expect(formatarRepeticao({ tipo: "Faixa", min: 8, max: 10 })).toBe("8–10")
    expect(formatarRepeticao({ tipo: "Fixo", valor: 20 })).toBe("20")
    expect(formatarRepeticao({ tipo: "Falha" })).toBe("até a falha")
    expect(formatarRepeticao({ tipo: "Tempo", min: 30, max: 45 })).toBe("30–45s")
    expect(formatarRepeticao({ tipo: "Piramide", sequencia: [7, 7, 7] })).toBe("7→7→7")
  })
})

describe("saudacaoDoDia (ADR-0019)", () => {
  it("bom dia entre 05h e 11h59", () => {
    expect(saudacaoDoDia("Ana", 5)).toBe("Bom dia, Ana")
    expect(saudacaoDoDia("Ana", 11)).toBe("Bom dia, Ana")
  })

  it("boa tarde entre 12h e 17h59", () => {
    expect(saudacaoDoDia("Ana", 12)).toBe("Boa tarde, Ana")
    expect(saudacaoDoDia("Ana", 17)).toBe("Boa tarde, Ana")
  })

  it("boa noite entre 18h e 04h59", () => {
    expect(saudacaoDoDia("Ana", 18)).toBe("Boa noite, Ana")
    expect(saudacaoDoDia("Ana", 23)).toBe("Boa noite, Ana")
    expect(saudacaoDoDia("Ana", 0)).toBe("Boa noite, Ana")
    expect(saudacaoDoDia("Ana", 4)).toBe("Boa noite, Ana")
  })
})

// Sanidade de tipos: o registro construído satisfaz RegistroDeAderencia.
const _tipo: RegistroDeAderencia = criarRegistroVazio(ctx)
void _tipo
const _ts: ISOTimestamp | null = _tipo.editado_em
void _ts
