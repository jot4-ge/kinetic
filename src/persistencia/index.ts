// Camada de Persistência — public surface (ADR-0007)
//
// Import only from here: `import type { CamadaDePersistencia } from "@/persistencia"`
// The concrete adapter (IDB or Supabase) is an implementation detail hidden behind
// the contratos.ts seam.

export type {
  CamadaDePersistencia,
  UsuarioRepositorio,
  PlanoRepositorio,
  ExercicioRepositorio,
  RegistroRepositorio,
} from "./contratos"

export { openDb, DB_NAME, DB_VERSION } from "./idb/db"
export { createIdbAdapter } from "./idb/adapter"
