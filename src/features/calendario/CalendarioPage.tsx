// Página do calendário (/calendario) — chega-se aqui pelo ícone de calendário no
// cabeçalho de um dia (RegistroDoDia). Carrega os dias com Registro do mês
// exibido (listarPorPeriodo) para marcá-los e leva a data escolhida ao seu dia.
//
// Resolução de rota do dia (ADR-0015): hoje tem uma URL canônica (/hoje, caminho
// rápido); qualquer outro dia vai para /dia/:data. Dias futuros nem chegam aqui —
// o Calendario os desabilita. A lógica de calendário é pura (calendario-core);
// esta página só resolve persistência e navegação.

import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import { ID_USUARIO_LOCAL } from "@/features/onboarding/onboarding-core"
import { formatarISODate } from "@/utils/data"
import type { ISODate } from "@/types"
import { Calendario } from "./Calendario"
import { primeiroDia, ultimoDia } from "./calendario-core"

export function CalendarioPage() {
  const persistencia = usePersistencia()
  const navigate = useNavigate()
  const hoje = formatarISODate(new Date())

  const obterDiasComRegistro = useCallback(
    async (ano: number, mes: number): Promise<Set<ISODate>> => {
      const registros = await persistencia.registros.listarPorPeriodo(
        ID_USUARIO_LOCAL,
        primeiroDia(ano, mes),
        ultimoDia(ano, mes),
      )
      return new Set(registros.map((r) => r.data))
    },
    [persistencia],
  )

  const abrirDia = useCallback(
    (data: ISODate) => {
      // Hoje é o caso particular: uma só URL canônica, pelo caminho rápido.
      navigate(data === hoje ? "/hoje" : `/dia/${data}`)
    },
    [navigate, hoje],
  )

  return (
    <section style={{ paddingTop: "var(--space-5)" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "24px",
          fontWeight: 500,
          color: "var(--text)",
          marginBottom: "var(--space-1)",
        }}
      >
        Calendário
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
        Escolha um dia para ver ou registrar sua aderência.
      </p>

      <Calendario
        hoje={hoje}
        obterDiasComRegistro={obterDiasComRegistro}
        onAbrirDia={abrirDia}
      />
    </section>
  )
}
