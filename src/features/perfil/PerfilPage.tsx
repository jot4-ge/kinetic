// Perfil — "página de identidade" do Usuário (refino ADR-0016). De cima para
// baixo: bloco de identidade (objetivo + medalhão + métricas do Plano Ativo,
// só LEITURA do que já está persistido), card "Progresso de peso" (entrada
// para /progresso, fase 2b) e o card de Plano (Gerar novo plano / Ver
// histórico) já existente — mesma copy e comportamento, só a aparência muda.

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePersistencia } from "@/providers/persistencia-context"
import { EstadoVazio } from "@/components/EstadoVazio"
import { formatarISODate } from "@/utils/data"
import { ID_USUARIO_LOCAL } from "@/features/onboarding/onboarding-core"
import { OBJETIVO_LABEL, formatarDesde } from "./perfil-core"
import type { Usuario, PlanoAtivo } from "@/types"
import cabecaUrl from "@/assets/escultura-cabeca.webp"

interface EstadoCarregado {
  usuario: Usuario | null
  plano: PlanoAtivo | null
}

function BlocoIdentidade({ usuario, plano }: { usuario: Usuario; plano: PlanoAtivo }) {
  const hoje = formatarISODate(new Date())
  return (
    <section className="perfil__identidade">
      <div className="perfil__identidade-topo">
        <div className="perfil__medalhao-wrap">
          <img className="perfil__medalhao" src={cabecaUrl} alt="" aria-hidden="true" width={64} height={64} />
        </div>
        <div>
          <p className="perfil__objetivo">{OBJETIVO_LABEL[plano.objetivo]}</p>
          <p className="perfil__desde">{formatarDesde(plano.vigencia.inicio, hoje)}</p>
        </div>
      </div>

      <div className="perfil__metricas">
        <div className="perfil__metrica">
          <span className="perfil__metrica-valor">
            {plano.meta_calorica_diaria}
            <span className="perfil__metrica-unidade"> kcal</span>
          </span>
          <span className="perfil__metrica-rotulo">Meta</span>
        </div>
        <div className="perfil__metrica">
          <span className="perfil__metrica-valor">
            {usuario.peso_kg}
            <span className="perfil__metrica-unidade"> kg</span>
          </span>
          <span className="perfil__metrica-rotulo">Peso</span>
        </div>
        <div className="perfil__metrica">
          <span className="perfil__metrica-valor">
            {usuario.altura_cm}
            <span className="perfil__metrica-unidade"> cm</span>
          </span>
          <span className="perfil__metrica-rotulo">Altura</span>
        </div>
      </div>
    </section>
  )
}

export function PerfilPage() {
  const navigate = useNavigate()
  const persistencia = usePersistencia()

  const [carregando, setCarregando] = useState(true)
  const [estado, setEstado] = useState<EstadoCarregado | null>(null)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const [usuario, plano] = await Promise.all([
        persistencia.usuarios.buscar(ID_USUARIO_LOCAL),
        persistencia.planos.buscarAtivo(ID_USUARIO_LOCAL),
      ])
      if (!ativo) return
      setEstado({ usuario, plano })
      setCarregando(false)
    }
    void carregar()
    return () => {
      ativo = false
    }
  }, [persistencia])

  if (carregando || !estado) return null

  return (
    <section className="perfil">
      <h1 className="perfil__titulo-linha">
        <span className="perfil__titulo">Perfil</span>
        <span className="perfil__titulo-filete" aria-hidden="true" />
      </h1>

      {estado.usuario && estado.plano ? (
        <BlocoIdentidade usuario={estado.usuario} plano={estado.plano} />
      ) : (
        <div className="perfil__vazio">
          <EstadoVazio>
            <p className="perfil__vazio-titulo">Nenhum plano ativo.</p>
            <p className="perfil__vazio-texto">
              Gere um plano para ver seu objetivo, suas metas e seu progresso aqui.
            </p>
          </EstadoVazio>
        </div>
      )}

      <section className="perfil__card">
        <h2 className="perfil__card-titulo">Progresso de peso</h2>
        <p className="perfil__card-texto">
          Registre seu peso e acompanhe a evolução frente à base do seu Plano.
        </p>
        <button
          type="button"
          className="perfil__cta-secundaria"
          onClick={() => navigate("/progresso")}
        >
          Ver progresso
        </button>
      </section>

      <section className="perfil__card">
        <h2 className="perfil__card-titulo">Plano</h2>
        <p className="perfil__card-texto">
          Gerar um novo plano arquiva o atual. Planos não são editados — mudou a
          biometria ou o objetivo, gera-se um novo.
        </p>
        <button type="button" className="perfil__cta" onClick={() => navigate("/onboarding")}>
          Gerar novo plano
        </button>

        {/* Consulta do histórico — ação secundária (outline, brand §8): o ouro
            fica com o CTA primário. Planos arquivados e seus Registros vivem aqui. */}
        <button
          type="button"
          className="perfil__cta-secundaria"
          onClick={() => navigate("/historico")}
        >
          Ver histórico de planos
        </button>
      </section>
    </section>
  )
}
