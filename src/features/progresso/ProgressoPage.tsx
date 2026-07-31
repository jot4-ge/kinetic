// Progresso de peso — /progresso. Acessada a partir do Perfil.
//
// Três estados progressivos (progresso-peso-core.estadoProgresso), decisão de
// UX: zero pesos não mostra gráfico nem "−0.0 kg" de mentira; um peso mostra
// Atual/Base mas ainda sem curva; dois ou mais abre o gráfico completo.
//
// Gráfico em SVG próprio (sem biblioteca): a geometria (coordenadas, path da
// linha e da área) é lógica pura em progresso-peso-core.ts — aqui só desenha.
// Tooltip mínimo feito à mão, com alvo de toque de 44px (brand §9) separado
// do ponto visual (~3px): um <button> invisível maior por cima de cada ponto.
//
// A tela nunca recalcula o Plano (ADR-0003/0018): a sugestão de novo Plano só
// navega para o fluxo de gerar/arquivar que já existe (mesmo destino do botão
// "Gerar novo plano" do Perfil) — quem arquiva e gera é aquele fluxo.

import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import { EstadoVazio } from "@/components/EstadoVazio"
import { formatarISODate } from "@/utils/data"
import { formatarDataCurta } from "@/features/historico/historico-core"
import { ID_USUARIO_LOCAL } from "@/features/onboarding/onboarding-core"
import type { Usuario, RegistroDePeso, RegistroPesoId, ISODate, ISOTimestamp } from "@/types"
import {
  LIMIAR_DIVERGENCIA_PESO,
  variacaoDesdeBase,
  sugerirNovoPlano,
  serieParaGrafico,
  estadoProgresso,
  pontosSvg,
  linhaSvgPath,
  areaSvgPath,
  pesosRecentes,
  resolverRegistroPeso,
  carimbarEdicaoPeso,
  validarPesoInput,
} from "./progresso-peso-core"

// Anterior a qualquer uso real do app — abrange "todos os pesos" sem precisar
// de um listarTodos dedicado no PesoRepositorio (mesmo truque de range amplo
// já usado em src/persistencia/idb/adapter.ts para listarPorPlano).
const DATA_MINIMA = "2000-01-01" as ISODate

const GRAFICO_LARGURA = 600
const GRAFICO_ALTURA = 220

interface EstadoCarregado {
  usuario: Usuario | null
  pesoBase: number | null // peso do onboarding do Plano ativo — null se não há Plano ativo
  pesos: RegistroDePeso[]
  maisRecente: RegistroDePeso | null
}

// ─── Cabeçalho — frontão + meandro (mesmo vocabulário de historico.css) ────

function Cabecalho() {
  return (
    <>
      <h1 className="progresso__frontao">
        <span className="progresso__frontao-filete progresso__frontao-filete--esq" aria-hidden="true" />
        <span className="progresso__frontao-texto">Progresso de peso</span>
        <span className="progresso__frontao-filete" aria-hidden="true" />
      </h1>
      <span className="progresso__meandro" aria-hidden="true" />
    </>
  )
}

// ─── Três métricas ──────────────────────────────────────────────────────────

function Metrica({ valor, rotulo, destaque }: { valor: string; rotulo: string; destaque?: boolean }) {
  return (
    <div className="progresso__metrica">
      <span className={destaque ? "progresso__metrica-valor is-destaque" : "progresso__metrica-valor"}>
        {valor}
      </span>
      <span className="progresso__metrica-rotulo">{rotulo}</span>
    </div>
  )
}

function MetricasTopo({
  atualKg, pesoBase, mostrarVariacao,
}: {
  atualKg: number
  pesoBase: number | null
  mostrarVariacao: boolean
}) {
  const variacao = pesoBase !== null ? variacaoDesdeBase(atualKg, pesoBase) : null
  return (
    <div className="progresso__metricas">
      <Metrica valor={`${atualKg} kg`} rotulo="Atual" />
      {mostrarVariacao && variacao && (
        <Metrica
          valor={`${variacao.diferencaKg >= 0 ? "+" : ""}${variacao.diferencaKg.toFixed(1)} kg`}
          rotulo="Desde o início"
          destaque
        />
      )}
      {pesoBase !== null && <Metrica valor={`${pesoBase} kg`} rotulo="Base do plano" />}
    </div>
  )
}

// ─── Gráfico SVG ────────────────────────────────────────────────────────────

function GraficoPeso({ pesos }: { pesos: readonly RegistroDePeso[] }) {
  const [pontoAtivo, setPontoAtivo] = useState<number | null>(null)

  const serie = serieParaGrafico(pesos)
  if (!serie) return null // estadoProgresso já garante 2+ antes de renderizar este componente

  const pontos = pontosSvg(serie, { largura: GRAFICO_LARGURA, altura: GRAFICO_ALTURA })
  const linha = linhaSvgPath(pontos)
  const area = areaSvgPath(pontos, GRAFICO_ALTURA)
  const ultimo = pontos[pontos.length - 1]
  const ativo = pontoAtivo !== null ? pontos[pontoAtivo] : null

  return (
    <div className="progresso__grafico-card">
      <div
        className="progresso__grafico-wrap"
        onMouseLeave={() => setPontoAtivo(null)}
      >
        {/* Decorativo: a lista "Últimos" + a métrica "Atual" já cobrem os
            mesmos dados em texto (alternativa textual do brand §9). */}
        <svg
          className="progresso__grafico-svg"
          viewBox={`0 0 ${GRAFICO_LARGURA} ${GRAFICO_ALTURA}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="progresso-gradiente-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#progresso-gradiente-area)" stroke="none" />
          <path d={linha} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {pontos.map((p, i) => (
            <circle key={p.data} cx={p.x} cy={p.y} r={i === pontos.length - 1 ? 0 : 3} fill="var(--accent)" />
          ))}
          {/* Ponto atual destacado: anel + núcleo, mesma gramática de glow
              estático usada no marco "is-ativa" do histórico. */}
          <circle cx={ultimo.x} cy={ultimo.y} r={7} fill="var(--accent)" opacity="0.18" />
          <circle cx={ultimo.x} cy={ultimo.y} r={4} fill="var(--accent)" />
        </svg>

        {/* Eixo Y: só min/max (brand: "poucos rótulos"). */}
        <span className="progresso__eixo-y progresso__eixo-y--topo">{serie.maxKg} kg</span>
        <span className="progresso__eixo-y progresso__eixo-y--base">{serie.minKg} kg</span>

        {/* Alvos de toque: 44px mínimo (brand §9), maiores que o ponto visual
            (~3px). Hover no desktop, toque explícito (onClick) no mobile —
            onMouseEnter não é confiável em telas touch. */}
        {pontos.map((p, i) => (
          <button
            key={p.data}
            type="button"
            className="progresso__ponto-alvo"
            style={{ left: `${(p.x / GRAFICO_LARGURA) * 100}%`, top: `${(p.y / GRAFICO_ALTURA) * 100}%` }}
            tabIndex={-1}
            aria-hidden="true"
            onMouseEnter={() => setPontoAtivo(i)}
            onClick={(e) => {
              e.stopPropagation()
              setPontoAtivo(i)
            }}
          />
        ))}

        {ativo && (
          <div
            className="progresso__tooltip"
            style={{ left: `${(ativo.x / GRAFICO_LARGURA) * 100}%`, top: `${(ativo.y / GRAFICO_ALTURA) * 100}%` }}
          >
            <span className="progresso__tooltip-data">{formatarDataCurta(ativo.data)}</span>
            <span className="progresso__tooltip-peso">{ativo.peso_kg} kg</span>
          </div>
        )}
      </div>

      <div className="progresso__eixo-x">
        <span>{formatarDataCurta(pontos[0].data)}</span>
        <span>{formatarDataCurta(ultimo.data)}</span>
      </div>
    </div>
  )
}

// ─── Sugestão condicional de novo Plano ────────────────────────────────────

function SugestaoNovoPlano({ atualKg, pesoBase }: { atualKg: number; pesoBase: number }) {
  const navigate = useNavigate()
  const variacao = variacaoDesdeBase(atualKg, pesoBase)
  const pct = Math.abs(variacao.diferencaPct * 100).toFixed(1)
  const direcao = variacao.diferencaKg >= 0 ? "acima" : "abaixo"

  return (
    <div className="progresso__sugestao">
      <p className="progresso__sugestao-texto">
        Seu peso está {pct}% {direcao} da base do Plano atual. Pode ser hora de gerar um novo Plano.
      </p>
      <button type="button" className="progresso__sugestao-cta" onClick={() => navigate("/onboarding")}>
        Gerar plano
      </button>
    </div>
  )
}

// ─── Registrar peso de hoje ─────────────────────────────────────────────────

function RegistrarPeso({
  pesoHoje, convite, onSalvar,
}: {
  pesoHoje: RegistroDePeso | null
  convite?: string
  onSalvar: (registro: RegistroDePeso) => Promise<void>
}) {
  // Inicializado do pesoHoje resolvido no primeiro render de ProgressoPage
  // (que só monta este componente depois de carregar): não precisa de efeito
  // para sincronizar — depois de um salvar bem-sucedido, `valor` já é o que
  // acabou de ser gravado.
  const [valor, setValor] = useState(pesoHoje ? String(pesoHoje.peso_kg) : "")
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function aoSubmeter(e: FormEvent) {
    e.preventDefault()
    const resultado = validarPesoInput(valor)
    if ("erro" in resultado) {
      setErro(resultado.erro)
      return
    }
    setErro(null)
    setSalvando(true)
    try {
      const hoje = formatarISODate(new Date())
      const contexto = {
        id: crypto.randomUUID() as RegistroPesoId,
        usuario_id: pesoHoje?.usuario_id ?? ID_USUARIO_LOCAL,
        data: hoje,
        criado_em: new Date().toISOString() as ISOTimestamp,
      }
      const resolvido = resolverRegistroPeso(pesoHoje, resultado.valor, contexto)
      const novo = carimbarEdicaoPeso(resolvido, pesoHoje !== null, () => new Date())
      await onSalvar(novo)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form className="progresso__registrar" onSubmit={aoSubmeter}>
      <h2 className="progresso__registrar-titulo">Registrar peso</h2>
      {convite && <p className="progresso__registrar-convite">{convite}</p>}
      <div className="progresso__registrar-linha">
        <label htmlFor="peso-hoje" className="visualmente-oculto">Peso de hoje, em quilos</label>
        <input
          id="peso-hoje"
          type="text"
          inputMode="decimal"
          className="progresso__registrar-input"
          placeholder="Peso (kg)"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          aria-describedby={erro ? "peso-hoje-erro" : undefined}
        />
        <button type="submit" className="progresso__registrar-cta" disabled={salvando}>
          {pesoHoje ? "Atualizar" : "Salvar"}
        </button>
      </div>
      {erro && <p id="peso-hoje-erro" className="progresso__registrar-erro">{erro}</p>}
    </form>
  )
}

// ─── Últimos registros — editável, sem opção de apagar (ADR-0018) ─────────

function LinhaUltimo({ registro, onSalvar }: { registro: RegistroDePeso; onSalvar: (r: RegistroDePeso) => Promise<void> }) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(String(registro.peso_kg))
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    const resultado = validarPesoInput(valor)
    if ("erro" in resultado) {
      setErro(resultado.erro)
      return
    }
    setErro(null)
    const novo = carimbarEdicaoPeso({ ...registro, peso_kg: resultado.valor }, true, () => new Date())
    await onSalvar(novo)
    setEditando(false)
  }

  if (editando) {
    return (
      <li className="progresso__ultimo is-editando">
        <span className="progresso__ultimo-data">{formatarDataCurta(registro.data)}</span>
        <label htmlFor={`editar-${registro.id}`} className="visualmente-oculto">
          Corrigir peso de {formatarDataCurta(registro.data)}, em quilos
        </label>
        <input
          id={`editar-${registro.id}`}
          type="text"
          inputMode="decimal"
          className="progresso__ultimo-input"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          autoFocus
        />
        <button type="button" className="progresso__ultimo-acao" onClick={() => void salvar()}>
          Salvar
        </button>
        <button
          type="button"
          className="progresso__ultimo-acao progresso__ultimo-acao--secundaria"
          onClick={() => { setEditando(false); setValor(String(registro.peso_kg)); setErro(null) }}
        >
          Cancelar
        </button>
        {erro && <p className="progresso__registrar-erro">{erro}</p>}
      </li>
    )
  }

  return (
    <li className="progresso__ultimo">
      <span className="progresso__ultimo-data">{formatarDataCurta(registro.data)}</span>
      <span className="progresso__ultimo-peso">{registro.peso_kg} kg</span>
      <button type="button" className="progresso__ultimo-acao progresso__ultimo-acao--secundaria" onClick={() => setEditando(true)}>
        Editar
      </button>
    </li>
  )
}

// ─── Página ─────────────────────────────────────────────────────────────────

export function ProgressoPage() {
  const persistencia = usePersistencia()

  const [carregando, setCarregando] = useState(true)
  const [estado, setEstado] = useState<EstadoCarregado>({
    usuario: null, pesoBase: null, pesos: [], maisRecente: null,
  })

  async function carregar() {
    const hoje = formatarISODate(new Date())
    const [usuario, plano, pesos, maisRecente] = await Promise.all([
      persistencia.usuarios.buscar(ID_USUARIO_LOCAL),
      persistencia.planos.buscarAtivo(ID_USUARIO_LOCAL),
      persistencia.pesos.listarPorPeriodo(ID_USUARIO_LOCAL, DATA_MINIMA, hoje),
      persistencia.pesos.buscarMaisRecente(ID_USUARIO_LOCAL),
    ])
    setEstado({
      usuario,
      pesoBase: plano ? usuario?.peso_kg ?? null : null,
      pesos,
      maisRecente,
    })
  }

  useEffect(() => {
    let ativo = true
    async function inicial() {
      await carregar()
      if (ativo) setCarregando(false)
    }
    void inicial()
    return () => { ativo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistencia])

  async function salvarPeso(registro: RegistroDePeso) {
    await persistencia.pesos.salvar(registro)
    await carregar()
  }

  if (carregando) return null

  const hoje = formatarISODate(new Date())
  const pesoHoje = estado.pesos.find((p) => p.data === hoje) ?? null
  const fase = estadoProgresso(estado.pesos.length)
  const recentes = pesosRecentes(estado.pesos, hoje)

  const mostrarSugestao =
    fase !== "vazio" &&
    estado.pesoBase !== null &&
    sugerirNovoPlano(estado.maisRecente, estado.pesoBase, LIMIAR_DIVERGENCIA_PESO)

  return (
    <section className="progresso">
      <Cabecalho />

      {fase !== "vazio" && estado.maisRecente && (
        <MetricasTopo
          atualKg={estado.maisRecente.peso_kg}
          pesoBase={estado.pesoBase}
          mostrarVariacao={fase === "serie"}
        />
      )}

      {fase === "unico" && (
        <p className="progresso__convite-serie">Registre outro peso para ver o gráfico de evolução.</p>
      )}

      {fase === "serie" && <GraficoPeso pesos={estado.pesos} />}

      {fase === "vazio" && (
        <div className="progresso__vazio">
          <EstadoVazio>
            <p className="progresso__vazio-titulo">Nenhum peso registrado ainda.</p>
            <p className="progresso__vazio-texto">
              O progresso aparece conforme você registra — comece pelo peso de hoje.
            </p>
          </EstadoVazio>
        </div>
      )}

      {mostrarSugestao && estado.maisRecente && estado.pesoBase !== null && (
        <SugestaoNovoPlano atualKg={estado.maisRecente.peso_kg} pesoBase={estado.pesoBase} />
      )}

      <RegistrarPeso pesoHoje={pesoHoje} onSalvar={salvarPeso} />

      {recentes.length > 0 && (
        <section className="progresso__ultimos">
          <h2 className="progresso__ultimos-titulo">Últimos</h2>
          <ul className="progresso__ultimos-lista">
            {recentes.map((r) => (
              <LinhaUltimo key={r.id} registro={r} onSalvar={salvarPeso} />
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}
