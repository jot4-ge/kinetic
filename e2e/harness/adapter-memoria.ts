// CamadaDePersistencia em memória — usada SÓ pelo harness de verificação visual.
//
// Isolamento (a lição registrada em docs/ideias.md, "Modo dados de demonstração"):
// este adapter não importa `openDb`, não abre IndexedDB e não toca localStorage.
// Os dados vivem em arrays dentro da aba, e morrem com ela. Não existe caminho
// pelo qual uma fixture daqui alcance o banco real do navegador — não é uma
// convenção de ids que segura isso, é a ausência do próprio banco.
//
// Implementa a mesma interface que o IdbAdapter (ADR-0007), então as telas não
// sabem que estão sendo servidas por ele.

import type { CamadaDePersistencia } from "@/persistencia"
import type {
  Usuario, Plano, PlanoAtivo, Exercicio, RegistroDeAderencia,
  UsuarioId, PlanoId, ExercicioId, RegistroId, ISODate,
} from "@/types"

export interface DadosSemente {
  readonly usuario: Usuario
  readonly planos: readonly Plano[]
  readonly registros: readonly RegistroDeAderencia[]
  readonly exercicios?: readonly Exercicio[]
}

export function criarAdapterMemoria(semente: DadosSemente): CamadaDePersistencia {
  const usuarios = new Map<string, Usuario>([[semente.usuario.id, semente.usuario]])
  const planos = new Map<string, Plano>(semente.planos.map((p) => [p.id, p]))
  const exercicios = new Map<string, Exercicio>(
    (semente.exercicios ?? []).map((e) => [e.id, e]),
  )
  const registros = new Map<string, RegistroDeAderencia>(
    semente.registros.map((r) => [r.id, r]),
  )

  return {
    usuarios: {
      async salvar(usuario) { usuarios.set(usuario.id, usuario) },
      async buscar(id: UsuarioId) { return usuarios.get(id) ?? null },
    },

    planos: {
      async salvar(plano) { planos.set(plano.id, plano) },
      async buscar(id: PlanoId) { return planos.get(id) ?? null },
      async listarPorUsuario(usuarioId: UsuarioId) {
        return [...planos.values()].filter((p) => p.usuario_id === usuarioId)
      },
      async buscarAtivo(usuarioId: UsuarioId) {
        const ativo = [...planos.values()].find(
          (p) => p.usuario_id === usuarioId && p.vigencia.status === "ativo",
        )
        return (ativo as PlanoAtivo | undefined) ?? null
      },
      async arquivarEAtivar(novo: PlanoAtivo, dataArquivamento: ISODate) {
        for (const [id, p] of planos) {
          if (p.usuario_id === novo.usuario_id && p.vigencia.status === "ativo") {
            planos.set(id, {
              ...p,
              vigencia: { status: "arquivado", inicio: p.vigencia.inicio, fim: dataArquivamento },
            })
          }
        }
        planos.set(novo.id, novo)
      },
    },

    exercicios: {
      async salvar(exercicio) { exercicios.set(exercicio.id, exercicio) },
      async salvarLote(lote) { for (const e of lote) exercicios.set(e.id, e) },
      async buscar(id: ExercicioId) { return exercicios.get(id) ?? null },
      async listarTodos() { return [...exercicios.values()] },
    },

    registros: {
      async salvar(registro) { registros.set(registro.id, registro) },
      async buscar(id: RegistroId) { return registros.get(id) ?? null },
      async buscarPorData(usuarioId: UsuarioId, data: ISODate) {
        return [...registros.values()].find(
          (r) => r.usuario_id === usuarioId && r.data === data,
        ) ?? null
      },
      async listarPorPeriodo(usuarioId: UsuarioId, de: ISODate, ate: ISODate) {
        return [...registros.values()].filter(
          (r) => r.usuario_id === usuarioId && r.data >= de && r.data <= ate,
        )
      },
      async listarPorPlano(planoId: PlanoId) {
        return [...registros.values()].filter((r) => r.plano_id === planoId)
      },
    },
  }
}
