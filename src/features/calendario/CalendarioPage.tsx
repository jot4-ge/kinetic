// Página do calendário (/calendario) — chega-se aqui pelo ícone de calendário no
// cabeçalho de um dia (RegistroDoDia). Carrega os Registros do mês exibido e os
// Planos do usuário, monta o resumo de cada dia e do mês (aderencia-core) e leva
// a data escolhida ao seu dia.
//
// Por que os Planos: a métrica de aderência precisa saber quantas refeições o dia
// PREVIA, e isso vive no Plano — não no Registro, cujo array de refeições é
// esparso. Cada Registro é medido contra o Plano ao qual está vinculado por
// plano_id (imutável, ADR-0015), não contra o Plano Ativo de hoje: um dia
// registrado sob um Plano hoje arquivado continua sendo medido pelo dele.
//
// Resolução de rota do dia (ADR-0015): hoje tem uma URL canônica (/hoje, caminho
// rápido); qualquer outro dia vai para /dia/:data. Dias futuros nem chegam aqui —
// o Calendario os desabilita. Toda a lógica é pura (calendario-core,
// aderencia-core); esta página só resolve persistência e navegação.

import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import { ID_USUARIO_LOCAL } from "@/features/onboarding/onboarding-core"
import { formatarISODate } from "@/utils/data"
import type { ISODate, Plano, PlanoId } from "@/types"
import { Calendario, type DadosDoMes } from "./Calendario"
import { primeiroDia, ultimoDia } from "./calendario-core"
import { resumirDia, resumirMes, type ResumoDia } from "./aderencia-core"

export function CalendarioPage() {
  const persistencia = usePersistencia()
  const navigate = useNavigate()
  const hoje = formatarISODate(new Date())

  const obterDadosDoMes = useCallback(
    async (ano: number, mes: number): Promise<DadosDoMes> => {
      const [registros, planos] = await Promise.all([
        persistencia.registros.listarPorPeriodo(
          ID_USUARIO_LOCAL,
          primeiroDia(ano, mes),
          ultimoDia(ano, mes),
        ),
        persistencia.planos.listarPorUsuario(ID_USUARIO_LOCAL),
      ])

      const porId = new Map<PlanoId, Plano>(planos.map((p) => [p.id, p]))
      const planoDoRegistro = (r: { plano_id: PlanoId }) => porId.get(r.plano_id) ?? null

      const dias = new Map<ISODate, ResumoDia>(
        registros.map((r) => [r.data, resumirDia(r.data, r, planoDoRegistro(r))]),
      )

      return { dias, resumo: resumirMes(registros, planoDoRegistro, ano, mes, hoje) }
    },
    [persistencia, hoje],
  )

  const abrirDia = useCallback(
    (data: ISODate) => {
      // Hoje é o caso particular: uma só URL canônica, pelo caminho rápido.
      navigate(data === hoje ? "/hoje" : `/dia/${data}`)
    },
    [navigate, hoje],
  )

  return (
    <section className="calendario-pagina">
      <h1 className="calendario-pagina__titulo">Calendário</h1>
      <p className="calendario-pagina__subtitulo">
        Escolha um dia para ver ou registrar sua aderência.
      </p>

      <Calendario
        hoje={hoje}
        obterDadosDoMes={obterDadosDoMes}
        onAbrirDia={abrirDia}
      />
    </section>
  )
}
