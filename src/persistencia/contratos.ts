// Contratos da Camada de Persistência (ADR-0007)
//
// These interfaces are the only seam between app logic and storage.
// The rest of the codebase depends on these shapes, not on IndexedDB or
// Supabase directly. Swap the adapter in CamadaDePersistencia; nothing else
// changes.
//
// Design (codebase-design deep-module principle):
//   - Small interface at the seam: callers express WHAT they need (save,
//     find, list), not HOW storage works (IDBTransaction, cursor, SQL).
//   - Four repositories, one per IDB store, matching the domain model.
//   - Upsert semantics for `salvar` — caller is responsible for setting
//     editado_em before calling (ADR-0008 is enforced at the call site,
//     not here).

import type {
  UsuarioId, PlanoId, ExercicioId, RegistroId,
  ISODate,
  Usuario, Plano, PlanoAtivo, Exercicio, RegistroDeAderencia,
} from "@/types"

// ─── UsuarioRepositorio ────────────────────────────────────────────────────
// Single-user in Camada 1: the only query pattern is get-by-id.
// A `listar` is not exposed — never needed; avoids designing for hypotheticals.

export interface UsuarioRepositorio {
  salvar(usuario: Usuario): Promise<void>
  buscar(id: UsuarioId): Promise<Usuario | null>
}

// ─── PlanoRepositorio ──────────────────────────────────────────────────────
// Fast path: buscar(id) using usuario.plano_ativo_id — no scan needed.
// listarPorUsuario: for the "history" screen (all plans, newest first).

export interface PlanoRepositorio {
  salvar(plano: Plano): Promise<void>
  buscar(id: PlanoId): Promise<Plano | null>
  listarPorUsuario(usuarioId: UsuarioId): Promise<Plano[]>
  // Convenience: returns the single active plan or null.
  // Equivalent to buscar(usuario.plano_ativo_id), extracted here to keep
  // the IDB index query logic inside the adapter.
  buscarAtivo(usuarioId: UsuarioId): Promise<PlanoAtivo | null>
}

// ─── ExercicioRepositorio ──────────────────────────────────────────────────
// The Banco de Opções is a small curated set — load all eagerly at startup.
// salvarLote: used once when seeding the banco; avoids N individual writes.

export interface ExercicioRepositorio {
  salvar(exercicio: Exercicio): Promise<void>
  salvarLote(exercicios: Exercicio[]): Promise<void>
  buscar(id: ExercicioId): Promise<Exercicio | null>
  listarTodos(): Promise<Exercicio[]>
}

// ─── RegistroRepositorio ───────────────────────────────────────────────────
// buscarPorData: the main "today" lookup — (usuario_id, data) compound index.
// listarPorPeriodo: analytics/progress screen — range of dates for a user.
// listarPorPlano: for archiving — all registros bound to a given Plano.

export interface RegistroRepositorio {
  salvar(registro: RegistroDeAderencia): Promise<void>
  buscar(id: RegistroId): Promise<RegistroDeAderencia | null>
  buscarPorData(usuarioId: UsuarioId, data: ISODate): Promise<RegistroDeAderencia | null>
  listarPorPeriodo(usuarioId: UsuarioId, de: ISODate, ate: ISODate): Promise<RegistroDeAderencia[]>
  listarPorPlano(planoId: PlanoId): Promise<RegistroDeAderencia[]>
}

// ─── CamadaDePersistencia — unified seam ──────────────────────────────────
// The single value the rest of the app receives (via React context or DI).
// Camada 1: IdbAdapter (src/persistencia/idb/index.ts) — TODO
// Camada 2: SupabaseAdapter (src/persistencia/supabase/index.ts) — future

export interface CamadaDePersistencia {
  readonly usuarios:   UsuarioRepositorio
  readonly planos:     PlanoRepositorio
  readonly exercicios: ExercicioRepositorio
  readonly registros:  RegistroRepositorio
}
