// Fonte única do símbolo "as três colunas" (brand.md §6.1) para todo ícone do
// PWA — favicon, ícones do manifest e apple-touch-icon derivam daqui, para
// nunca divergirem entre si. viewBox fixo 0 0 100 100.
//
// Para o ícone (§6.3, escala pequena — favicon, <48px), o símbolo usa ouro em
// opacidade plena em vez da variação 55%/18% do lockup de logo (§6.1): a
// diferenciação por opacidade desaparece visualmente em poucos pixels: a
// identidade em escala de ícone vem da diferença de ALTURA entre as colunas,
// não da opacidade.

export const OURO = "#C9A84C"
export const NEGRO = "#0A0806"

// Retângulos do símbolo, em coordenadas do viewBox 100×100. Centro horizontal
// em x=50. Coluna central mais alta (§6.1: "o movimento está na diferença de
// altura entre as colunas"); laterais mais baixas e recuadas. Capitéis no
// topo de cada coluna; base (estilóbata) em duas linhas horizontais.
const ELEMENTOS = [
  // capitéis
  { x: 43, y: 22, w: 14, h: 4 },
  { x: 25, y: 34, w: 12, h: 4 },
  { x: 63, y: 34, w: 12, h: 4 },
  // colunas
  { x: 45, y: 26, w: 10, h: 40 },
  { x: 27, y: 38, w: 8, h: 28 },
  { x: 65, y: 38, w: 8, h: 28 },
  // estilóbata (base)
  { x: 20, y: 68, w: 60, h: 3 },
  { x: 15, y: 73, w: 70, h: 4 },
]

function simboloRects() {
  return ELEMENTOS.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${OURO}"/>`).join("")
}

// Bounding box do símbolo acima: x 15–85, y 22–77 → centro (50, 49.5).
// Transform de segurança do maskable: escala 0.7 em torno desse centro e
// recentraliza em (50,50) — o canto mais distante fica a ~31 unidades do
// centro, dentro da zona segura (~círculo de raio 36–40) que o Android
// garante não recortar (W3C maskable icons).
const TRANSFORM_MASKABLE = "translate(50,50) scale(0.7) translate(-50,-49.5)"

function svg({ tamanho, quadradoCheio }) {
  const fundo = quadradoCheio
    ? `<rect width="100" height="100" fill="${NEGRO}"/>`
    : `<rect width="100" height="100" rx="22" fill="${NEGRO}"/>`
  const simbolo = quadradoCheio
    ? `<g transform="${TRANSFORM_MASKABLE}">${simboloRects()}</g>`
    : simboloRects()
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 100 100">${fundo}${simbolo}</svg>`
}

// "any": cantos arredondados do próprio ícone (rx≈22%, brand §6.3) — para
// contextos que exibem o PNG/SVG como veio, sem aplicar máscara própria.
export function svgAny(tamanho) {
  return svg({ tamanho, quadradoCheio: false })
}

// "maskable"/apple-touch-icon: quadrado cheio, símbolo recuado na zona
// segura — o SO (Android adaptive icon, iOS) aplica a própria máscara/forma.
export function svgMaskable(tamanho) {
  return svg({ tamanho, quadradoCheio: true })
}
