# Créditos de imagem

As esculturas usadas na interface são obras de **domínio público** do acervo
**Open Access do The Metropolitan Museum of Art**, sob a licença
**CC0 1.0 Universal** (Public Domain Dedication).

| Arquivo | Uso na interface |
|---|---|
| `escultura-cabeca.webp` | Splash / tela de abertura; medalhão do Perfil |
| `escultura-busto.webp` | Estados vazios |

Os arquivos `escultura-cabeca.jpg` e `escultura-busto.jpg` são os originais sem
edição (proveniência); os `.webp` correspondentes são as versões otimizadas
efetivamente servidas pelo app. Todo o tratamento visual (grayscale, contraste,
máscara radial, grão) é feito por CSS em `src/styles/esculturas.css` — as
imagens não são pré-processadas de forma destrutiva.

- **Fonte:** The Metropolitan Museum of Art — Open Access
  (<https://www.metmuseum.org/art/collection>)
- **Licença:** CC0 1.0 Universal (<https://creativecommons.org/publicdomain/zero/1.0/>)

CC0 dispensa atribuição; o registro acima é boa prática e evita dúvida futura
sobre a origem dos arquivos.

## Fontes

`fonts/cinzel-variable-latin.woff2` e `fonts/inter-variable-latin.woff2` são
os arquivos variáveis (subset **latin** — cobre pt-BR integralmente) de
**Cinzel** e **Inter**, baixados do Google Fonts e auto-hospedados para o app
funcionar 100% offline (PWA — nenhuma dependência de rede além da primeira
carga). Um único arquivo por família cobre todos os pesos usados (400–600 em
Cinzel, 400–500 em Inter): `@font-face` em `src/styles/theme.css` fixa cada
peso via `font-weight` como faixa, a mesma técnica que o próprio Google Fonts
usa para servir essas famílias.

- **Licença:** SIL Open Font License 1.1 (<https://openfontlicense.org/>)
- **Cinzel:** Natanael Gama (<https://fonts.google.com/specimen/Cinzel>)
- **Inter:** Rasmus Andersson (<https://fonts.google.com/specimen/Inter>)
