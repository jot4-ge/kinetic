# Kinetic — Brand Book

Ver também: brand-book.png (peça visual de referência)

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

## 3. Tom de voz e expressão visual

> **Voz contida, visual expressivo.** São dois eixos independentes e é um erro
> tratá-los como um só: o Kinetic **fala pouco** e **mostra muito**.

Essa distinção é o princípio de expressão da marca (ADR-0016). A contenção vale
para a **copy** — palavras custam atenção. Ela NÃO vale para a **ornamentação
visual**, que é generosa e é o que torna o app memorável.

### 3.1 Tom de voz (contido — isto não muda)

- **Fala pouco, pesa muito.** Labels curtos, sem marketing. "382 kcal", nunca
  "Você consumiu 382 kcal hoje!"
- **Humano, não corporativo.** Parece feito por quem também treina. Sem
  "optimize your performance".
- **Dados como linguagem.** Números são a comunicação principal. A hierarquia
  tipográfica deixa a métrica falar antes do rótulo.
- **Sem exclamações em copy de sistema.** Sem "por favor" em instruções. Verbos
  no imperativo direto: "Registrar refeição", não "Que tal registrar sua refeição?"

### 3.2 Expressão visual (generosa)

A identidade greco-romana é **afirmada, não sugerida**. Molduras, meandros gregos,
frontões, colunas de ambiente, capitéis, filetes e faixas ornamentais são
bem-vindos e esperados. Uma tela do Kinetic deve ser reconhecível como Kinetic
por sua arquitetura visual, não só pela paleta.

**A ÚNICA linha inegociável:**

> **Ornamento no ambiente é livre. Ornamento sobre os dados é proibido.**

"Dados" = tudo que o usuário precisa ler rápido e sem esforço: macros, kcal,
números, pesos, listas de refeições e exercícios, rótulos de campo, estados de
registro. Sobre esses elementos nada compete — nem textura, nem imagem de fundo,
nem faixa dourada, nem serifa decorativa.

"Ambiente" = tudo que emoldura os dados sem se sobrepor a eles: fundos de página,
bordas e molduras de card, cabeçalhos e rodapés de seção, laterais, separadores,
estados vazios, splash. Aqui a ornamentação é encorajada.

Na dúvida entre "isto enfeita" e "isto atrapalha a leitura", a leitura vence —
mas a resposta correta é quase sempre mover o ornamento para o ambiente, não
eliminá-lo.

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
  A generosidade da marca está na **quantidade de ornamento**, nunca na quantidade
  de cores.
- **Ouro tem dois registros de uso, com opacidades distintas:**
  - **Ouro de significado** (opacidade plena): métricas importantes, CTAs primários,
    indicadores de progresso, o dia de hoje, o tagline, detalhes do símbolo. Quando
    o ouro está cheio, ele quer dizer alguma coisa.
  - **Ouro de ambiente** (opacidade baixa, ~4–20%): meandros, molduras, filetes,
    colunas de ambiente, faixas de cabeçalho e rodapé. Ornamento legítimo — o que
    o antigo "nunca decorativo" proibia e hoje é encorajado (§3.2).
  A separação por opacidade é o que impede o ornamento de roubar o sinal: se um
  elemento ornamental competir visualmente com uma métrica, ele está forte demais.
- Cores semânticas (sucesso/erro/aviso) são permitidas apenas em feedback de sistema
  (validação de formulário, toasts) e devem ser dessaturadas para combinar com a paleta —
  nunca verde/vermelho puro e vibrante.
- O dark mode NÃO é inversão do light: é o negro profundo com elementos **emergindo**
  da escuridão, como as esculturas das referências visuais. Contraste alto e intencional.

---

## 5. Tipografia

| Papel | Fonte | Uso | Regra |
|---|---|---|---|
| Display / marca | **Cinzel** | Wordmark, títulos de seção, títulos ornamentais (frontões, cabeçalhos emoldurados) | NUNCA em corpo de texto, labels, botões ou dados |
| Corpo / UI | **Inter** (ou DM Sans) | Todo o resto da interface | Peso 400 padrão, 500 para ênfase. Nunca 700+ |
| Dados / números | **Fonte mono** (JetBrains Mono ou similar) | Métricas, kcal, macros, pesos | Alinhamento tabular para colunas de números |

- Cinzel é baseada nas proporções das inscrições romanas clássicas — é a conexão
  tipográfica com a referência grega. Use-a em todo título que emoldura conteúdo:
  ela é parte do ornamento (§3.2), não uma exceção rara. O limite não é de
  quantidade, é de função — Cinzel titula, jamais carrega dado nem rótulo de campo,
  onde a legibilidade em corpo pequeno é o que importa.
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

## 7. Imagens e elementos ornamentais

Esta seção é onde a expressividade da marca (§3.2) se materializa. Imagens e
ornamentos não são um "extra" a ser cortado quando o tempo aperta — são o que
distingue o Kinetic de um dashboard genérico.

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
- Cabeçalhos de tela e faixas de transição entre seções
- **Nunca:** atrás de dados densos (tabelas de macros, listas de exercícios,
  números de registro) — a linha inegociável do §3.2. Nesses lugares o ornamento
  vai para a **moldura** ao redor do bloco, não para trás dele.

### 7.3 Vocabulário ornamental

O léxico greco-romano do Kinetic. Estes elementos são reutilizáveis e devem
aparecer com regularidade — a repetição é o que cria reconhecimento de marca.

| Elemento | O que é | Onde usar | Tratamento |
|---|---|---|---|
| **Meandro grego** (grega / *greek key*) | Faixa de linhas em ângulo reto, padrão contínuo | Topo e rodapé de uma peça, separadores de seção | Ouro de ambiente (~10–20% de opacidade), traço fino, altura discreta (8–16px) |
| **Moldura** | Borda que declara "isto é uma peça", não só um retângulo | Cards de destaque, grades, blocos de conteúdo | Hairline dupla ou borda + filete interno em ouro de ambiente |
| **Colunas de ambiente** | Faixas verticais evocando colunas de templo | Laterais de uma área de conteúdo, fundos de seção | Opacidade **muito** baixa (~4–8%), largura estreita, sem contorno duro |
| **Frontão** | Título ladeado por linhas/ângulos, como o topo de um templo | Títulos de tela e de seção | Cinzel + linhas douradas laterais; parte do título pode ir em ouro pleno |
| **Filete / estilóbata** | Linha (ou par de linhas) de ancoragem horizontal | Base de cards, rodapés, sob títulos | Ouro de ambiente; par de linhas com pesos diferentes |
| **Capitel** | Traço sólido rematando um elemento vertical | Topo de barras de progresso, extremidades de divisores | Ouro pleno quando marca dado; ambiente quando é só remate |

**Regra de composição:** um ornamento por função. Uma peça pode ter meandro no
topo, colunas nas laterais e filete na base — mas não dois meandros concorrendo
na mesma borda. Ornamento generoso não é ornamento acumulado.

**Regra de custo:** ornamentos são CSS/SVG inline (gradientes, `repeating-linear-gradient`,
`border-image`, pseudo-elementos). Nada de imagens raster para padrão geométrico.

**Regra de movimento:** ornamento é estático. Nada de meandro animado, brilho
pulsante ou moldura que respira — a animação continua contida (§8).

### 7.4 Textura de mármore

Fundo com textura de mármore real (sutil) nos dois modos:
- Light: veios sutis de Carrara sobre `#F5F3EE`
- Dark: textura quase imperceptível sobre `#0A0806` — presença, não distração

**Regra de performance:** textura via CSS/SVG otimizado ou imagem WebP comprimida com
`background-attachment` fixo evitado em mobile. Se a textura custar mais de ~50KB ou
causar jank de scroll em mobile, degradar para cor sólida — performance vence textura.

---

## 8. Componentes — princípios

- **Cards:** fundo elevado (Veio / Veio escuro), cantos arredondados moderados (8-12px),
  sem sombras pesadas. **Moldura é bem-vinda** — hairline, filete dourado de ambiente
  ou remate no topo/base (§7.3). Um card do Kinetic deve parecer uma peça emoldurada,
  não um retângulo cinza.
- **Métricas:** número grande em mono ou peso 500, label pequeno em Suporte acima ou
  abaixo. O número é o protagonista — **nada de ornamento dentro da caixa da métrica**;
  o ornamento vai na borda do card que a contém.
- **Progresso (hidratação, aderência):** barras finas, preenchimento em ouro,
  fundo em Veio. Percentual e valores absolutos sempre visíveis.
- **Botão primário:** fundo ouro `#C9A84C`, texto em `#2C2A25` (nunca branco puro sobre
  ouro — contraste insuficiente). Um único CTA primário por tela.
- **Botão secundário:** outline hairline, texto na cor de Escrita.
- **Espaçamento:** generoso. Proporção clássica — respiro é parte da identidade grega.
  Respiro e ornamento não são inimigos: o ornamento ocupa a borda do respiro, não o
  seu miolo.
- **Títulos de tela:** tratamento de frontão (§7.3) por padrão, não texto solto.
- **Motion:** contido — este eixo NÃO muda com o novo princípio. Transições rápidas
  (150-250ms), sem bounce, sem elasticidade. O ornamento é arquitetura, e arquitetura
  não pisca.

### 8.1 Fazer / Não fazer

O teste que resolve quase todos os casos: **o elemento está no ambiente ou sobre o
dado?** Ambiente → orne à vontade. Sobre o dado → não.

| ✓ Fazer | ✗ Não fazer |
|---|---|
| Ouro pleno em métricas e ações; ouro de ambiente em molduras e meandros | Ouro de ambiente com opacidade alta o bastante para competir com uma métrica |
| Meandros, molduras, colunas e frontões emoldurando o conteúdo | Ornamento atrás ou por cima de números, listas e rótulos |
| Cinzel em títulos e frontões, com liberdade | Cinzel em corpo de texto, labels, botões ou dados |
| Um ornamento por função e por borda | Meandro + moldura + sombra + textura disputando a mesma aresta |
| Ornamento em CSS/SVG, estático | Ornamento animado, pulsante ou em imagem raster pesada |
| Dark mode = negro profundo com elementos emergindo | Dark mode = cinza escuro genérico de app |
| Números como protagonistas da hierarquia | Texto motivacional (ou ornamento) competindo com dados |
| Esculturas e colunas como ambiente recorrente da marca | Imagem de escultura atrás de uma tabela de macros |
| Múltiplas cores? Não — expressividade vem de forma e ornamento | Segunda cor de acento "para variar" |

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
