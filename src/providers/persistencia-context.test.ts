import { describe, it, expect } from "vitest"
import { assertPersistencia } from "./persistencia-context"
import type { CamadaDePersistencia } from "@/persistencia"

// O valor testado é apenas encaminhado pelo guard — os repositórios não são
// exercitados aqui, então um objeto vazio com o shape certo basta.
const fakePersistencia = {
  usuarios: {},
  planos: {},
  exercicios: {},
  registros: {},
} as unknown as CamadaDePersistencia

describe("assertPersistencia", () => {
  it("lança erro claro quando usado fora do Provider (valor null)", () => {
    expect(() => assertPersistencia(null)).toThrowError(
      /dentro de <PersistenciaProvider>/,
    )
  })

  it("retorna a mesma instância quando o Provider forneceu um adapter", () => {
    expect(assertPersistencia(fakePersistencia)).toBe(fakePersistencia)
  })
})
