# Multi-usuário com login e nuvem é escopo da V2 — a v1 permanece Camada 1

Registra uma decisão de rumo do projeto: autenticação, backend e sincronização
multi-usuário — a "Camada 2" que [ADR-0007](0007-camada-de-persistencia-abstraida.md)
e [ADR-0014](0014-identidade-usuario-camada-1-fixa-sem-dados-reais.md) já
preveem e nomeiam — não entram na v1. A v1 entrega o produto completo para uma
única pessoa, local, sem login; identidade fixa e sem dados pessoais reais
(ADR-0014) continua sendo o contrato vigente até o fim da v1, não um atalho
temporário a corrigir no meio do caminho.

Não é uma decisão de que multi-usuário é desnecessário — é sequenciamento.
Validar o produto (motor de geração, registro de aderência, histórico,
ornamentação de marca) com uso real de uma pessoa custa menos e arrisca menos
do que introduzir auth/sincronização/backend agora, amarrados a um produto
que ainda muda de forma. O custo de errar a Camada 2 cedo é mais alto do que
o custo de adiá-la.

A arquitetura já paga esse adiamento de antemão, para a V2 não exigir
retrabalho: o schema do IndexedDB inclui `usuario_id` desde o primeiro dia,
como se o sistema já fosse multi-usuário ([ADR-0006](0006-indexeddb-schema-final-desde-o-inicio.md));
a autoria de um Plano já é modelada separada da posse, pensando num
Treinador/Nutricionista futuro ([ADR-0004](0004-autoria-do-plano-separada-da-posse.md));
e nenhuma parte da aplicação acessa storage diretamente — tudo passa pela
Camada de Persistência abstraída (ADR-0007), então trocar a Camada 1 pela
Camada 2 é trocar a implementação atrás da mesma interface, não redesenhar o
app. A v1 mora inteiramente na Camada 1 (ADR-0014): id fixo `usuario-local`,
sem login, sem coleta de nome/e-mail reais.

Quando a V2 entrar em pauta, ela substitui: o id fixo por identidade real
emitida no login, os placeholders de nome/e-mail do onboarding por coleta
real, e o adapter de persistência local por um que fala com o backend
(Supabase é a hipótese já registrada em ADR-0006). Nenhuma dessas trocas
exige mudar o schema de domínio nem o resto da aplicação — é o investimento
que ADR-0006/0007/0014 fizeram, agora cobrado.
