// Tela "hoje" — o caso particular de RegistroDoDia em que a data é a de hoje
// (ADR-0015). Aqui só há o CAMINHO RÁPIDO de resolução de contexto: o Plano Ativo
// (buscarAtivo, sem varrer Planos) e o Registro de hoje (buscarPorData). A UI de
// edição inteira — refeições, água, treino/JJ, checklist — vive em RegistroDoDia
// e é a mesma para qualquer dia; "hoje" não a duplica.

import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import { formatarISODate } from "@/utils/data"
import { ID_USUARIO_LOCAL } from "@/features/onboarding/onboarding-core"
import type { PlanoAtivo, RegistroDeAderencia, ISODate } from "@/types"
import { RegistroDoDia } from "./RegistroDoDia"

interface EstadoCarregado {
  plano: PlanoAtivo
  data: ISODate
  registro: RegistroDeAderencia | null
  nomeUsuario: string | null
}

export function HojePage() {
  const persistencia = usePersistencia()

  const [carregando, setCarregando] = useState(true)
  const [semPlano, setSemPlano] = useState(false)
  const [estado, setEstado] = useState<EstadoCarregado | null>(null)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const plano = await persistencia.planos.buscarAtivo(ID_USUARIO_LOCAL)
      if (!ativo) return
      if (!plano) {
        setSemPlano(true)
        setCarregando(false)
        return
      }
      const data = formatarISODate(new Date())
      const [registro, usuario] = await Promise.all([
        persistencia.registros.buscarPorData(ID_USUARIO_LOCAL, data),
        persistencia.usuarios.buscar(ID_USUARIO_LOCAL),
      ])
      if (!ativo) return

      setEstado({ plano, data, registro, nomeUsuario: usuario?.nome ?? null })
      setCarregando(false)
    }
    void carregar()
    return () => {
      ativo = false
    }
  }, [persistencia])

  if (carregando) return null
  if (semPlano) return <Navigate to="/onboarding" replace />
  if (!estado) return null

  return (
    <RegistroDoDia
      data={estado.data}
      plano={estado.plano}
      registroExistente={estado.registro}
      nomeUsuario={estado.nomeUsuario}
    />
  )
}
