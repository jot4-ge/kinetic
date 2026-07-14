// Tela "hoje" — reflete o Plano Ativo para o dia corrente e registra a Aderência.
// O Plano é imutável (ADR-0003): esta tela só lê o Plano e escreve no
// RegistroDeAderencia do dia (upsert). A lógica de domínio vive em hoje-core.ts;
// aqui só há carga, apresentação (tokens do brand.md) e persistência.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import { resolverPerfilDia } from "@/motor-geracao"
import { formatarISODate, diaDaSemanaDe } from "@/utils/data"
import { ID_USUARIO_LOCAL } from "@/features/onboarding/onboarding-core"
import type {
  PlanoAtivo, PerfilDeRefeicao, SessaoTreino, Exercicio, ExercicioId,
  RegistroDeAderencia, RegistroId, DiaDaSemana,
} from "@/types"
import {
  resolverRegistroDoDia,
  statusDaRefeicao,
  alternarStatusRefeicao,
  incrementarAgua,
  definirTreino,
  definirJJ,
  definirChecklistItem,
  carimbarEdicao,
  formatarRepeticao,
} from "./hoje-core"

const DIA_LABEL: Record<DiaDaSemana, string> = {
  Segunda: "Segunda-feira",
  Terca: "Terça-feira",
  Quarta: "Quarta-feira",
  Quinta: "Quinta-feira",
  Sexta: "Sexta-feira",
  Sabado: "Sábado",
  Domingo: "Domingo",
}

const INCREMENTO_AGUA_ML = 250

// ─── Estilos base (tokens do brand.md) ───────────────────────────────────────

const estiloCard: CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-hairline)",
  borderRadius: "var(--radius-lg)",
  padding: "var(--space-5)",
  marginBottom: "var(--space-4)",
}

const estiloTituloSecao: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "16px",
  fontWeight: 500,
  color: "var(--text)",
  marginBottom: "var(--space-4)",
  letterSpacing: "0.02em",
}

const estiloMono: CSSProperties = {
  fontFamily: "var(--font-data)",
  fontVariantNumeric: "tabular-nums",
}

function Card({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section style={estiloCard}>
      <h2 style={estiloTituloSecao}>{titulo}</h2>
      {children}
    </section>
  )
}

// ─── Caixa de macro (padrão "componente de exemplo" do brand-book) ────────────

function MacroBox({ valor_g, rotulo }: { valor_g: number; rotulo: string }) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: "center",
        background: "var(--bg)",
        borderRadius: "var(--radius-sm)",
        padding: "var(--space-2) var(--space-1)",
      }}
    >
      <div style={{ ...estiloMono, fontSize: "15px", color: "var(--text)" }}>{valor_g}g</div>
      <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
        {rotulo}
      </div>
    </div>
  )
}

// ─── Botão de status de refeição (Seguiu / Não seguiu) ───────────────────────

function BotaoStatus({
  ativo,
  variante,
  onClick,
  children,
}: {
  ativo: boolean
  variante: "seguiu" | "naoSeguiu"
  onClick: () => void
  children: ReactNode
}) {
  const fundoAtivo = variante === "seguiu" ? "var(--accent)" : "var(--text-muted)"
  const corAtiva = variante === "seguiu" ? "var(--on-accent)" : "var(--bg-elevated)"
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      style={{
        flex: 1,
        minHeight: "var(--touch-target-min)",
        padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-hairline)",
        background: ativo ? fundoAtivo : "transparent",
        color: ativo ? corAtiva : "var(--text)",
        fontFamily: "var(--font-body)",
        fontWeight: ativo ? "var(--font-weight-emphasis)" : "var(--font-weight-regular)",
        fontSize: "14px",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  )
}

// ─── Checkbox rotulado (treino, JJ, checklist) ────────────────────────────────

function CheckboxLinha({
  id,
  rotulo,
  marcado,
  onChange,
}: {
  id: string
  rotulo: string
  marcado: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        minHeight: "var(--touch-target-min)",
        cursor: "pointer",
        color: "var(--text)",
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={marcado}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: "20px", height: "20px", accentColor: "var(--accent)", cursor: "pointer" }}
      />
      <span>{rotulo}</span>
    </label>
  )
}

// ─── Estado de carga ──────────────────────────────────────────────────────────

interface EstadoCarregado {
  plano: PlanoAtivo
  dia: DiaDaSemana
  perfil: PerfilDeRefeicao | undefined
  sessao: SessaoTreino | undefined
  exercicios: Map<string, Exercicio>
}

export function HojePage() {
  const persistencia = usePersistencia()

  const [carregando, setCarregando] = useState(true)
  const [semPlano, setSemPlano] = useState(false)
  const [estado, setEstado] = useState<EstadoCarregado | null>(null)
  const [registro, setRegistro] = useState<RegistroDeAderencia | null>(null)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)

  // Refs evitam closures obsoletas em cliques sucessivos rápidos e garantem que
  // carimbarEdicao (ADR-0008) leia o estado de persistência mais recente.
  const registroRef = useRef<RegistroDeAderencia | null>(null)
  const jaPersistidoRef = useRef(false)

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

      const listaExercicios = await persistencia.exercicios.listarTodos()
      const hoje = new Date()
      const dataISO = formatarISODate(hoje)
      const dia = diaDaSemanaDe(hoje)
      const existente = await persistencia.registros.buscarPorData(ID_USUARIO_LOCAL, dataISO)
      if (!ativo) return

      const exercicios = new Map<string, Exercicio>(
        listaExercicios.map((e) => [e.id as string, e]),
      )
      const reg = resolverRegistroDoDia(existente, {
        id: crypto.randomUUID() as string as RegistroId,
        usuario_id: ID_USUARIO_LOCAL,
        plano_id: plano.id,
        data: dataISO,
        checklist_template: plano.checklist_template,
      })

      registroRef.current = reg
      jaPersistidoRef.current = existente !== null

      setEstado({
        plano,
        dia,
        perfil: resolverPerfilDia(plano.perfis_refeicao, dia),
        sessao: plano.sessoes_treino.find((s) => s.dia_da_semana === dia),
        exercicios,
      })
      setRegistro(reg)
      setCarregando(false)
    }
    void carregar()
    return () => {
      ativo = false
    }
  }, [persistencia])

  async function aplicar(reducer: (r: RegistroDeAderencia) => RegistroDeAderencia) {
    const atual = registroRef.current
    if (!atual) return
    const novo = carimbarEdicao(reducer(atual), jaPersistidoRef.current, () => new Date())
    registroRef.current = novo
    jaPersistidoRef.current = true
    setRegistro(novo)
    setErroSalvar(null)
    try {
      await persistencia.registros.salvar(novo)
    } catch (erro) {
      console.error("Falha ao salvar o registro:", erro)
      setErroSalvar("Não foi possível salvar. Tente de novo.")
    }
  }

  if (carregando) return null
  if (semPlano) return <Navigate to="/onboarding" replace />
  if (!estado || !registro) return null

  const { plano, dia, perfil, sessao, exercicios } = estado
  const aguaConsumida = registro.agua_consumida_ml ?? 0
  const aguaPct = Math.min(100, Math.round((aguaConsumida / plano.meta_agua_diaria_ml) * 100))

  return (
    <div style={{ paddingTop: "var(--space-5)" }}>
      <p style={{ ...estiloMono, color: "var(--text-muted)", fontSize: "13px" }}>Hoje</p>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "24px",
          fontWeight: 500,
          color: "var(--text)",
          margin: "var(--space-1) 0 var(--space-5)",
        }}
      >
        {DIA_LABEL[dia]}
      </h1>

      {erroSalvar && (
        <p style={{ color: "var(--feedback-erro)", fontSize: "13px", marginBottom: "var(--space-4)" }}>
          {erroSalvar}
        </p>
      )}

      {/* ─── Refeições ─── */}
      <Card titulo="Refeições">
        {!perfil || perfil.refeicoes.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Sem refeições definidas para hoje.</p>
        ) : (
          perfil.refeicoes.map((refeicao) => {
            const opcao = refeicao.opcoes[0]
            const status = statusDaRefeicao(registro, refeicao.id)
            return (
              <div
                key={refeicao.id}
                style={{
                  paddingBottom: "var(--space-4)",
                  marginBottom: "var(--space-4)",
                  borderBottom: "1px solid var(--border-hairline)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: "var(--font-weight-emphasis)", color: "var(--text)" }}>
                    {refeicao.nome}
                  </span>
                  <span style={{ ...estiloMono, fontSize: "13px", color: "var(--text-muted)" }}>
                    {refeicao.horario}
                  </span>
                </div>

                {opcao && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "var(--space-2)" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-muted)", paddingRight: "var(--space-3)" }}>
                        {opcao.descricao}
                      </span>
                      <span style={{ ...estiloMono, fontSize: "14px", fontWeight: 500, color: "var(--accent-text)", whiteSpace: "nowrap" }}>
                        {opcao.macros.kcal} kcal
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
                      <MacroBox valor_g={opcao.macros.proteina_g} rotulo="PROT" />
                      <MacroBox valor_g={opcao.macros.carboidrato_g} rotulo="CARB" />
                      <MacroBox valor_g={opcao.macros.gordura_g} rotulo="GORD" />
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
                      <BotaoStatus
                        ativo={status === "Seguiu"}
                        variante="seguiu"
                        onClick={() => aplicar((r) => alternarStatusRefeicao(r, refeicao.id, "Seguiu", opcao.id))}
                      >
                        Seguiu
                      </BotaoStatus>
                      <BotaoStatus
                        ativo={status === "NaoSeguiu"}
                        variante="naoSeguiu"
                        onClick={() => aplicar((r) => alternarStatusRefeicao(r, refeicao.id, "NaoSeguiu", opcao.id))}
                      >
                        Não seguiu
                      </BotaoStatus>
                    </div>
                  </>
                )}
              </div>
            )
          })
        )}
      </Card>

      {/* ─── Treino / JJ ─── */}
      <Card titulo="Atividade">
        {sessao ? (
          <>
            <ul style={{ listStyle: "none", marginBottom: "var(--space-4)" }}>
              {sessao.slots.map((slot) => {
                const primeira = slot.opcoes[0]
                const ex = primeira && exercicios.get(primeira.exercicio_id as ExercicioId as string)
                const alternativas = slot.opcoes
                  .slice(1)
                  .map((o) => exercicios.get(o.exercicio_id as string)?.nome)
                  .filter(Boolean)
                if (!ex) return null
                return (
                  <li
                    key={slot.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--border-hairline)",
                    }}
                  >
                    <span style={{ color: "var(--text)" }}>
                      {ex.nome}
                      {alternativas.length > 0 && (
                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                          {" "}
                          ou {alternativas.join(", ")}
                        </span>
                      )}
                    </span>
                    <span style={{ ...estiloMono, fontSize: "13px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {ex.series}×{formatarRepeticao(ex.repeticao)}
                    </span>
                  </li>
                )
              })}
            </ul>
            <CheckboxLinha
              id="treino"
              rotulo="Treino concluído"
              marcado={registro.treino_realizado === true}
              onChange={(v) => aplicar((r) => definirTreino(r, v))}
            />
          </>
        ) : (
          <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-2)" }}>
            Sem treino de musculação hoje.
          </p>
        )}
        {/* JJ é hardcoded por enquanto; o toggle não é ciente do dia (aparece
            sempre, mesmo em dias sem JJ). Candidato a virar "atividade extra"
            configurável pelo usuário no futuro — não modelar essa generalização
            ainda, forma não definida. */}
        <CheckboxLinha
          id="jj"
          rotulo="Jiu-jitsu concluído"
          marcado={registro.jj_realizado === true}
          onChange={(v) => aplicar((r) => definirJJ(r, v))}
        />
      </Card>

      {/* ─── Água ─── */}
      <Card titulo="Hidratação">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-2)" }}>
          <span style={{ ...estiloMono, fontSize: "18px", fontWeight: 500, color: "var(--accent-text)" }}>
            {aguaConsumida} ml
          </span>
          <span style={{ ...estiloMono, fontSize: "13px", color: "var(--text-muted)" }}>
            meta {plano.meta_agua_diaria_ml} ml
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={aguaConsumida}
          aria-valuemin={0}
          aria-valuemax={plano.meta_agua_diaria_ml}
          style={{ height: "6px", background: "var(--bg)", borderRadius: "999px", overflow: "hidden" }}
        >
          <div style={{ width: `${aguaPct}%`, height: "100%", background: "var(--accent)" }} />
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
          <button
            type="button"
            onClick={() => aplicar((r) => incrementarAgua(r, -INCREMENTO_AGUA_ML))}
            style={botaoAguaEstilo}
          >
            −{INCREMENTO_AGUA_ML}
          </button>
          <button
            type="button"
            onClick={() => aplicar((r) => incrementarAgua(r, INCREMENTO_AGUA_ML))}
            style={{ ...botaoAguaEstilo, borderColor: "var(--accent)", color: "var(--accent-text)" }}
          >
            +{INCREMENTO_AGUA_ML} ml
          </button>
        </div>
      </Card>

      {/* ─── Checklist ─── */}
      <Card titulo="Checklist">
        {plano.checklist_template.map((item) => (
          <CheckboxLinha
            key={item.id}
            id={`chk-${item.id}`}
            rotulo={item.descricao}
            marcado={registro.checklist[item.id] === true}
            onChange={(v) => aplicar((r) => definirChecklistItem(r, item.id, v))}
          />
        ))}
      </Card>
    </div>
  )
}

const botaoAguaEstilo: CSSProperties = {
  flex: 1,
  minHeight: "var(--touch-target-min)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-hairline)",
  background: "transparent",
  color: "var(--text)",
  fontFamily: "var(--font-data)",
  fontSize: "14px",
  cursor: "pointer",
}
