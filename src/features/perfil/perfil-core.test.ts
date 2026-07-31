import { describe, it, expect } from "vitest"
import { OBJETIVO_LABEL, diasEntre, formatarDesde } from "./perfil-core"
import type { ISODate } from "@/types"

describe("diasEntre", () => {
  it("mesma data → 0 dias", () => {
    expect(diasEntre("2026-07-06" as ISODate, "2026-07-06" as ISODate)).toBe(0)
  })

  it("conta dias corridos dentro do mesmo mês", () => {
    expect(diasEntre("2026-07-06" as ISODate, "2026-07-30" as ISODate)).toBe(24)
  })

  it("atravessa virada de mês corretamente", () => {
    expect(diasEntre("2026-07-25" as ISODate, "2026-08-03" as ISODate)).toBe(9)
  })

  it("atravessa fevereiro bissexto", () => {
    // 2028 é bissexto: fev tem 29 dias.
    expect(diasEntre("2028-02-01" as ISODate, "2028-03-01" as ISODate)).toBe(29)
  })
})

describe("formatarDesde", () => {
  it("plural padrão", () => {
    expect(formatarDesde("2026-07-06" as ISODate, "2026-07-30" as ISODate))
      .toBe("desde 6 jul 2026 · 24 dias")
  })

  it("singular para exatamente 1 dia", () => {
    expect(formatarDesde("2026-07-29" as ISODate, "2026-07-30" as ISODate))
      .toBe("desde 29 jul 2026 · 1 dia")
  })

  it("0 dias (plano criado hoje) não vira singular", () => {
    expect(formatarDesde("2026-07-30" as ISODate, "2026-07-30" as ISODate))
      .toBe("desde 30 jul 2026 · 0 dias")
  })
})

describe("OBJETIVO_LABEL", () => {
  it("cobre os quatro objetivos com rótulo em português correto", () => {
    expect(OBJETIVO_LABEL.Cutting).toBe("Cutting")
    expect(OBJETIVO_LABEL.Manutencao).toBe("Manutenção")
    expect(OBJETIVO_LABEL.Bulk).toBe("Bulk")
    expect(OBJETIVO_LABEL.Recomposicao).toBe("Recomposição")
  })
})
