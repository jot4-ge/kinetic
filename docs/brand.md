# Kinetic — Brand Book

> Documento de referência visual do projeto. Toda decisão de UI (cor, tipografia,
> espaçamento, imagem, componente) deve derivar deste documento. Se algo não está
> definido aqui, é decisão pendente — pergunte antes de assumir.

---

## 1. Identidade

**Nome:** Kinetic
**Origem:** do grego *kinesis* — movimento. Associação direta com "cinético" em português.
**Tagline:** "move with purpose" (em dourado, sempre em minúsculas, sempre acompanhando o wordmark)

**Conceito central:** a dualidade grega entre **ordem e movimento**. A rotina como
estrutura que liberta, não que aprisiona. Disciplina executada em movimento — a vida
do usuário não para, e o app acompanha.

**Metáfora de produto:** uma agenda moderna. Estruturada, densa mas legível, com senso
de propriedade. Séria porque funciona, não porque é solene.

---

## 2. Persona

Pessoa que pratica atividade física com frequência (ou está começando com seriedade),
mas tem rotina densa fora do treino — estudos, trabalho, vida real. Características:

- Disciplinada; não precisa de motivação externa, precisa de clareza e eficiência
- Sem tempo para configurar ou decifrar interfaces
- Leva o corpo a sério: entende treino e alimentação como variáveis mensuráveis
- Encontra no app um facilitador de organização, não um coach motivacional

**Implicação direta no design:** zero conteúdo motivacional genérico, zero gamificação
exagerada, zero exclamações. O usuário já está motivado — o app entrega estrutura.

---

## 3. Tom de voz

> **Direto, mas não frio. Limpo, mas não vazio. Humano, mas não informal demais.**

- **Fala pouco, pesa muito.** Labels curtos, sem marketing. "382 kcal", nunca
  "Você consumiu 382 kcal hoje!"
- **Humano, não corporativo.** Parece feito por quem também treina. Sem
  "optimize your performance".
- **Dados como linguagem.** Números são a comunicação principal. A hierarquia
  tipográfica deixa a métrica falar antes do rótulo.
- **Sem exclamações em copy de sistema.** Sem "por favor" em instruções. Verbos
  no imperativo direto: "Registrar refeição", não "Que tal registrar sua refeição?"

---

## 4. Paleta

### 4.1 Light mode — "Mármore Carrara"

| Papel | Nome | Hex | Uso |
|---|---|---|---|
| Fundo principal | Carrara | `#F5F3EE` | Background de página |
| Fundo elevado | Veio | `#ECEAE3` | Cards, superfícies elevadas |
| Texto principal | Escrita | `#2C2A25` | Corpo de texto, títulos |
| Texto secundário | Suporte | `#7C7870` | Labels, metadados, hints |
| Acento | Ouro | `#C9A84C` | Métricas-chave, CTAs, progresso |
| Ouro escuro (light only) | Ouro profundo | `#A07C1A` | Variação do ouro sobre fundos claros quando `#C9A84C` tiver contraste insuficiente |

### 4.2 Dark mode — "Negro profundo"

| Papel | Nome | Hex | Uso |
|---|---|---|---|
| Fundo principal | Negro | `#0A0806` | Background de página — NÃO é cinza escuro genérico |
| Fundo elevado | Veio escuro | `#171411` | Cards, superfícies elevadas |
| Texto principal | Escrita clara | `#E8E5DE` | Corpo de texto, títulos |
| Texto secundário | Suporte escuro | `#8A867E` | Labels, metadados, hints |
| Acento | Ouro | `#C9A84C` | Idêntico ao light — o ouro não muda entre modos |

### 4.3 Regras de cor

- **O ouro `#C9A84C` é o ÚNICO acento.** Não existe cor secundária de destaque.
- Ouro aparece apenas em: métricas importantes, CTAs primários, indicadores de progresso,
  o tagline, e detalhes do símbolo da marca. **Nunca decorativo.**
- Cores semânticas (sucesso/erro/aviso) são permitidas apenas em feedback de sistema
  (validação de formulário, toasts) e devem ser dessaturadas para combinar com a paleta —
  nunca verde/vermelho puro e vibrante.
- O dark mode NÃO é inversão do light: é o negro profundo com elementos **emergindo**
  da escuridão, como as esculturas das referências visuais. Contraste alto e intencional.

---

## 5. Tipografia

| Papel | Fonte | Uso | Regra |
|---|---|---|---|
| Display / marca | **Cinzel** | Wordmark, títulos de seção principais | Usada com contenção. NUNCA em corpo de texto, labels ou botões |
| Corpo / UI | **Inter** (ou DM Sans) | Todo o resto da interface | Peso 400 padrão, 500 para ênfase. Nunca 700+ |
| Dados / números | **Fonte mono** (JetBrains Mono ou similar) | Métricas, kcal, macros, pesos | Alinhamento tabular para colunas de números |

- Cinzel é baseada nas proporções das inscrições romanas clássicas — é a conexão
  tipográfica com a referência grega. Seu uso excessivo vira pastiche; contenção é regra.
- Letter-spacing generoso no wordmark (KINETIC): ~0.15em.
- Tagline "move with purpose": Cinzel ou serif, tamanho pequeno, letter-spacing ~0.3em,
  cor ouro.

---

## 6. Logo e símbolo

### 6.1 Símbolo — "As três colunas"

Três colunas gregas em perspectiva de altura:
- **Coluna central:** mais alta, opacidade dominante (ouro ~55%). Representa o eixo —
  a disciplina.
- **Colunas laterais:** mais baixas, recuadas (ouro ~18% de opacidade). Existem, mas
  cedem protagonismo.
- **Capitéis:** traço sólido em ouro no topo de cada coluna.
- **Base (estilóbata):** duas linhas horizontais em ouro na base, a inferior mais larga
  e mais transparente — ancoragem.

O movimento está na **diferença de altura entre as colunas** — a diagonal implícita que
o olho percorre. Estrutura com tensão dinâmica, não simetria estática.

### 6.2 Logo completa (uso principal)

Símbolo das três colunas + wordmark "KINETIC" em serif (Cinzel) com letter-spacing
generoso + tagline "move with purpose" em ouro abaixo do wordmark.

**Onde usar:** splash screen, header do app, onboarding, site.

### 6.3 Ícone do app

- **Padrão:** fundo negro `#0A0806`, símbolo das três colunas em ouro, cantos
  arredondados padrão da plataforma (rx ≈ 22% da largura).
- **Alternativa clara:** fundo mármore `#F0EDE6` com colunas em ouro escuro —
  disponível para contextos onde o escuro não funciona.

**Onde usar símbolo solo (sem nome):** ícone de app, favicon, avatar, contextos < 48px.

---

## 7. Imagens e elementos visuais

### 7.1 Direção fotográfica / ilustrativa

Referências aprovadas: esculturas gregas clássicas em alto contraste sobre fundo negro
(estilo Sísifo, Atlas, Discóbolo), arquitetura de colunas iluminada contra o céu noturno.

Características obrigatórias das imagens:
- **Preto profundo como fundo** — a figura emerge da escuridão, não está "sobre" um fundo
- **Alto contraste** — branco do mármore contra o negro, sem meio-tons suavizados
- **Grão/textura** — tratamento com textura de filme, não fotografia limpa de estúdio
- **Temas:** figuras em esforço/movimento (carga, ascensão, tensão), arquitetura de ordem

### 7.2 Onde as imagens aparecem

- Splash screen / abertura
- Fundos de seção (com overlay escuro para garantir legibilidade do conteúdo)
- Estados vazios (empty states) — uma escultura contemplativa em vez de ilustração genérica
- **Nunca:** atrás de dados densos (tabelas de macros, listas de exercícios) — legibilidade
  vence decoração sempre

### 7.3 Textura de mármore

Fundo com textura de mármore real (sutil) nos dois modos:
- Light: veios sutis de Carrara sobre `#F5F3EE`
- Dark: textura quase imperceptível sobre `#0A0806` — presença, não distração

**Regra de performance:** textura via CSS/SVG otimizado ou imagem WebP comprimida com
`background-attachment` fixo evitado em mobile. Se a textura custar mais de ~50KB ou
causar jank de scroll em mobile, degradar para cor sólida — performance vence textura.

---

## 8. Componentes — princípios

- **Cards:** fundo elevado (Veio / Veio escuro), cantos arredondados moderados (8-12px),
  sem sombras pesadas. Bordas hairline sutis quando necessário.
- **Métricas:** número grande em mono ou peso 500, label pequeno em Suporte acima ou
  abaixo. O número é o protagonista.
- **Progresso (hidratação, aderência):** barras finas, preenchimento em ouro,
  fundo em Veio. Percentual e valores absolutos sempre visíveis.
- **Botão primário:** fundo ouro `#C9A84C`, texto em `#2C2A25` (nunca branco puro sobre
  ouro — contraste insuficiente). Um único CTA primário por tela.
- **Botão secundário:** outline hairline, texto na cor de Escrita.
- **Espaçamento:** generoso. Proporção clássica — respiro é parte da identidade grega.
- **Motion:** contido. Transições rápidas (150-250ms), sem bounce, sem elasticidade.
  O movimento da marca está no conceito, não em animação exagerada.

### 8.1 Fazer / Não fazer

| ✓ Fazer | ✗ Não fazer |
|---|---|
| Ouro apenas em métricas e ações principais | Ouro como cor decorativa ou em ícones secundários |
| Cinzel apenas no wordmark e títulos de seção | Cinzel em corpo de texto, labels ou botões |
| Mármore como fundo — textura presente, não gritante | Gradientes, sombras exageradas, múltiplas cores de acento |
| Dark mode = negro profundo com elementos emergindo | Dark mode = cinza escuro genérico de app |
| Números como protagonistas da hierarquia | Texto motivacional competindo com dados |
| Esculturas/colunas como elementos com propósito | Imagens gregas como wallpaper decorativo em toda tela |

---

## 9. Acessibilidade

- Contraste mínimo WCAG AA em todo texto (verificar especialmente ouro sobre Carrara —
  usar Ouro profundo `#A07C1A` para texto dourado sobre fundos claros).
- Tamanho mínimo de texto: 12px (metadados), 14px (corpo), sem exceções abaixo disso.
- Áreas de toque mínimas de 44×44px em mobile.
- `prefers-reduced-motion` respeitado — nenhuma transição essencial para entendimento.
- Dark/light seguem `prefers-color-scheme` por padrão, com toggle manual disponível.

---

## 10. O que este documento NÃO define (decisões pendentes)

- Estrutura de navegação e fluxo de telas (fase de UX/wireframe)
- Componentes específicos além dos princípios da seção 8
- Ilustrações customizadas próprias (por enquanto: fotografia tratada de esculturas)
- Som/haptics

Qualquer decisão visual não coberta aqui deve ser levada ao dono do projeto antes de
implementada.
