import type {
  CamadaDePersistencia,
  UsuarioRepositorio,
  PlanoRepositorio,
  ExercicioRepositorio,
  RegistroRepositorio,
} from "../contratos"
import type {
  UsuarioId, PlanoId, ExercicioId, RegistroId,
  ISODate,
  PlanoAtivo,
} from "@/types"
import {
  parseUsuario,
  parsePlano,
  planoAtivoSchema,
  parseExercicio,
  parseRegistroDeAderencia,
} from "@/types"
import type { RotinaIDB } from "./db"

function makeUsuarios(db: RotinaIDB): UsuarioRepositorio {
  return {
    async salvar(usuario) {
      await db.put("usuarios", usuario)
    },
    async buscar(id: UsuarioId) {
      const raw = await db.get("usuarios", id)
      return raw ? parseUsuario(raw) : null
    },
  }
}

function makePlanos(db: RotinaIDB): PlanoRepositorio {
  return {
    async salvar(plano) {
      await db.put("planos", plano)
    },

    async buscar(id: PlanoId) {
      const raw = await db.get("planos", id)
      return raw ? parsePlano(raw) : null
    },

    // O(log n) via índice composto [usuario_id, vigencia.status] (ADR-0002).
    async buscarAtivo(usuarioId: UsuarioId): Promise<PlanoAtivo | null> {
      const raw = await db.getFromIndex("planos", "por_usuario_e_status", [usuarioId, "ativo"])
      if (!raw) return null
      const result = planoAtivoSchema.safeParse(raw)
      if (!result.success) throw result.error
      return result.data
    },

    async listarPorUsuario(usuarioId: UsuarioId) {
      const raws = await db.getAllFromIndex("planos", "por_usuario", usuarioId)
      const planos = raws.map(parsePlano)
      return planos.sort((a, b) => b.vigencia.inicio.localeCompare(a.vigencia.inicio))
    },
  }
}

function makeExercicios(db: RotinaIDB): ExercicioRepositorio {
  return {
    async salvar(exercicio) {
      await db.put("exercicios", exercicio)
    },

    async salvarLote(exercicios) {
      const tx = db.transaction("exercicios", "readwrite")
      await Promise.all([...exercicios.map(e => tx.store.put(e)), tx.done])
    },

    async buscar(id: ExercicioId) {
      const raw = await db.get("exercicios", id)
      return raw ? parseExercicio(raw) : null
    },

    async listarTodos() {
      const raws = await db.getAll("exercicios")
      return raws.map(parseExercicio)
    },
  }
}

function makeRegistros(db: RotinaIDB): RegistroRepositorio {
  return {
    async salvar(registro) {
      // ADR-0008: o adapter persiste o registro exatamente como recebido.
      // data é imutável e editado_em deve ser atualizado pelo chamador antes de salvar.
      await db.put("registros_aderencia", registro)
    },

    async buscar(id: RegistroId) {
      const raw = await db.get("registros_aderencia", id)
      return raw ? parseRegistroDeAderencia(raw) : null
    },

    async buscarPorData(usuarioId: UsuarioId, data: ISODate) {
      const raw = await db.getFromIndex(
        "registros_aderencia",
        "por_usuario_e_data",
        [usuarioId, data],
      )
      return raw ? parseRegistroDeAderencia(raw) : null
    },

    async listarPorPeriodo(usuarioId: UsuarioId, de: ISODate, ate: ISODate) {
      const range = IDBKeyRange.bound([usuarioId, de], [usuarioId, ate])
      const raws = await db.getAllFromIndex("registros_aderencia", "por_usuario_e_data", range)
      return raws.map(parseRegistroDeAderencia)
    },

    async listarPorPlano(planoId: PlanoId) {
      // Range sobre [plano_id, ""] → [plano_id, "￿"] captura todas as datas.
      const range = IDBKeyRange.bound([planoId, ""], [planoId, "￿"])
      const raws = await db.getAllFromIndex("registros_aderencia", "por_plano_e_data", range)
      return raws.map(parseRegistroDeAderencia)
    },
  }
}

export function createIdbAdapter(db: RotinaIDB): CamadaDePersistencia {
  return {
    usuarios:   makeUsuarios(db),
    planos:     makePlanos(db),
    exercicios: makeExercicios(db),
    registros:  makeRegistros(db),
  }
}
