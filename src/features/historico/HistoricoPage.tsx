// Histórico — lista de Planos (ativo + arquivados), do mais recente ao mais
// antigo. O Plano Ativo é destacado em ouro (aqui é apropriado: é o "atual").
// Selecionar um Plano leva a /historico/:planoId (seus Registros de Aderência).
//
// O Plano é imutável e o histórico só lê (ADR-0002/0003): esta tela não escreve
// nada. A lógica de ordenar/formatar vive em historico-core.ts; aqui só há carga,
// apresentação (tokens do brand.md) e navegação.

import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import { ID_USUARIO_LOCAL } from "@/features/onboarding/onboarding-core"
import type { Plano, ObjetivoDePlano } from "@/types"
import { ordenarPlanosRecentesPrimeiro, formatarVigencia } from "./historico-core"

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

const estiloTitulo: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "26px",
  fontWeight: 500,
  color: "var(--text)",
  marginBottom: "var(--space-2)",
}

// Métrica compacta (número mono em cima, rótulo pequeno embaixo). Segue o
// princípio do brand §8: o número é o protagonista.
function Metrica({ valor, unidade, rotulo, ouro }: {
  valor: number
  unidade: string
  rotulo: string
  ouro?: boolean
}) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ ...estiloMono, fontSize: "15px", color: ouro ? "var(--accent-text)" : "var(--text)" }}>
        {valor}
        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}> {unidade}</span>
      </div>
      <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{rotulo}</div>
    </div>
  )
}

function CardPlano({ plano, onClick }: { plano: Plano; onClick: () => void }) {
  const vigencia = formatarVigencia(plano)
  const ativo = vigencia.ativo

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "var(--bg-elevated)",
        border: ativo ? "1px solid var(--accent)" : "1px solid var(--border-hairline)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
        marginBottom: "var(--space-4)",
        cursor: "pointer",
        color: "var(--text)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Vigência + selo de ativo */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-3)" }}>
        <span style={{ ...estiloMono, fontSize: "13px", color: "var(--text-muted)" }}>
          {vigencia.inicio} <span aria-hidden="true">→</span>{" "}
          <span style={ativo ? { color: "var(--accent-text)" } : undefined}>{vigencia.fim}</span>
        </span>
        {ativo && (
          <span
            style={{
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--on-accent)",
              background: "var(--accent)",
              borderRadius: "999px",
              padding: "2px var(--space-2)",
              whiteSpace: "nowrap",
            }}
          >
            Ativo
          </span>
        )}
      </div>

      {/* Objetivo */}
      <h2 style={{ fontSize: "18px", fontWeight: "var(--font-weight-emphasis)", color: "var(--text)", margin: "var(--space-3) 0 var(--space-4)" }}>
        {OBJETIVO_LABEL[plano.objetivo]}
      </h2>

      {/* Metas nutricionais */}
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <Metrica valor={plano.meta_calorica_diaria} unidade="kcal" rotulo="META" ouro={ativo} />
        <Metrica valor={plano.meta_proteina_diaria_g} unidade="g" rotulo="PROT" />
        <Metrica valor={plano.meta_carboidrato_diaria_g} unidade="g" rotulo="CARB" />
        <Metrica valor={plano.meta_gordura_diaria_g} unidade="g" rotulo="GORD" />
        <Metrica valor={plano.meta_agua_diaria_ml} unidade="ml" rotulo="ÁGUA" />
      </div>
    </button>
  )
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <section style={{ paddingTop: "var(--space-5)" }}>
      <h1 style={estiloTitulo}>Histórico</h1>
      {children}
    </section>
  )
}

export function HistoricoPage() {
  const persistencia = usePersistencia()
  const navigate = useNavigate()

  const [carregando, setCarregando] = useState(true)
  const [planos, setPlanos] = useState<Plano[]>([])

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const lista = await persistencia.planos.listarPorUsuario(ID_USUARIO_LOCAL)
      if (!ativo) return
      setPlanos(ordenarPlanosRecentesPrimeiro(lista))
      setCarregando(false)
    }
    void carregar()
    return () => {
      ativo = false
    }
  }, [persistencia])

  if (carregando) return null

  // Sem nenhum Plano: quem chega aqui deveria ter ao menos o Ativo, mas tratamos
  // o caso com clareza em vez de renderizar uma lista vazia sem explicação.
  if (planos.length === 0) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <Layout>
      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "var(--space-5)" }}>
        Seus Planos, do mais recente ao mais antigo. Selecione um para ver os
        registros daquele período.
      </p>
      {planos.map((plano) => (
        <CardPlano key={plano.id} plano={plano} onClick={() => navigate(`/historico/${plano.id}`)} />
      ))}
    </Layout>
  )
}
