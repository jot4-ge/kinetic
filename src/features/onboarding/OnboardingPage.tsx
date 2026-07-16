// Onboarding — o formulário de Plano. Coleta a biometria + objetivo que o Motor
// de Geração exige, gera o Plano e persiste, então segue para /hoje.
//
// Dois modos, derivados do estado persistido (não da URL), via resolverModo:
//   "inicial"     — primeiro uso: formulário vazio, submissão gera direto.
//   "regeneracao" — já há Plano Ativo: pré-preenchido com os dados atuais;
//                   submissão pede confirmação (o novo Plano arquiva o atual,
//                   ADR-0002) antes de gerar. Cancelar não persiste nada.
//
// A lógica de domínio (validação, montagem do Usuario/Plano, decisão de modo e
// pré-preenchimento) vive em onboarding-core.ts. Aqui só há estado de
// formulário, apresentação (tokens do brand.md) e orquestração.

import { useEffect, useState, type CSSProperties } from "react"
import { useNavigate } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import {
  validarFormulario,
  construirUsuarioEPlano,
  resolverModo,
  formularioDeUsuario,
  FORMULARIO_VAZIO,
  ID_USUARIO_LOCAL,
  type FormularioBruto,
  type ErrosValidacao,
  type ModoFormulario,
} from "./onboarding-core"

const OPCOES_SEXO = [
  { valor: "M", rotulo: "Masculino" },
  { valor: "F", rotulo: "Feminino" },
]

const OPCOES_FATOR = [
  { valor: "Sedentario", rotulo: "Sedentário" },
  { valor: "LevementeAtivo", rotulo: "Levemente ativo" },
  { valor: "ModeramenteAtivo", rotulo: "Moderadamente ativo" },
  { valor: "MuitoAtivo", rotulo: "Muito ativo" },
  { valor: "ExtremamenteAtivo", rotulo: "Extremamente ativo" },
]

const OPCOES_OBJETIVO = [
  { valor: "Cutting", rotulo: "Cutting" },
  { valor: "Manutencao", rotulo: "Manutenção" },
  { valor: "Bulk", rotulo: "Bulk" },
  { valor: "Recomposicao", rotulo: "Recomposição" },
]

const estiloRotulo: CSSProperties = {
  display: "block",
  fontSize: "13px",
  color: "var(--text-muted)",
  marginBottom: "var(--space-2)",
}

const estiloCampo: CSSProperties = {
  width: "100%",
  minHeight: "var(--touch-target-min)",
  padding: "var(--space-2) var(--space-3)",
  background: "var(--bg)",
  color: "var(--text)",
  border: "1px solid var(--border-hairline)",
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-body)",
  fontSize: "15px",
}

const estiloErro: CSSProperties = {
  color: "var(--feedback-erro)",
  fontSize: "13px",
  marginTop: "var(--space-1)",
}

function Campo({
  id,
  rotulo,
  erro,
  children,
}: {
  id: string
  rotulo: string
  erro?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      <label htmlFor={id} style={estiloRotulo}>
        {rotulo}
      </label>
      {children}
      {erro && (
        <p id={`${id}-erro`} style={estiloErro}>
          {erro}
        </p>
      )}
    </div>
  )
}

export function OnboardingPage() {
  const persistencia = usePersistencia()
  const navigate = useNavigate()

  const [carregando, setCarregando] = useState(true)
  const [modo, setModo] = useState<ModoFormulario>("inicial")
  const [form, setForm] = useState<FormularioBruto>(FORMULARIO_VAZIO)
  const [erros, setErros] = useState<ErrosValidacao>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  // Etapa de confirmação (só no modo "regeneracao"): antes de arquivar o Plano
  // atual, o usuário confirma a consequência. Cancelar volta ao formulário sem
  // persistir nada.
  const [confirmando, setConfirmando] = useState(false)

  // Decide o modo e pré-preenche a partir do Usuario persistido (fonte canônica
  // da biometria). Em "regeneracao" o formulário abre com os dados atuais para o
  // usuário só ajustar o que mudou.
  useEffect(() => {
    let ativo = true
    async function carregar() {
      const usuario = await persistencia.usuarios.buscar(ID_USUARIO_LOCAL)
      if (!ativo) return
      const m = resolverModo(usuario)
      setModo(m)
      if (m === "regeneracao" && usuario) setForm(formularioDeUsuario(usuario))
      setCarregando(false)
    }
    void carregar()
    return () => {
      ativo = false
    }
  }, [persistencia])

  function atualizar(campo: keyof FormularioBruto, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  // Persiste de fato: gera o novo Plano e, se já houver um Ativo, arquiva-o.
  // Chamada direto no modo "inicial"; no modo "regeneracao" só após confirmar.
  async function gerar() {
    const resultado = validarFormulario(form)
    if (!resultado.ok) {
      // Guarda defensiva: a confirmação só é alcançada com o formulário válido,
      // mas se algo mudou, volta ao formulário mostrando os erros.
      setErros(resultado.erros)
      setConfirmando(false)
      return
    }
    setEnviando(true)
    try {
      const { usuario, plano } = construirUsuarioEPlano(resultado.valor, {
        gerarId: () => crypto.randomUUID(),
        agora: () => new Date(),
      })
      // ADR-0002: instala o novo Plano como Ativo e, se já houver um Ativo,
      // arquiva-o atomicamente. A data de arquivamento do anterior é o próprio
      // início do novo (vigencia.inicio = hoje): Períodos de Vigência contíguos,
      // sem lacuna nem sobreposição. Serve também ao primeiro Plano (nada a
      // arquivar → só ativa).
      await persistencia.planos.arquivarEAtivar(plano, plano.vigencia.inicio)
      // O ponteiro plano_ativo_id é atualizado depois, fora da transação de
      // troca: buscarAtivo resolve pelo índice, não pelo ponteiro, então a
      // invariante de "um único Plano Ativo" não depende desta escrita.
      await persistencia.usuarios.salvar(usuario)
      navigate("/hoje", { replace: true })
    } catch (erro) {
      console.error("Falha ao gerar o plano:", erro)
      setErroGeral("Não foi possível salvar o plano. Tente de novo.")
      setEnviando(false)
      setConfirmando(false)
    }
  }

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault()
    setErroGeral(null)

    const resultado = validarFormulario(form)
    if (!resultado.ok) {
      setErros(resultado.erros)
      return
    }
    setErros({})

    // Regeneração exige confirmação (arquiva o Plano atual) antes de gerar; o
    // primeiro Plano não tem nada a arquivar e gera direto.
    if (modo === "regeneracao") {
      setConfirmando(true)
      return
    }
    await gerar()
  }

  const props = (campo: keyof FormularioBruto) => ({
    id: campo,
    value: form[campo],
    "aria-invalid": erros[campo] ? true : undefined,
    "aria-describedby": erros[campo] ? `${campo}-erro` : undefined,
    style: estiloCampo,
  })

  // Enquanto decide o modo (leitura do Usuario), não pisca o formulário vazio.
  if (carregando) return null

  const subcopy =
    modo === "regeneracao"
      ? "Ajuste o que mudou desde o plano atual."
      : "Estes dados definem suas metas."
  const rotuloEnviar = modo === "regeneracao" ? "Continuar" : "Gerar plano"

  // Etapa de confirmação do modo "regeneracao": estado do formulário preservado
  // por trás; cancelar apenas volta, sem tocar em nada persistido.
  if (confirmando) {
    return (
      <section style={{ paddingTop: "var(--space-5)" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "26px",
            fontWeight: 500,
            color: "var(--text)",
            marginBottom: "var(--space-2)",
          }}
        >
          Gerar novo plano
        </h1>
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-hairline)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-5)",
            marginTop: "var(--space-3)",
          }}
        >
          <p style={{ color: "var(--text)", marginBottom: "var(--space-3)" }}>
            Isto arquiva seu plano atual.
          </p>
          <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-5)", fontSize: "14px" }}>
            Ele deixa de ser o ativo, mas continua consultável no histórico com os
            registros que você fez durante sua vigência.
          </p>

          {erroGeral && (
            <p style={{ ...estiloErro, marginBottom: "var(--space-4)" }}>{erroGeral}</p>
          )}

          <button
            type="button"
            onClick={() => void gerar()}
            disabled={enviando}
            style={{
              width: "100%",
              minHeight: "var(--touch-target-min)",
              padding: "var(--space-3) var(--space-4)",
              background: "var(--accent)",
              color: "var(--on-accent)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-body)",
              fontWeight: "var(--font-weight-emphasis)",
              fontSize: "15px",
              cursor: enviando ? "default" : "pointer",
              opacity: enviando ? 0.7 : 1,
            }}
          >
            {enviando ? "Gerando…" : "Arquivar plano atual e gerar"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            disabled={enviando}
            style={{
              width: "100%",
              minHeight: "var(--touch-target-min)",
              marginTop: "var(--space-3)",
              padding: "var(--space-3) var(--space-4)",
              background: "transparent",
              color: "var(--text)",
              border: "1px solid var(--border-hairline)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              cursor: enviando ? "default" : "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </section>
    )
  }

  return (
    <section style={{ paddingTop: "var(--space-5)" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "26px",
          fontWeight: 500,
          color: "var(--text)",
          marginBottom: "var(--space-2)",
        }}
      >
        Novo plano
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-5)" }}>
        {subcopy}
      </p>

      <form
        onSubmit={aoEnviar}
        noValidate
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-hairline)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-5)",
        }}
      >
        <Campo id="sexo" rotulo="Sexo" erro={erros.sexo}>
          <select
            {...props("sexo")}
            onChange={(e) => atualizar("sexo", e.target.value)}
          >
            <option value="">Selecione</option>
            {OPCOES_SEXO.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </Campo>

        <Campo id="idade" rotulo="Idade" erro={erros.idade}>
          <input
            {...props("idade")}
            type="number"
            inputMode="numeric"
            onChange={(e) => atualizar("idade", e.target.value)}
          />
        </Campo>

        <Campo id="peso_kg" rotulo="Peso (kg)" erro={erros.peso_kg}>
          <input
            {...props("peso_kg")}
            type="number"
            inputMode="decimal"
            step="0.1"
            onChange={(e) => atualizar("peso_kg", e.target.value)}
          />
        </Campo>

        <Campo id="altura_cm" rotulo="Altura (cm)" erro={erros.altura_cm}>
          <input
            {...props("altura_cm")}
            type="number"
            inputMode="numeric"
            onChange={(e) => atualizar("altura_cm", e.target.value)}
          />
        </Campo>

        <Campo id="fator_atividade" rotulo="Nível de atividade" erro={erros.fator_atividade}>
          <select
            {...props("fator_atividade")}
            onChange={(e) => atualizar("fator_atividade", e.target.value)}
          >
            <option value="">Selecione</option>
            {OPCOES_FATOR.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </Campo>

        <Campo id="objetivo" rotulo="Objetivo" erro={erros.objetivo}>
          <select
            {...props("objetivo")}
            onChange={(e) => atualizar("objetivo", e.target.value)}
          >
            <option value="">Selecione</option>
            {OPCOES_OBJETIVO.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </Campo>

        {erroGeral && (
          <p style={{ ...estiloErro, marginBottom: "var(--space-4)" }}>{erroGeral}</p>
        )}

        <button
          type="submit"
          disabled={enviando}
          style={{
            width: "100%",
            minHeight: "var(--touch-target-min)",
            marginTop: "var(--space-2)",
            padding: "var(--space-3) var(--space-4)",
            background: "var(--accent)",
            color: "var(--on-accent)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-body)",
            fontWeight: "var(--font-weight-emphasis)",
            fontSize: "15px",
            cursor: enviando ? "default" : "pointer",
            opacity: enviando ? 0.7 : 1,
          }}
        >
          {enviando ? "Gerando…" : rotuloEnviar}
        </button>
      </form>
    </section>
  )
}
