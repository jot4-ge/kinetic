import { describe, it, expect } from "vitest"
import { arquivarPlano } from "./plano"
import { gerarPlano } from "@/motor-geracao"
import type { PlanoAtivo, PlanoId, UsuarioId, ISODate, ISOTimestamp } from "@/types"

const conteudo = gerarPlano({
  peso_kg: 80, altura_cm: 178, idade: 28, sexo: "M",
  fator_atividade: "MuitoAtivo", objetivo: "Cutting",
})

const ativo: PlanoAtivo = {
  id: "plano-1" as PlanoId,
  usuario_id: "user-1" as UsuarioId,
  autor_id: "user-1" as UsuarioId,
  criado_em: "2026-06-01T10:00:00.000Z" as ISOTimestamp,
  vigencia: { status: "ativo", inicio: "2026-06-01" as ISODate },
  ...conteudo,
}

describe("arquivarPlano", () => {
  const fim = "2026-07-16" as ISODate

  it("troca o status de 'ativo' para 'arquivado'", () => {
    const arquivado = arquivarPlano(ativo, fim)
    expect(arquivado.vigencia.status).toBe("arquivado")
  })

  it("define a data de arquivamento em `fim`", () => {
    const arquivado = arquivarPlano(ativo, fim)
    expect(arquivado.vigencia.fim).toBe(fim)
  })

  it("preserva a data de início (ADR-0002)", () => {
    const arquivado = arquivarPlano(ativo, fim)
    expect(arquivado.vigencia.inicio).toBe(ativo.vigencia.inicio)
  })

  it("preserva id, usuario_id, autor_id e criado_em", () => {
    const arquivado = arquivarPlano(ativo, fim)
    expect(arquivado.id).toBe(ativo.id)
    expect(arquivado.usuario_id).toBe(ativo.usuario_id)
    expect(arquivado.autor_id).toBe(ativo.autor_id)
    expect(arquivado.criado_em).toBe(ativo.criado_em)
  })

  it("não altera nenhuma meta nutricional nem o conteúdo (ADR-0003: Plano imutável)", () => {
    const arquivado = arquivarPlano(ativo, fim)
    expect(arquivado.objetivo).toBe(ativo.objetivo)
    expect(arquivado.meta_calorica_diaria).toBe(ativo.meta_calorica_diaria)
    expect(arquivado.meta_proteina_diaria_g).toBe(ativo.meta_proteina_diaria_g)
    expect(arquivado.meta_carboidrato_diaria_g).toBe(ativo.meta_carboidrato_diaria_g)
    expect(arquivado.meta_gordura_diaria_g).toBe(ativo.meta_gordura_diaria_g)
    expect(arquivado.meta_agua_diaria_ml).toBe(ativo.meta_agua_diaria_ml)
    expect(arquivado.perfis_refeicao).toEqual(ativo.perfis_refeicao)
    expect(arquivado.sessoes_treino).toEqual(ativo.sessoes_treino)
    expect(arquivado.checklist_template).toEqual(ativo.checklist_template)
  })

  it("arquivar só muda status/inicio/fim — todo o resto é idêntico ao original", () => {
    const arquivado = arquivarPlano(ativo, fim)
    // Reconstrói o esperado a partir do ativo: mesma coisa, só a vigência muda.
    const esperado = { ...ativo, vigencia: { status: "arquivado", inicio: ativo.vigencia.inicio, fim } }
    expect(arquivado).toEqual(esperado)
  })

  it("não muta o Plano de entrada (retorna novo objeto)", () => {
    const arquivado = arquivarPlano(ativo, fim)
    expect(ativo.vigencia.status).toBe("ativo")
    expect(arquivado).not.toBe(ativo)
  })

  it("aceita arquivamento no mesmo dia do início (fim === inicio)", () => {
    const arquivado = arquivarPlano(ativo, ativo.vigencia.inicio)
    expect(arquivado.vigencia.inicio).toBe(arquivado.vigencia.fim)
  })
})
