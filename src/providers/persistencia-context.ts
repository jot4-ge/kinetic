// Context + hook da Camada de Persistência (ADR-0007).
//
// Separado do componente Provider (persistencia.tsx) porque o Fast Refresh só
// preserva estado quando um arquivo exporta apenas componentes. Aqui ficam as
// partes não-componente: o Context, o guard puro e o hook consumidor.

import { createContext, useContext } from "react"
import type { CamadaDePersistencia } from "@/persistencia"

export const PersistenciaContext = createContext<CamadaDePersistencia | null>(null)

// Guard puro, extraído para ser testável sem renderizar React (o ambiente de
// teste é `node`). É a invariante que protege o desenvolvedor: usar o hook fora
// do Provider é erro de programação, não estado de runtime — falha alto e claro.
export function assertPersistencia(
  valor: CamadaDePersistencia | null,
): CamadaDePersistencia {
  if (valor === null) {
    throw new Error(
      "usePersistencia deve ser usado dentro de <PersistenciaProvider>.",
    )
  }
  return valor
}

export function usePersistencia(): CamadaDePersistencia {
  return assertPersistencia(useContext(PersistenciaContext))
}
