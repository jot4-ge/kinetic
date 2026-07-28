import { describe, it, expect } from "vitest"
import { planoVigenteEm } from "./vigencia"
import type { Plano, ISODate, ISOTimestamp, PlanoId } from "@/types"

// planoVigenteEm só lê `vigencia` e `criado_em`; um objeto mínimo com esse shape
// basta para exercitar a seleção — o resto do Plano é irrelevante aqui.
function plano(
  id: string,
  inicio: string,
  fim: string | null,
  criado_em = `${inicio}T00:00:00.000Z`,
): Plano {
  const vigencia =
    fim === null
      ? { status: "ativo" as const, inicio: inicio as ISODate }
      : { status: "arquivado" as const, inicio: inicio as ISODate, fim: fim as ISODate }
  return { id: id as PlanoId, criado_em: criado_em as ISOTimestamp, vigencia } as Plano
}

// Cenário contíguo típico: A → B arquivados, C ativo (cada um começa no fim do
// anterior, ADR-0002).
const A = plano("A", "2026-01-01", "2026-03-01")
const B = plano("B", "2026-03-01", "2026-05-01")
const C = plano("C", "2026-05-01", null)
const planos = [C, A, B] // ordem de entrada irrelevante

describe("planoVigenteEm", () => {
  it("data anterior ao primeiro Plano não tem vigente", () => {
    expect(planoVigenteEm(planos, "2025-12-31" as ISODate)).toBeNull()
  })

  it("lista vazia devolve null", () => {
    expect(planoVigenteEm([], "2026-02-15" as ISODate)).toBeNull()
  })

  it("data dentro de um Plano arquivado devolve esse Plano", () => {
    expect(planoVigenteEm(planos, "2026-02-15" as ISODate)?.id).toBe("A")
    expect(planoVigenteEm(planos, "2026-04-10" as ISODate)?.id).toBe("B")
  })

  it("data dentro do Plano ativo devolve o ativo", () => {
    expect(planoVigenteEm(planos, "2026-06-01" as ISODate)?.id).toBe("C")
  })

  it("no dia de fronteira, vence o Plano que COMEÇOU nesse dia, não o que terminou", () => {
    // 2026-03-01 é fim de A e início de B → B.
    expect(planoVigenteEm(planos, "2026-03-01" as ISODate)?.id).toBe("B")
    // 2026-05-01 é fim de B e início de C → C.
    expect(planoVigenteEm(planos, "2026-05-01" as ISODate)?.id).toBe("C")
  })

  it("empate de início (regeneração no mesmo dia) desempata pelo criado_em mais recente", () => {
    const velho = plano("velho", "2026-05-01", "2026-05-01", "2026-05-01T08:00:00.000Z")
    const novo = plano("novo", "2026-05-01", null, "2026-05-01T09:00:00.000Z")
    expect(planoVigenteEm([velho, novo], "2026-05-01" as ISODate)?.id).toBe("novo")
  })

  it("data numa lacuna entre Planos (arquivado que já terminou, próximo ainda não começou) é null", () => {
    const p1 = plano("p1", "2026-01-01", "2026-02-01")
    const p2 = plano("p2", "2026-04-01", null)
    expect(planoVigenteEm([p1, p2], "2026-03-01" as ISODate)).toBeNull()
  })
})
