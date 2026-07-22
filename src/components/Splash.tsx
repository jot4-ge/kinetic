// Splash / tela de abertura (brand §6.2, §7.2). Composição do brand-book: a
// cabeça barbada tratada emergindo do negro, o wordmark KINETIC em Cinzel e a
// tagline "move with purpose" em ouro abaixo.
//
// Tratamento sempre escuro, independente do tema — a splash é um momento à
// parte (ver src/styles/esculturas.css). Exibida só durante o bootstrap real
// (abertura do IndexedDB) e apenas se ele passar de ~150ms; o wiring vive em
// main.tsx para não introduzir atraso artificial nem piscar em cargas rápidas.

import cabecaUrl from "@/assets/escultura-cabeca.webp"

export function Splash() {
  return (
    <div className="splash" role="status" aria-label="Kinetic — carregando">
      <div className="splash__figura-wrap">
        {/* Decorativa: o significado está no wordmark textual abaixo. */}
        <img
          className="splash__figura"
          src={cabecaUrl}
          alt=""
          aria-hidden="true"
          width={800}
          height={980}
        />
      </div>
      <div className="splash__marca">
        <div className="splash__wordmark">KINETIC</div>
        <div className="splash__tagline">move with purpose</div>
      </div>
    </div>
  )
}
