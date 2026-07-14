// Provider da Camada de Persistência (ADR-0007).
//
// O Provider apenas injeta um adapter já construído (DI, como createIdbAdapter(db)
// já faz na camada de dados). Abrir o banco é responsabilidade do bootstrap
// (main.tsx), o que mantém o Provider trivial de testar e de alimentar com um
// fake. O Context, o guard e o hook vivem em persistencia-context.ts.

import { type ReactNode } from "react"
import type { CamadaDePersistencia } from "@/persistencia"
import { PersistenciaContext } from "./persistencia-context"

export function PersistenciaProvider({
  persistencia,
  children,
}: {
  persistencia: CamadaDePersistencia
  children: ReactNode
}) {
  return (
    <PersistenciaContext.Provider value={persistencia}>
      {children}
    </PersistenciaContext.Provider>
  )
}
