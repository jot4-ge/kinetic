# Kinetic

### *move with purpose*

<!-- screenshot principal -->

App local-first de rotina — treino, dieta, hidratação e peso — para quem tem
disciplina mas pouco tempo para organizar tudo em planilhas e apps soltos.

**[Acessar o app](https://kinetic-plum.vercel.app)** · instalável como PWA, funciona offline

---

## Sumário

- [O que é](#o-que-é)
- [Features principais](#features-principais)
- [Stack](#stack)
- [Arquitetura e decisões](#arquitetura-e-decisões)
- [Como rodar localmente](#como-rodar-localmente)
- [Testes](#testes)
- [Status / roadmap](#status--roadmap)
- [Licença](#licença)

---

## O que é

Kinetic gera um **Plano** personalizado de treino e dieta a partir de biometria
e objetivo — meta calórica, macros, sessões de treino e cardápio por dia da
semana — e depois acompanha, dia a dia, o quanto esse Plano foi seguido de
fato. Não é um coach motivacional nem um contador de calorias genérico: é uma
ferramenta de estrutura para quem já sabe o que precisa fazer e só quer um
lugar para registrar se fez.

O produto é construído em torno de três conceitos: o **Plano** (as regras do
jogo — imutável enquanto vigora), o **Registro de Aderência** (o que
aconteceu de fato em cada dia, editável mesmo retroativamente) e o
**Progresso** (a variação de peso, usada como sinal de validação de que a
aderência está funcionando).

É **local-first**: todos os dados moram no dispositivo (IndexedDB), o app
funciona offline e é instalável como PWA — sem servidor, sem login, sem
sincronização por enquanto (ver [roadmap](#status--roadmap)).

## Features principais

- **Motor de geração de plano determinístico** — calcula TMB (Mifflin-St
  Jeor), TDEE e macros por objetivo (cutting, bulk, manutenção,
  recomposição), depois seleciona treinos e refeições de um banco de opções
  curado. Mesma entrada sempre produz o mesmo Plano — sem IA generativa.
  <!-- screenshot: onboarding / geração de plano -->

- **Registro de aderência com navegação temporal** — a tela do dia registra
  refeições, água, treino/JJ e checklist; um calendário permite abrir e
  editar o registro de qualquer dia passado, não só o de hoje.
  <!-- screenshot: tela "hoje" -->
  <!-- screenshot: calendário -->

- **Progresso de peso com gráfico e sugestão de novo plano** — série
  temporal de peso (editável, mas nunca deletável), com detecção de
  divergência em relação ao peso que gerou o Plano atual para sugerir uma
  regeneração.
  <!-- screenshot: progresso de peso -->

- **Histórico de planos por "eras"** — cada Plano anterior é arquivado, não
  substituído, e fica consultável como um capítulo numerado da jornada, com
  todos os registros vinculados a ele preservados.
  <!-- screenshot: histórico -->

- **PWA offline-first** — manifest, service worker com precache completo
  (Workbox) e toast de atualização quando uma nova versão está disponível.

## Stack

- **React 19** + **TypeScript 6** + **Vite 8**
- **React Router 7** para navegação
- **IndexedDB** (via [`idb`](https://www.npmjs.com/package/idb)) como
  persistência local, por trás de uma camada de repositório abstraída
- **Zod 4** para validação de schema na leitura/escrita do banco
- **vite-plugin-pwa** (Workbox) para manifest + service worker
- **Vitest** para testes unitários/integração, **Playwright** para specs
  visuais
- ESLint + Prettier

## Arquitetura e decisões

O código é organizado em camadas com dependência em uma direção só:

```
┌───────────────────────────────────┐
│  Features / Components             │  React — hoje, calendário, histórico,
│                                     │  progresso, perfil, onboarding
├───────────────────────────────────┤
│  Motor de Geração + Banco de       │  Cálculo determinístico de plano
│  Opções                            │  (TMB/TDEE/macros) + dados curados
├───────────────────────────────────┤
│  Camada de Persistência            │  Interface de repositório agnóstica
│    └─ Adapter IndexedDB (hoje)     │  de onde os dados moram
│    └─ Adapter cloud (V2, futuro)   │
└───────────────────────────────────┘
```

Nenhuma parte da UI ou do motor de geração acessa IndexedDB diretamente —
tudo passa pela camada de persistência (`src/persistencia/`), o que torna a
troca futura de storage uma mudança isolada de implementação.

O maior diferencial de engenharia deste projeto não está no código em si,
mas no processo de decisão por trás dele: **19 ADRs** em
[`docs/adr/`](docs/adr/) documentam cada escolha estrutural, com o raciocínio
e as alternativas rejeitadas. Algumas amostras:

- **[Plano imutável, registro mutável](docs/adr/0003-plano-imutavel-registro-mutavel.md)**
  — qualquer mudança nos números-base do Plano (meta calórica, macros,
  objetivo, dias de treino) arquiva o Plano atual e cria um novo; escolhas
  do dia a dia (qual refeição foi seguida) ficam só no Registro. Garante que
  métricas históricas por fase sejam sempre calculáveis com os mesmos
  parâmetros-base.
- **[Persistência abstraída, pensada para escalar à nuvem](docs/adr/0006-indexeddb-schema-final-desde-o-inicio.md)**
  — o schema do IndexedDB já inclui `usuario_id` e outros campos do sistema
  multi-usuário final, mesmo hoje só existindo um único usuário local. A
  migração futura para um backend é uma troca de onde os dados moram, não um
  redesenho do que os dados são.
- **[Motor determinístico, sem IA generativa](docs/adr/0005-motor-deterministico-sem-ia.md)**
  — o Plano é calculado por fórmula (Mifflin-St Jeor + fator de atividade) e
  seleção de um banco curado, nunca por LLM. Outputs auditáveis e
  reproduzíveis: o usuário pode entender exatamente por que recebeu aquele
  Plano.
- **[Single-user com caminho pronto para multiusuário na V2](docs/adr/0017-multiusuario-escopo-da-v2.md)**
  — autenticação, backend e sincronização ficaram fora da v1 por
  sequenciamento (validar o produto primeiro), mas a arquitetura já paga
  esse adiamento de antemão: autoria separada de posse ([ADR-0004](docs/adr/0004-autoria-do-plano-separada-da-posse.md)),
  identidade fixa sem dados reais ([ADR-0014](docs/adr/0014-identidade-usuario-camada-1-fixa-sem-dados-reais.md))
  e persistência abstraída (ADR-0006/0007) já deixam a troca para a Camada 2
  como implementação, não redesenho.

O vocabulário de domínio (Plano, Aderência, Era, Perfil de Dia, etc.) está
fixado em [`CONTEXT.md`](CONTEXT.md); a identidade visual completa (paleta,
tipografia, ornamentação greco-romana) está em [`docs/brand.md`](docs/brand.md).

## Como rodar localmente

Pré-requisito: Node.js (compatível com Vite 8 / TypeScript 6 — recomenda-se
Node 20+).

```bash
git clone https://github.com/jot4-ge/kinetic.git
cd kinetic
npm install
npm run dev
```

Outros scripts disponíveis (`package.json`):

```bash
npm run build      # type-check (tsc -b) + bundle de produção
npm run preview    # serve o bundle de produção localmente
npm run test       # testes unitários/integração (Vitest)
npm run test:visual  # specs visuais (Playwright)
npm run lint        # ESLint
npm run format       # Prettier em src/**/*.{ts,tsx,css}
```

## Testes

- **414 testes unitários e de integração** (Vitest), em 19 arquivos,
  cobrindo o motor de geração (cálculo de TMB, calorias, macros, seleção de
  treino/refeições), o domínio (Plano, vigência), cada feature (onboarding,
  calendário, histórico, hoje, perfil, progresso de peso) e o adapter de
  IndexedDB.
- **Specs visuais com Playwright** (`e2e/*.spec.ts`) para as telas hoje,
  histórico e perfil, em desktop e mobile, capturando o resultado em
  `e2e/capturas/`.
- **Harness de teste isolado** (`e2e/harness/`) — as specs visuais rodam
  contra uma entrada Vite paralela com um adapter de persistência em memória
  (`adapter-memoria.ts`), não o IndexedDB real. Isso permite injetar
  fixtures ricas (histórico de planos, dias variados de aderência) sem
  jamais tocar o banco de produção — o próprio harness tem um teste que
  garante `indexedDB.databases()` vazio durante a suíte.

## Status / roadmap

**v1.0.0 lançada** — produto completo para um único usuário, local-first, no
ar na Vercel (link no topo deste README).

**V2 planejada**: multiusuário com login e sincronização em nuvem (backend a
definir) — decisão de sequenciamento registrada em
[ADR-0017](docs/adr/0017-multiusuario-escopo-da-v2.md). A arquitetura atual
(persistência abstraída, autoria separada de posse, schema já preparado para
`usuario_id`) foi desenhada para que essa troca seja uma implementação nova
por trás da mesma interface, não um redesenho.

Outras direções candidatas, ainda não decididas, estão registradas em
[`docs/ideias.md`](docs/ideias.md) — por exemplo, um modo de dados de
demonstração para popular o app sob demanda ao mostrá-lo a outra pessoa.

## Licença

Este projeto está sob a licença MIT — ver [LICENSE](LICENSE).
