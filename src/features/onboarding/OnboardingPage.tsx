// Onboarding — primeira tela de produto. Coleta a biometria + objetivo que o
// Motor de Geração exige, gera o Plano e persiste, então segue para /hoje.
//
// A lógica de domínio (validação, montagem do Usuario/Plano) vive em
// onboarding-core.ts. Aqui só há estado de formulário, apresentação (tokens do
// brand.md) e a orquestração de persistência + navegação.

import { useState, type CSSProperties } from "react"
import { useNavigate } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import {
  validarFormulario,
  construirUsuarioEPlano,
  FORMULARIO_VAZIO,
  type FormularioBruto,
  type ErrosValidacao,
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

  const [form, setForm] = useState<FormularioBruto>(FORMULARIO_VAZIO)
  const [erros, setErros] = useState<ErrosValidacao>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function atualizar(campo: keyof FormularioBruto, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
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
    setEnviando(true)
    try {
      const { usuario, plano } = construirUsuarioEPlano(resultado.valor, {
        gerarId: () => crypto.randomUUID(),
        agora: () => new Date(),
      })
      // Salva o Plano antes do Usuario para o ponteiro plano_ativo_id nunca
      // apontar para um Plano ainda inexistente.
      await persistencia.planos.salvar(plano)
      await persistencia.usuarios.salvar(usuario)
      navigate("/hoje", { replace: true })
    } catch (erro) {
      console.error("Falha ao gerar o plano:", erro)
      setErroGeral("Não foi possível salvar o plano. Tente de novo.")
      setEnviando(false)
    }
  }

  const props = (campo: keyof FormularioBruto) => ({
    id: campo,
    value: form[campo],
    "aria-invalid": erros[campo] ? true : undefined,
    "aria-describedby": erros[campo] ? `${campo}-erro` : undefined,
    style: estiloCampo,
  })

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
        Estes dados definem suas metas.
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
          {enviando ? "Gerando…" : "Gerar plano"}
        </button>
      </form>
    </section>
  )
}
