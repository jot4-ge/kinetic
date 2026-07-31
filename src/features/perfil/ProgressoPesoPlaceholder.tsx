// Placeholder reservando o espaço da Fase 2 (Progresso de peso). Componente
// próprio e trivialmente substituível: a Fase 2 troca a IMPORTAÇÃO deste
// arquivo em PerfilPage por um componente real do mesmo formato — nenhuma
// outra parte da página muda. Não é reaproveitado em nenhum outro lugar.

export function ProgressoPesoPlaceholder() {
  return (
    <section className="perfil__placeholder">
      <h2 className="perfil__placeholder-titulo">Progresso de peso</h2>
      <p className="perfil__placeholder-texto">
        Em breve — registre seu peso e acompanhe a evolução.
      </p>
    </section>
  )
}
