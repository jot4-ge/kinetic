// Histórico — Registros de Aderência de um Plano. Ao selecionar um Plano na lista
// (/historico), esta rota (/historico/:planoId) mostra os Registros vinculados a
// ele (listarPorPlano), em ordem cronológica, com um resumo cru por dia. Um
// Registro feito num Plano antigo aparece sob ELE, não sob o Plano novo — o
// vínculo é pelo plano_id imutável do Registro (ADR-0002/0003).
//
// Sem gráficos nem agregação nesta fase: só listagem. Lógica de ordenar/resumir
// vive em historico-core.ts; aqui só há carga, apresentação e o estado vazio.

import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import { Navigate, useParams } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import type { Plano, RegistroDeAderencia, PlanoId, ObjetivoDePlano } from "@/types"
import {
  ordenarRegistrosCronologico,
  nomesRefeicoesDoPlano,
  resumirRegistro,
  formatarVigencia,
  type ResumoRegistro,
} from "./historico-core"

const OBJETIVO_LABEL: Record<ObjetivoDePlano, string> = {
  Cutting: "Cutting",
  Manutencao: "Manutenção",
  Bulk: "Bulk",
  Recomposicao: "Recomposição",
}

const estiloMono: CSSProperties = {
  fontFamily: "var(--font-data)",
  fontVariantNumeric: "tabular-nums",
}

// Uma linha de atributo do dia: rótulo curto + valor. Feito/não feito sem cor
// semântica vibrante — o brand reserva ouro a métricas-chave e evita verde/
// vermelho puros. "sim/não" carrega o estado; o mono carrega os números.
function Atributo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-3)", padding: "var(--space-1) 0" }}>
      <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{rotulo}</span>
      <span style={{ fontSize: "13px", color: "var(--text)", textAlign: "right" }}>{children}</span>
    </div>
  )
}

function CardRegistro({ resumo, metaAguaMl }: { resumo: ResumoRegistro; metaAguaMl: number }) {
  const seguidas = resumo.refeicoesSeguidas
  return (
    <article
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
        marginBottom: "var(--space-4)",
      }}
    >
      <div style={{ ...estiloMono, fontSize: "15px", fontWeight: 500, color: "var(--text)", marginBottom: "var(--space-3)" }}>
        {resumo.data}
      </div>

      <Atributo rotulo="Refeições seguidas">
        {seguidas.length === 0 ? (
          <span style={{ color: "var(--text-muted)" }}>nenhuma</span>
        ) : (
          seguidas.join(", ")
        )}
      </Atributo>
      <Atributo rotulo="Treino">{resumo.treinoRealizado ? "sim" : "não"}</Atributo>
      <Atributo rotulo="Jiu-jitsu">{resumo.jjRealizado ? "sim" : "não"}</Atributo>
      <Atributo rotulo="Água">
        <span style={estiloMono}>{resumo.aguaConsumidaMl}</span>
        <span style={{ color: "var(--text-muted)" }}> / {metaAguaMl} ml</span>
      </Atributo>
    </article>
  )
}

function Layout({ subtitulo, children }: { subtitulo?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ paddingTop: "var(--space-5)" }}>
      <p style={{ ...estiloMono, color: "var(--text-muted)", fontSize: "13px" }}>Histórico</p>
      {subtitulo}
      {children}
    </section>
  )
}

interface EstadoCarregado {
  plano: Plano
  registros: ResumoRegistro[]
}

export function PlanoRegistrosPage() {
  const persistencia = usePersistencia()
  const { planoId } = useParams<{ planoId: string }>()

  const [carregando, setCarregando] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [estado, setEstado] = useState<EstadoCarregado | null>(null)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      if (!planoId) {
        setNaoEncontrado(true)
        setCarregando(false)
        return
      }
      const plano = await persistencia.planos.buscar(planoId as PlanoId)
      if (!ativo) return
      if (!plano) {
        setNaoEncontrado(true)
        setCarregando(false)
        return
      }
      const registros: RegistroDeAderencia[] = await persistencia.registros.listarPorPlano(plano.id)
      if (!ativo) return

      const nomes = nomesRefeicoesDoPlano(plano)
      setEstado({
        plano,
        registros: ordenarRegistrosCronologico(registros).map((r) => resumirRegistro(r, nomes)),
      })
      setCarregando(false)
    }
    void carregar()
    return () => {
      ativo = false
    }
  }, [persistencia, planoId])

  if (carregando) return null
  if (naoEncontrado || !estado) return <Navigate to="/historico" replace />

  const { plano, registros } = estado
  const vigencia = formatarVigencia(plano)

  const subtitulo = (
    <div style={{ marginBottom: "var(--space-5)" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 500, color: "var(--text)", margin: "var(--space-1) 0 var(--space-2)" }}>
        {OBJETIVO_LABEL[plano.objetivo]}
      </h1>
      <p style={{ ...estiloMono, fontSize: "13px", color: "var(--text-muted)" }}>
        {vigencia.inicio} <span aria-hidden="true">→</span>{" "}
        <span style={vigencia.ativo ? { color: "var(--accent-text)" } : undefined}>{vigencia.fim}</span>
      </p>
    </div>
  )

  return (
    <Layout subtitulo={subtitulo}>
      {registros.length === 0 ? (
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-hairline)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-6) var(--space-5)",
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--text)", marginBottom: "var(--space-2)" }}>Nenhum registro neste plano.</p>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            {vigencia.ativo
              ? "Registre sua aderência na tela de hoje e ela aparece aqui."
              : "Este plano foi arquivado sem registros de aderência."}
          </p>
        </div>
      ) : (
        registros.map((resumo) => (
          <CardRegistro key={resumo.registroId} resumo={resumo} metaAguaMl={plano.meta_agua_diaria_ml} />
        ))
      )}
    </Layout>
  )
}
