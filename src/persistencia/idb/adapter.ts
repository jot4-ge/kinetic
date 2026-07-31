import type {
  CamadaDePersistencia,
  UsuarioRepositorio,
  PlanoRepositorio,
  ExercicioRepositorio,
  RegistroRepositorio,
  PesoRepositorio,
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
  parseRegistroDePeso,
} from "@/types"
import { arquivarPlano } from "@/dominio/plano"
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

    // ADR-0002: troca atômica. Uma única transação readwrite sobre "planos"
    // garante que arquivar o atual e ativar o novo comitam juntos — nunca há um
    // estado persistido com zero ou dois Planos ativos. A leitura do atual
    // acontece DENTRO da transação (não de um snapshot anterior), então a
    // decisão de arquivar usa o estado corrente do store.
    async arquivarEAtivar(novo: PlanoAtivo, dataArquivamento: ISODate) {
      const tx = db.transaction("planos", "readwrite")
      const atualRaw = await tx.store
        .index("por_usuario_e_status")
        .get([novo.usuario_id, "ativo"])

      if (atualRaw) {
        const atual = planoAtivoSchema.parse(atualRaw)
        // Guarda de idempotência: se o "ativo" corrente já é o próprio `novo`
        // (mesmo id), não faz sentido arquivá-lo contra si mesmo.
        if (atual.id !== novo.id) {
          await tx.store.put(arquivarPlano(atual, dataArquivamento))
        }
      }

      await tx.store.put(novo)
      await tx.done
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

function makePesos(db: RotinaIDB): PesoRepositorio {
  return {
    // ADR-0018: garantia estrutural de "no máximo um por dia" — o upsert
    // acontece aqui, não no chamador. Lê o índice DENTRO da mesma transação
    // readwrite da escrita (mesmo princípio de PlanoRepositorio.arquivarEAtivar),
    // então a decisão create-vs-update usa o estado corrente do store, não um
    // snapshot anterior. Se já existe um registro para (usuario_id, data),
    // reaproveita seu id e criado_em; peso_kg e editado_em vêm do `registro` recebido.
    async salvar(registro) {
      const tx = db.transaction("registros_peso", "readwrite")
      const raw = await tx.store
        .index("por_usuario_e_data")
        .get([registro.usuario_id, registro.data])

      if (raw) {
        const existente = parseRegistroDePeso(raw)
        await tx.store.put({
          ...existente,
          peso_kg: registro.peso_kg,
          editado_em: registro.editado_em,
        })
      } else {
        await tx.store.put(registro)
      }
      await tx.done
    },

    async buscarPorData(usuarioId, data) {
      const raw = await db.getFromIndex("registros_peso", "por_usuario_e_data", [usuarioId, data])
      return raw ? parseRegistroDePeso(raw) : null
    },

    async listarPorPeriodo(usuarioId, de, ate) {
      const range = IDBKeyRange.bound([usuarioId, de], [usuarioId, ate])
      const raws = await db.getAllFromIndex("registros_peso", "por_usuario_e_data", range)
      return raws.map(parseRegistroDePeso)
    },

    // Índice composto [usuario_id, data] retorna em ordem ascendente por data;
    // o mais recente é o último elemento do range do próprio usuário.
    async buscarMaisRecente(usuarioId) {
      const range = IDBKeyRange.bound([usuarioId, ""], [usuarioId, "￿"])
      const raws = await db.getAllFromIndex("registros_peso", "por_usuario_e_data", range)
      if (raws.length === 0) return null
      return parseRegistroDePeso(raws[raws.length - 1])
    },
  }
}

export function createIdbAdapter(db: RotinaIDB): CamadaDePersistencia {
  return {
    usuarios:   makeUsuarios(db),
    planos:     makePlanos(db),
    exercicios: makeExercicios(db),
    registros:  makeRegistros(db),
    pesos:      makePesos(db),
  }
}
