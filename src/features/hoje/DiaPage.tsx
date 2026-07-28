// Página de um dia qualquer (/dia/:data) — o caso geral de RegistroDoDia, irmão
// de HojePage. Diferem só na resolução de contexto: aqui o Plano é o VIGENTE na
// data (não o Ativo de hoje), resolvido por vigência (ADR-0002/0003/0015).
//
// Guardas de rota (ADR-0015):
//   - data malformada        → /hoje
//   - data == hoje           → /hoje (hoje tem uma URL canônica, pelo caminho rápido)
//   - data futura            → /calendario (não se registra o que não aconteceu)
//   - data < primeiro Plano  → estado vazio: nada a registrar, sem edição
//
// Resolução do Plano da data:
//   - dia COM Registro  → o plano_id imutável do próprio Registro é a autoridade
//                         (mesmo que esse Plano esteja hoje arquivado).
//   - dia SEM Registro  → planoVigenteEm(todos os Planos, data).

import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { useParams } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import { EstadoVazio } from "@/components/EstadoVazio"
import { planoVigenteEm } from "@/dominio/vigencia"
import { formatarISODate } from "@/utils/data"
import { formatarDataCurta } from "@/features/historico/historico-core"
import { parseDataISO, ehDataFutura } from "@/features/calendario/calendario-core"
import { ID_USUARIO_LOCAL } from "@/features/onboarding/onboarding-core"
import type { Plano, RegistroDeAderencia, ISODate } from "@/types"
import { RegistroDoDia } from "./RegistroDoDia"

interface EstadoCarregado {
  plano: Plano | null
  registro: RegistroDeAderencia | null
}

// Dia anterior ao primeiro Plano (ou Plano do Registro sumido): não há regras a
// aplicar, então não há o que registrar. Mostra-se com clareza, sem editor.
function SemPlanoNaData({ data }: { data: ISODate }) {
  return (
    <section style={{ paddingTop: "var(--space-5)" }}>
      <p style={{ fontFamily: "var(--font-data)", color: "var(--text-muted)", fontSize: "13px" }}>
        {formatarDataCurta(data)}
      </p>
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-hairline)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-6) var(--space-5)",
          marginTop: "var(--space-4)",
        }}
      >
        <EstadoVazio>
          <p style={{ color: "var(--text)", marginBottom: "var(--space-2)" }}>Nada a registrar.</p>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            Este dia é anterior ao seu primeiro Plano.
          </p>
        </EstadoVazio>
      </div>
    </section>
  )
}

export function DiaPage() {
  const { data: param } = useParams<{ data: string }>()
  const persistencia = usePersistencia()

  const hoje = formatarISODate(new Date())
  const dataValida = param ? parseDataISO(param) : null

  // Redirecionos síncronos (guardas de rota). Calculados a cada render; hooks
  // abaixo permanecem incondicionais.
  let destino: string | null = null
  if (!dataValida) destino = "/hoje"
  else if (dataValida === hoje) destino = "/hoje"
  else if (ehDataFutura(dataValida, hoje)) destino = "/calendario"

  const [carregando, setCarregando] = useState(true)
  const [estado, setEstado] = useState<EstadoCarregado | null>(null)

  useEffect(() => {
    if (destino || !dataValida) return
    let ativo = true
    async function carregar() {
      const existente = await persistencia.registros.buscarPorData(ID_USUARIO_LOCAL, dataValida!)
      if (!ativo) return

      let plano: Plano | null
      if (existente) {
        // O Registro carrega seu Plano imutável — a autoridade da data (ADR-0003).
        plano = await persistencia.planos.buscar(existente.plano_id)
      } else {
        const todos = await persistencia.planos.listarPorUsuario(ID_USUARIO_LOCAL)
        plano = planoVigenteEm(todos, dataValida!)
      }
      if (!ativo) return

      setEstado({ plano, registro: existente })
      setCarregando(false)
    }
    void carregar()
    return () => {
      ativo = false
    }
  }, [persistencia, dataValida, destino])

  if (destino) return <Navigate to={destino} replace />
  if (carregando || !estado) return null
  if (!estado.plano) return <SemPlanoNaData data={dataValida!} />

  return (
    <RegistroDoDia data={dataValida!} plano={estado.plano} registroExistente={estado.registro} />
  )
}
