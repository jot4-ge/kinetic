import { openDB, type IDBPDatabase, type DBSchema } from "idb"
import type { Usuario, Plano, Exercicio, RegistroDeAderencia } from "@/types"
import { BANCO_EXERCICIOS } from "@/banco-opcoes"

export const DB_NAME    = "rotina-sync"
export const DB_VERSION = 1

interface RotinaDB extends DBSchema {
  usuarios: {
    key: string
    value: Usuario
  }
  planos: {
    key: string
    value: Plano
    indexes: {
      por_usuario:          string
      por_usuario_e_status: [string, string]
    }
  }
  exercicios: {
    key: string
    value: Exercicio
  }
  registros_aderencia: {
    key: string
    value: RegistroDeAderencia
    indexes: {
      por_usuario_e_data: [string, string]
      por_plano_e_data:   [string, string]
    }
  }
}

export type RotinaIDB = IDBPDatabase<RotinaDB>

// Populates exercicios from BANCO_EXERCICIOS when the store is empty.
// "Empty = first launch" is safe because the Banco is curated and deterministic —
// re-seeding always produces identical data. Usuarios and Planos are never seeded:
// they only exist when the app actually creates them.
async function seedIfNeeded(db: RotinaIDB): Promise<void> {
  const count = await db.count("exercicios")
  if (count > 0) return
  const tx = db.transaction("exercicios", "readwrite")
  await Promise.all([...BANCO_EXERCICIOS.map(e => tx.store.put(e)), tx.done])
}

export async function openDb(name = DB_NAME): Promise<RotinaIDB> {
  const db = await openDB<RotinaDB>(name, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore("usuarios", { keyPath: "id" })

      const planos = db.createObjectStore("planos", { keyPath: "id" })
      // por_usuario: lista de planos de um usuário (listarPorUsuario)
      planos.createIndex("por_usuario", "usuario_id", { unique: false })
      // por_usuario_e_status: acesso O(log n) ao PlanoAtivo sem scan (ADR-0002)
      // keyPath usa dot-notation IDB para acessar a propriedade aninhada vigencia.status
      planos.createIndex("por_usuario_e_status", ["usuario_id", "vigencia.status"], { unique: false })

      db.createObjectStore("exercicios", { keyPath: "id" })

      const registros = db.createObjectStore("registros_aderencia", { keyPath: "id" })
      // Compound [usuario_id, data]: buscarPorData (ponto) e listarPorPeriodo (range)
      registros.createIndex("por_usuario_e_data", ["usuario_id", "data"], { unique: false })
      // Compound [plano_id, data]: listarPorPlano com resultado ordenado por data
      registros.createIndex("por_plano_e_data", ["plano_id", "data"], { unique: false })
    },
  })
  await seedIfNeeded(db)
  return db
}
