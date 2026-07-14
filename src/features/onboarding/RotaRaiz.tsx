// Decisão da rota raiz ("/"): quem já tem Plano Ativo vai para /hoje; quem não
// tem vai para /onboarding. Evita reenviar ao formulário quem já concluiu o
// onboarding.
//
// A consulta é assíncrona (IndexedDB), então enquanto decide não renderiza nada
// além do shell já presente. Camada 1 é single-user: basta buscar o id fixo.

import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import { ID_USUARIO_LOCAL } from "./onboarding-core"

type Destino = "/hoje" | "/onboarding"

export function RotaRaiz() {
  const persistencia = usePersistencia()
  const [destino, setDestino] = useState<Destino | null>(null)

  useEffect(() => {
    let ativo = true
    persistencia.usuarios
      .buscar(ID_USUARIO_LOCAL)
      .then((usuario) => {
        if (!ativo) return
        setDestino(usuario && usuario.plano_ativo_id ? "/hoje" : "/onboarding")
      })
      .catch(() => {
        if (ativo) setDestino("/onboarding")
      })
    return () => {
      ativo = false
    }
  }, [persistencia])

  if (destino === null) return null
  return <Navigate to={destino} replace />
}
