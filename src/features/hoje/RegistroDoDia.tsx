// Editor de Registro de Aderência de UM dia — o mesmo para "hoje" e para
// qualquer dia passado (ADR-0015). Recebe a data, o Plano vigente naquela data e
// o Registro já existente (ou null); resolve o restante e escreve o upsert.
//
// Toda "today-ness" some daqui: a data vem por prop, o dia da semana e o rótulo
// derivam dela, e `retroativo` (data != hoje) decide o carimbo de editado_em
// (ADR-0008/0015). A resolução de QUAL Plano/Registro usar é responsabilidade de
// quem renderiza (HojePage / DiaPage). A lógica de domínio vive em hoje-core.ts.
//
// Apresentação em src/styles/tela-hoje.css: cabeçalho + "jornada do dia"
// (progresso), coluna principal de refeições e aside de água/treino/checklist
// (brand.md). Puramente visual — nenhuma regra de negócio mora aqui.

import { useEffect, useRef, useState, type ReactNode } from "react"
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
  saudacaoDoDia,
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

// ─── Ícones (traço fino, herdam currentColor) ────────────────────────────────

function IconeCalendario() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  )
}

function IconeGota() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z" />
    </svg>
  )
}

function IconeHalter() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 8v8M4 10v4M17.5 8v8M20 10v4M6.5 12h11" />
    </svg>
  )
}

function IconeLista() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6h11M9 12h11M9 18h11M4 6l1.4 1.4L7 5.4" />
    </svg>
  )
}

function IconeCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12l5 5L20 6" />
    </svg>
  )
}

// ─── Componentes de apresentação ─────────────────────────────────────────────

function CheckboxLinha({
  id, rotulo, marcado, onChange,
}: {
  id: string
  rotulo: string
  marcado: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label htmlFor={id} className="check-linha">
      <input
        id={id}
        type="checkbox"
        className="check-linha__input"
        checked={marcado}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{rotulo}</span>
    </label>
  )
}

function Cartao({ titulo, icone, children }: { titulo: string; icone: ReactNode; children: ReactNode }) {
  return (
    <section className="cartao">
      <h2 className="cartao__titulo">
        <span className="icone-ouro">{icone}</span>
        <span className="cartao__titulo-texto">{titulo}</span>
        <span className="cartao__titulo-filete" aria-hidden="true" />
      </h2>
      {children}
    </section>
  )
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export function RegistroDoDia({
  data,
  plano,
  registroExistente,
  nomeUsuario = null,
}: {
  data: ISODate
  plano: Plano
  registroExistente: RegistroDeAderencia | null
  // Só usado quando ehHoje (HojePage); DiaPage não precisa passar — dias
  // passados sempre mostram a data, nunca a saudação.
  nomeUsuario?: string | null
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

  // ─── Derivações de apresentação (leitura de dados existentes; sem escrita) ──

  // Hora local "HH:MM" só quando é hoje — para recuar visualmente refeições cujo
  // horário ainda não chegou. Comparação lexical basta (largura fixa).
  const agora = new Date()
  const horaAtual = ehHoje
    ? `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`
    : null
  const saudacao = ehHoje && nomeUsuario ? saudacaoDoDia(nomeUsuario, agora.getHours()) : null

  const refeicoes = perfil?.refeicoes ?? []
  const totalRefeicoes = refeicoes.length
  const seguidas = refeicoes.filter((r) => statusDaRefeicao(registro, r.id) === "Seguiu").length
  const kcalRegistradas = refeicoes.reduce(
    (s, r) => (statusDaRefeicao(registro, r.id) === "Seguiu" ? s + (r.opcoes[0]?.macros.kcal ?? 0) : s),
    0,
  )
  const pctRefeicoes = totalRefeicoes ? Math.round((seguidas / totalRefeicoes) * 100) : 0

  const aguaConsumida = registro.agua_consumida_ml ?? 0
  const aguaPct = Math.min(100, Math.round((aguaConsumida / plano.meta_agua_diaria_ml) * 100))

  return (
    <div className="hoje">
      <header className="hoje__cabecalho">
        <div className="hoje__titulo-bloco">
          <p className="hoje__data">{saudacao ?? (ehHoje ? "Hoje" : formatarDataCurta(data))}</p>
          <div className="hoje__titulo-linha">
            <h1 className="hoje__titulo">{DIA_LABEL[dia]}</h1>
            <span className="hoje__titulo-filete" aria-hidden="true" />
          </div>
        </div>
        <BotaoIcone rotulo="Abrir calendário — escolher outro dia" onClick={() => navigate("/calendario")}>
          <IconeCalendario />
        </BotaoIcone>
      </header>

      {erroSalvar && <p className="hoje__erro">{erroSalvar}</p>}

      {/* ─── Jornada do dia: progresso de refeições + kcal ─── */}
      {totalRefeicoes > 0 && (
        <div className="hoje__jornada">
          <div className="hoje__jornada-texto">
            <span className="hoje__jornada-metrica">
              <b>{seguidas}/{totalRefeicoes}</b> refeições seguidas
            </span>
            <span className="hoje__jornada-metrica">
              <b>{kcalRegistradas}</b> / {plano.meta_calorica_diaria} kcal
            </span>
          </div>
          <div
            className="barra"
            role="progressbar"
            aria-label="Refeições seguidas"
            aria-valuenow={seguidas}
            aria-valuemin={0}
            aria-valuemax={totalRefeicoes}
          >
            <div className="barra__preenchimento" style={{ width: `${pctRefeicoes}%` }} />
          </div>
        </div>
      )}

      <div className="hoje__grid">
        {/* ─── Coluna principal: Refeições ─── */}
        <main className="hoje__principal">
          <h2 className="hoje__secao-titulo">
            <span>Refeições</span>
            <span className="hoje__secao-titulo-filete" aria-hidden="true" />
          </h2>
          {totalRefeicoes === 0 ? (
            <p className="cartao__vazio">Sem refeições definidas para este dia.</p>
          ) : (
            refeicoes.map((refeicao) => {
              const opcao = refeicao.opcoes[0]
              const status = statusDaRefeicao(registro, refeicao.id)
              const cumprida = status === "Seguiu"
              const futura = horaAtual !== null && refeicao.horario > horaAtual
              const classe = [
                "refeicao",
                cumprida && "refeicao--cumprida",
                futura && "refeicao--futura",
              ].filter(Boolean).join(" ")

              return (
                <article key={refeicao.id} className={classe}>
                  <div className="refeicao__topo">
                    <span className="refeicao__nome">
                      {refeicao.nome}
                      {cumprida && <span className="refeicao__check"><IconeCheck /></span>}
                    </span>
                    <span className="refeicao__horario">{refeicao.horario}</span>
                  </div>

                  {opcao && (
                    <>
                      <div className="refeicao__desc-linha">
                        <span className="refeicao__desc">{opcao.descricao}</span>
                        <span className="refeicao__kcal">{opcao.macros.kcal} kcal</span>
                      </div>
                      <div className="refeicao__macros">
                        <span>
                          <span className="refeicao__macro-num">{opcao.macros.proteina_g}</span>P
                        </span>
                        <span>
                          <span className="refeicao__macro-num">{opcao.macros.carboidrato_g}</span>C
                        </span>
                        <span>
                          <span className="refeicao__macro-num">{opcao.macros.gordura_g}</span>G
                        </span>
                      </div>
                      <div className="refeicao__acoes">
                        <button
                          type="button"
                          className={`btn-status btn-status--seguiu${cumprida ? " is-ativo" : ""}`}
                          aria-pressed={cumprida}
                          onClick={() => aplicar((r) => alternarStatusRefeicao(r, refeicao.id, "Seguiu", opcao.id))}
                        >
                          Seguiu
                        </button>
                        <button
                          type="button"
                          className={`btn-status btn-status--nao${status === "NaoSeguiu" ? " is-ativo" : ""}`}
                          aria-pressed={status === "NaoSeguiu"}
                          onClick={() => aplicar((r) => alternarStatusRefeicao(r, refeicao.id, "NaoSeguiu", opcao.id))}
                        >
                          Não seguiu
                        </button>
                      </div>
                    </>
                  )}
                </article>
              )
            })
          )}
        </main>

        {/* ─── Aside: água, atividade, checklist ─── */}
        <aside className="hoje__aside">
          {/* Água */}
          <Cartao titulo="Hidratação" icone={<IconeGota />}>
            <div className="agua__topo">
              <span className="agua__valor">{aguaConsumida} ml</span>
              <span className="agua__meta">meta {plano.meta_agua_diaria_ml} ml</span>
            </div>
            <div
              className="barra"
              role="progressbar"
              aria-valuenow={aguaConsumida}
              aria-valuemin={0}
              aria-valuemax={plano.meta_agua_diaria_ml}
            >
              <div className="barra__preenchimento" style={{ width: `${aguaPct}%` }} />
            </div>
            <div className="agua__botoes">
              <button
                type="button"
                className="btn-agua"
                onClick={() => aplicar((r) => incrementarAgua(r, -INCREMENTO_AGUA_ML))}
              >
                −{INCREMENTO_AGUA_ML}
              </button>
              <button
                type="button"
                className="btn-agua btn-agua--mais"
                onClick={() => aplicar((r) => incrementarAgua(r, INCREMENTO_AGUA_ML))}
              >
                +{INCREMENTO_AGUA_ML} ml
              </button>
            </div>
          </Cartao>

          {/* Atividade */}
          <Cartao titulo="Atividade" icone={<IconeHalter />}>
            {sessao ? (
              <>
                <ul className="treino__lista">
                  {sessao.slots.map((slot) => {
                    const primeira = slot.opcoes[0]
                    const ex = primeira && exercicios.get(primeira.exercicio_id as ExercicioId as string)
                    const alternativas = slot.opcoes
                      .slice(1)
                      .map((o) => exercicios.get(o.exercicio_id as string)?.nome)
                      .filter(Boolean)
                    if (!ex) return null
                    return (
                      <li key={slot.id} className="treino__item">
                        <span className="treino__ex">
                          {ex.nome}
                          {alternativas.length > 0 && (
                            <span className="treino__alt"> ou {alternativas.join(", ")}</span>
                          )}
                        </span>
                        <span className="treino__prescricao">
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
              <p className="cartao__vazio" style={{ marginBottom: "var(--space-2)" }}>
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
          </Cartao>

          {/* Checklist */}
          <Cartao titulo="Checklist" icone={<IconeLista />}>
            {plano.checklist_template.map((item) => (
              <CheckboxLinha
                key={item.id}
                id={`chk-${item.id}`}
                rotulo={item.descricao}
                marcado={registro.checklist[item.id] === true}
                onChange={(v) => aplicar((r) => definirChecklistItem(r, item.id, v))}
              />
            ))}
          </Cartao>
        </aside>
      </div>
    </div>
  )
}
