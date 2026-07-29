# Ideias

Notas leves de direções candidatas para fases futuras. **Não são decisões
tomadas** — para decisões, ver `docs/adr/`; para trabalho acionável já triado,
ver `.scratch/<slug>/`. Uma ideia aqui pode virar ADR + issue quando for
priorizada, ou ser descartada. Registrar não é comprometer.

---

## Navegação temporal de Registros (ver/editar qualquer dia, não só hoje)

Hoje a tela "hoje" só permite registrar Aderência do dia atual, e o Histórico
mostra Registros de forma read-only, resumida por Plano. Falta uma forma de o
usuário navegar por dias arbitrários (ex: um calendário ou linha do tempo) para
ver e **editar** o Registro de qualquer data — inclusive corrigir um dia
esquecido retroativamente.

**Ponto-chave: o domínio já suporta isso.** O [ADR-0008](adr/0008-dois-carimbos-de-tempo-no-registro.md)
(dois carimbos de tempo: `data` imutável + `editado_em` mutável) foi desenhado
exatamente para permitir edição retroativa preservando quando cada edição
aconteceu de fato. A capacidade existe na persistência; falta a UI que a use.

Candidata a fase própria futura. Surgiu ao validar o Histórico (que expõe os
Registros passados, mas sem edição).

> **Implementada** na fase de navegação temporal ([ADR-0015](adr/0015-navegacao-temporal-registro-retroativo.md)).

---

## Retoque de ornamentação nas telas feitas sob o princípio antigo

O [ADR-0016](adr/0016-ornamentacao-expressiva-voz-contida.md) trocou a contenção
visual estrita pela ornamentação generosa ("voz contida, visual expressivo"). As
telas construídas **antes** dessa mudança seguiram o princípio anterior e podem
ficar visivelmente mais sóbrias que as novas — o risco é o app acumular **dois
dialetos visuais permanentes**, um contido e um expressivo, sem que nenhum dos
dois esteja errado isoladamente.

Telas nesta situação, em ordem aproximada de quanto destoam:

- **Tela "hoje"** (`src/features/hoje/`, `src/styles/tela-hoje.css`) — refinada na
  fase anterior sob o princípio contido. Cards de refeição, jornada do dia e
  layout desktop não têm moldura, meandro nem frontão no título. É a tela mais
  vista do app, então é onde a inconsistência mais aparece.
- **Splash e estados vazios** (`src/styles/esculturas.css`) — já usam esculturas
  gregas, então estão parcialmente alinhados; falta o vocabulário ornamental
  geométrico (moldura, filete) ao redor das peças.
- **Histórico e Perfil** — ainda não refinados visualmente; nascerão sob o novo
  princípio quando chegar a vez deles, sem dívida a pagar.

**Não é decisão tomada, e não é urgente.** A dívida é consciente: alinhar tudo de
uma vez agora custaria uma fase inteira de retrabalho visual antes de o novo
princípio ter sido validado em uso real. O caminho provável é retocar cada tela
quando ela for tocada por outro motivo, com o Calendário (primeira tela sob o
ADR-0016) servindo de referência do que "expressivo" significa na prática.

Ao retocar, o limite do ADR-0016 vale igual: ornamento entra no ambiente
(molduras, cabeçalhos, laterais), nunca sobre macros, kcal e listas.

---

## Cabeçalho do app estoura a largura em telas estreitas (scroll horizontal)

Em viewport de 390–414px, o cabeçalho do `app-shell` (wordmark KINETIC + botão
voltar + os três botões de tema "Sistema / Claro / Escuro") precisa de ~442px e
força **scroll horizontal na página inteira**. Medido em 386px de viewport:
`documentElement.scrollWidth` = 442 contra `innerWidth` = 386.

**É do cabeçalho, não de uma tela.** Reproduz idêntico em `/hoje` e
`/calendario`, e nenhum elemento das telas participa do overflow — os culpados
são o container do seletor de tema e o último botão. Encontrado ao verificar o
calendário no mobile (fase do ADR-0016), mas é anterior a ela.

Direções candidatas, nenhuma decidida:

- Colapsar o seletor de tema em um **botão único que cicla** sistema → claro →
  escuro, ou em um ícone que abre um menu — três botões lado a lado é o que
  consome a largura.
- Esconder o wordmark abaixo de certo breakpoint, deixando só o símbolo.
- Mover o seletor de tema para a tela de Perfil, tirando-o do cabeçalho global.

A terceira é a que mais reduz ruído permanente do cabeçalho, mas troca
descoberta por profundidade — decisão do dono do projeto. Vale casar com o
retoque de ornamentação acima, já que o cabeçalho é ambiente puro e seria
tocado de qualquer forma.
