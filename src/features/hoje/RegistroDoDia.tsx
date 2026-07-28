// Editor de Registro de Aderência de UM dia — o mesmo para "hoje" e para
// qualquer dia passado (ADR-0015). Recebe a data, o Plano vigente naquela data e
// o Registro já existente (ou null); resolve o restante e escreve o upsert.
//
// Toda "today-ness" some daqui: a data vem por prop, o dia da semana e o rótulo
// derivam dela, e `retroativo` (data != hoje) decide o carimbo de editado_em
// (ADR-0008/0015). A resolução de QUAL Plano/Registro usar é responsabilidade de
// quem renderiza (HojePage / DiaPage). A lógica de domínio vive em hoje-core.ts.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import { BotaoIcone } from "@/components/BotaoIcone"
import { resolverPerfilDia } from "@/motor-geracao"
import { formatarISODate, diaDaSemanaDeISO } from "@/utils/data"
import { formatarDataCurta } from "@/features/historico/historico-core"
import type {
  Plano, PerfilDeRefeicao, SessaoTreino, Exercicio, ExercicioId,
  RegistroDeAderencia, RegistroId, ISODate, DiaDaSemana,
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

function IconeCalendario() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
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

// ─── Editor ───────────────────────────────────────────────────────────────────

export function RegistroDoDia({
  data,
  plano,
  registroExistente,
}: {
  data: ISODate
  plano: Plano
  registroExistente: RegistroDeAderencia | null
}) {
  const persistencia = usePersistencia()
  const navigate = useNavigate()

  const dia = diaDaSemanaDeISO(data)
  const ehHoje = data === formatarISODate(new Date())
  const perfil: PerfilDeRefeicao | undefined = resolverPerfilDia(plano.perfis_refeicao, dia)
  const sessao: SessaoTreino | undefined = plano.sessoes_treino.find((s) => s.dia_da_semana === dia)

  const [exercicios, setExercicios] = useState<Map<string, Exercicio> | null>(null)
  const [registro, setRegistro] = useState<RegistroDeAderencia>(() =>
    resolverRegistroDoDia(registroExistente, {
      id: crypto.randomUUID() as string as RegistroId,
      usuario_id: plano.usuario_id,
      plano_id: plano.id,
      data,
      checklist_template: plano.checklist_template,
    }),
  )
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)

  // Refs evitam closures obsoletas em cliques rápidos e garantem que
  // carimbarEdicao (ADR-0008) leia o estado de persistência mais recente.
  const registroRef = useRef<RegistroDeAderencia>(registro)
  const jaPersistidoRef = useRef(registroExistente !== null)

  useEffect(() => {
    let ativo = true
    persistencia.exercicios.listarTodos().then((lista) => {
      if (!ativo) return
      setExercicios(new Map(lista.map((e) => [e.id as string, e])))
    })
    return () => {
      ativo = false
    }
  }, [persistencia])

  async function aplicar(reducer: (r: RegistroDeAderencia) => RegistroDeAderencia) {
    const atual = registroRef.current
    // retroativo = escrever num dia que não é hoje: carimba editado_em já na
    // primeira gravação (ADR-0015).
    const novo = carimbarEdicao(reducer(atual), jaPersistidoRef.current, !ehHoje, () => new Date())
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

  if (exercicios === null) return null

  const aguaConsumida = registro.agua_consumida_ml ?? 0
  const aguaPct = Math.min(100, Math.round((aguaConsumida / plano.meta_agua_diaria_ml) * 100))

  return (
    <div style={{ paddingTop: "var(--space-5)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <div>
          <p style={{ ...estiloMono, color: "var(--text-muted)", fontSize: "13px" }}>
            {ehHoje ? "Hoje" : formatarDataCurta(data)}
          </p>
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
        </div>
        <BotaoIcone rotulo="Abrir calendário — escolher outro dia" onClick={() => navigate("/calendario")}>
          <IconeCalendario />
        </BotaoIcone>
      </div>

      {erroSalvar && (
        <p style={{ color: "var(--feedback-erro)", fontSize: "13px", marginBottom: "var(--space-4)" }}>
          {erroSalvar}
        </p>
      )}

      {/* ─── Refeições ─── */}
      <Card titulo="Refeições">
        {!perfil || perfil.refeicoes.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Sem refeições definidas para este dia.</p>
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
            Sem treino de musculação neste dia.
          </p>
        )}
        {/* JJ hardcoded por enquanto; o toggle não é ciente do dia (aparece
            sempre, mesmo em dias sem JJ). Igual ao comportamento da tela hoje. */}
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
