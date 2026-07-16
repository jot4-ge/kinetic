import { describe, it, expect } from "vitest"
import {
  validarFormulario,
  construirUsuarioEPlano,
  resolverModo,
  formularioDeUsuario,
  FORMULARIO_VAZIO,
  ID_USUARIO_LOCAL,
  FAIXA_PESO_KG,
  type FormularioBruto,
  type DepsConstrucao,
} from "./onboarding-core"
import { parseUsuario, parsePlano } from "@/types"
import type { EntradaCalculo } from "@/motor-geracao"
import type { Usuario, PlanoId, ISOTimestamp } from "@/types"

// Formulário válido de referência — cada teste altera só o campo em foco.
const formValido: FormularioBruto = {
  peso_kg: "80",
  altura_cm: "178",
  idade: "28",
  sexo: "M",
  fator_atividade: "MuitoAtivo",
  objetivo: "Cutting",
}

describe("validarFormulario", () => {
  it("aceita um formulário completo e converte para os tipos do domínio", () => {
    const r = validarFormulario(formValido)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.valor).toEqual({
      peso_kg: 80,
      altura_cm: 178,
      idade: 28,
      sexo: "M",
      fator_atividade: "MuitoAtivo",
      objetivo: "Cutting",
    })
  })

  it("aceita vírgula como separador decimal no peso", () => {
    const r = validarFormulario({ ...formValido, peso_kg: "80,5" })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.valor.peso_kg).toBe(80.5)
  })

  it("reporta todos os campos obrigatórios quando o formulário está vazio", () => {
    const r = validarFormulario(FORMULARIO_VAZIO)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(Object.keys(r.erros).sort()).toEqual(
      ["altura_cm", "fator_atividade", "idade", "objetivo", "peso_kg", "sexo"].sort(),
    )
  })

  it("mensagem de campo vazio é direta e sem pontuação exclamativa (tom brand)", () => {
    const r = validarFormulario({ ...formValido, peso_kg: "" })
    if (r.ok) throw new Error("esperava erro")
    expect(r.erros.peso_kg).toBeDefined()
    expect(r.erros.peso_kg).not.toMatch(/!|por favor/i)
  })

  it("rejeita valor não-numérico", () => {
    const r = validarFormulario({ ...formValido, peso_kg: "abc" })
    if (r.ok) throw new Error("esperava erro")
    expect(r.erros.peso_kg).toMatch(/números/i)
  })

  it("rejeita peso fora da faixa plausível", () => {
    const acima = validarFormulario({ ...formValido, peso_kg: String(FAIXA_PESO_KG.max + 1) })
    const abaixo = validarFormulario({ ...formValido, peso_kg: String(FAIXA_PESO_KG.min - 1) })
    expect(acima.ok).toBe(false)
    expect(abaixo.ok).toBe(false)
  })

  it("rejeita idade não-inteira", () => {
    const r = validarFormulario({ ...formValido, idade: "28.5" })
    if (r.ok) throw new Error("esperava erro")
    expect(r.erros.idade).toMatch(/inteiro/i)
  })

  it("rejeita enums não selecionados ou inválidos", () => {
    const r = validarFormulario({
      ...formValido,
      sexo: "",
      fator_atividade: "Turbo",
      objetivo: "",
    })
    if (r.ok) throw new Error("esperava erro")
    expect(r.erros.sexo).toBeDefined()
    expect(r.erros.fator_atividade).toBeDefined()
    expect(r.erros.objetivo).toBeDefined()
  })
})

describe("resolverModo", () => {
  function makeUsuario(plano_ativo_id: PlanoId | null): Usuario {
    return {
      id: ID_USUARIO_LOCAL,
      nome: "Você",
      email: "usuario@exemplo.invalid",
      peso_kg: 80,
      altura_cm: 178,
      idade: 28,
      sexo: "M",
      fator_atividade: "MuitoAtivo",
      objetivo: "Cutting",
      plano_ativo_id,
      criado_em: "2026-07-14T09:00:00.000Z" as ISOTimestamp,
    }
  }

  it("é 'inicial' quando não há Usuario persistido (primeiro uso)", () => {
    expect(resolverModo(null)).toBe("inicial")
  })

  it("é 'inicial' quando há Usuario mas sem Plano Ativo", () => {
    expect(resolverModo(makeUsuario(null))).toBe("inicial")
  })

  it("é 'regeneracao' quando há Usuario com Plano Ativo", () => {
    expect(resolverModo(makeUsuario("plano-1" as PlanoId))).toBe("regeneracao")
  })
})

describe("formularioDeUsuario", () => {
  const usuario: Usuario = {
    id: ID_USUARIO_LOCAL,
    nome: "Você",
    email: "usuario@exemplo.invalid",
    peso_kg: 82.5,
    altura_cm: 178,
    idade: 28,
    sexo: "F",
    fator_atividade: "ModeramenteAtivo",
    objetivo: "Recomposicao",
    plano_ativo_id: "plano-1" as PlanoId,
    criado_em: "2026-07-14T09:00:00.000Z" as ISOTimestamp,
  }

  it("pré-preenche todos os campos do formulário a partir do Usuario", () => {
    expect(formularioDeUsuario(usuario)).toEqual({
      peso_kg: "82.5",
      altura_cm: "178",
      idade: "28",
      sexo: "F",
      fator_atividade: "ModeramenteAtivo",
      objetivo: "Recomposicao",
    })
  })

  it("é o inverso de validarFormulario nos campos: revalidar reproduz a biometria", () => {
    const form = formularioDeUsuario(usuario)
    const r = validarFormulario(form)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.valor).toEqual({
      peso_kg: 82.5,
      altura_cm: 178,
      idade: 28,
      sexo: "F",
      fator_atividade: "ModeramenteAtivo",
      objetivo: "Recomposicao",
    })
  })
})

describe("construirUsuarioEPlano", () => {
  const entrada: EntradaCalculo = {
    peso_kg: 80,
    altura_cm: 178,
    idade: 28,
    sexo: "M",
    fator_atividade: "MuitoAtivo",
    objetivo: "Cutting",
  }

  const deps: DepsConstrucao = {
    gerarId: () => "plano-fixo-1",
    agora: () => new Date("2026-07-14T09:00:00.000Z"),
  }

  it("produz um Usuario e um PlanoAtivo que passam os parsers do schema", () => {
    const { usuario, plano } = construirUsuarioEPlano(entrada, deps)
    // parseUsuario/parsePlano lançam ZodError se algo estiver fora do contrato.
    expect(() => parseUsuario(usuario)).not.toThrow()
    expect(() => parsePlano(plano)).not.toThrow()
  })

  it("autoria é igual à posse na Camada 1 (ADR-0004)", () => {
    const { plano } = construirUsuarioEPlano(entrada, deps)
    expect(plano.usuario_id).toBe(ID_USUARIO_LOCAL)
    expect(plano.autor_id).toBe(ID_USUARIO_LOCAL)
  })

  it("liga o plano_ativo_id do Usuario ao Plano gerado", () => {
    const { usuario, plano } = construirUsuarioEPlano(entrada, deps)
    expect(plano.id).toBe("plano-fixo-1")
    expect(usuario.plano_ativo_id).toBe(plano.id)
  })

  it("cria o Plano como Ativo, com data de início no dia corrente", () => {
    const { plano } = construirUsuarioEPlano(entrada, deps)
    expect(plano.vigencia.status).toBe("ativo")
    expect(plano.vigencia.inicio).toBe("2026-07-14")
  })

  it("deriva metas nutricionais positivas a partir da biometria", () => {
    const { plano } = construirUsuarioEPlano(entrada, deps)
    expect(plano.meta_calorica_diaria).toBeGreaterThan(0)
    expect(plano.meta_agua_diaria_ml).toBe(35 * entrada.peso_kg)
  })
})
