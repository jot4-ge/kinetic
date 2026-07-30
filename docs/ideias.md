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

Reconfirmado na fase de refino do Histórico (harness Playwright, Chromium), com
dois detalhes novos: `scrollWidth` é **constante em 443px** a 386, 390 e 414 de
viewport — o cabeçalho não reflui, então alargar a tela só reduz a sobra até
sumir; e o `<header>` em si mede 419px, os 443 saindo dele mais o padding do
`app-shell`. Sob emulação mobile o sintoma muda de forma mas não de causa: o
viewport de layout se alarga para 429px em vez de gerar barra de rolagem, o que
encolhe todo o conteúdo da tela. Vale para qualquer captura mobile do app.

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

---

## Modo "dados de demonstração" (popular e limpar sob demanda)

Várias telas só mostram o que sabem fazer com **histórico acumulado**: o
Histórico precisa de mais de um Plano para a timeline de eras existir, o
Calendário precisa de dias registrados com aderências variadas para os 3 níveis
do indicador aparecerem, e a tela "hoje" precisa de um Plano Ativo. Um banco
recém-criado não tem nada disso, então demonstrar ou verificar visualmente essas
telas hoje exige **semear dados à mão no IndexedDB** — foi o que aconteceu na
fase de refino do Histórico, importando os módulos da app pelo console para criar
3 Planos e 14 Registros.

O problema não é o trabalho de escrever o script: é que os dados de teste **caem
no mesmo banco do uso real**, sem marcador de origem, e depois precisam ser
identificados e removidos um a um. Deu certo naquela vez porque os ids semeados
eram sintéticos (`plano-1`, `reg-7`) e o app real usa `crypto.randomUUID()` — mas
isso é sorte de convenção, não uma garantia. Um registro de demonstração com id
real seria indistinguível de um registro verdadeiro.

Direções candidatas, nenhuma decidida:

- **Popular/limpar sob demanda**, com um par de ações explícitas (tela de Perfil,
  ou rota escondida em dev) que criam um conjunto fixo e determinístico e sabem
  desfazê-lo inteiro. O ponto forte é a limpeza ser garantida por construção.
- **Marcador de origem no dado** (ex: campo `origem: "demo"` nos tipos, ou um
  prefixo reservado de id), o que torna a remoção cirúrgica trivial e segura —
  mas encosta no domínio para servir a uma necessidade de ferramenta.
- **Banco separado** para demonstração: `openDb` já recebe o nome do banco (é o
  que os testes de integração usam), então um toggle poderia apontar a app para
  `rotina-sync-demo` e deixar o banco real intocado. É a opção que mais garante
  isolamento e a que menos toca o domínio; em troca, os dois mundos não se
  misturam nem quando isso seria útil.

A terceira parece a mais promissora justamente por já existir a costura
(`openDb(name)` + `CamadaDePersistencia` injetada, ADR-0007) — trocar o adapter é
uma mudança isolada por desenho.

> **Metade resolvida: a verificação visual das fases de UI.** Existe agora um
> harness de teste que injeta fixtures ricas sem tocar banco nenhum — não um
> banco separado, mas a ausência de banco:
>
> - `e2e/harness/adapter-memoria.ts` implementa a `CamadaDePersistencia` sobre
>   `Map`s. Não importa `openDb`, não abre IndexedDB, não escreve localStorage.
> - `e2e/harness/index.html` + `main-harness.tsx` são uma entrada Vite paralela.
>   `src/main.tsx` (que abre o banco) fica intocado, então não há flag de runtime
>   nem ramo condicional pelo qual uma fixture possa vazar para produção — o
>   bundle de produção não muda de hash com o harness presente.
> - O isolamento é **asserção, não comentário**: o teste "harness não abre banco
>   nenhum" exige `indexedDB.databases() === []` e `localStorage.length === 0`.
>   Trocar o adapter em memória por um real quebra a suíte.
>
> Isso encerra a parte "demonstrar/verificar telas que dependem de histórico
> acumulado" — que era o que tinha causado a semeadura manual no banco real.
>
> **O que resta da ideia** é o modo-demo para o **usuário final**: popular o app
> com dados ricos sob demanda para demonstrá-lo a outra pessoa, no navegador de
> verdade. O harness não serve a isso (vive só no ambiente de teste), e é para
> esse caso que as três direções acima continuam abertas — com a terceira ainda
> sendo a mais promissora, pelo mesmo motivo.
