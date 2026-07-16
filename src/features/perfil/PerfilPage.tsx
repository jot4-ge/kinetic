// Perfil — área secundária de configurações. Nesta fase contém só o ponto de
// entrada para gerar um novo Plano (que arquiva o atual, ADR-0002). Escopo
// deliberadamente mínimo: nada de features especulativas.
//
// "Gerar novo plano" leva ao formulário de onboarding, que se abre em modo
// "regeneracao" por derivar isso do estado persistido (existe Plano Ativo) —
// pré-preenchido e com confirmação antes de arquivar. Ver OnboardingPage.

import { useNavigate } from "react-router-dom"

export function PerfilPage() {
  const navigate = useNavigate()

  return (
    <section style={{ paddingTop: "var(--space-5)" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "26px",
          fontWeight: 500,
          color: "var(--text)",
          marginBottom: "var(--space-5)",
        }}
      >
        Perfil
      </h1>

      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-hairline)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-5)",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "var(--font-weight-emphasis)",
            color: "var(--text)",
            marginBottom: "var(--space-2)",
          }}
        >
          Plano
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "var(--space-5)" }}>
          Gerar um novo plano arquiva o atual. Planos não são editados — mudou a
          biometria ou o objetivo, gera-se um novo.
        </p>
        <button
          type="button"
          onClick={() => navigate("/onboarding")}
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
            cursor: "pointer",
          }}
        >
          Gerar novo plano
        </button>
      </div>
    </section>
  )
}
