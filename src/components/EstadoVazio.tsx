// Estado vazio (brand §7.2) — o busto feminino clássico no lugar onde antes
// havia só texto. Imagem acima, mensagem (children) abaixo; a copy é do
// chamador e não muda aqui.
//
// A escultura é decorativa (alt="" / aria-hidden): o texto carrega o
// significado. loading="lazy" porque nunca está acima da dobra crítica
// (brand §7.3). Tratamento por tema em src/styles/esculturas.css.

import type { ReactNode } from "react"
import bustoUrl from "@/assets/escultura-busto.webp"

export function EstadoVazio({ children }: { children: ReactNode }) {
  return (
    <div className="estado-vazio">
      <div className="estado-vazio__figura-wrap">
        <img
          className="estado-vazio__figura"
          src={bustoUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={400}
          height={533}
        />
      </div>
      <div>{children}</div>
    </div>
  )
}
