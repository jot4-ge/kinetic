# Kinetic

App de acompanhamento de rotina personalizada: exibe o Plano do usuário (o que fazer), registra Aderência diária (o que foi feito), e usa Progresso de peso como sinal de validação.

## Identidade visual

O produto se chama **Kinetic** (conceito greco-romano: ordem + movimento; paleta mármore/negro/ouro). A fonte da verdade para toda decisão visual — cores, tipografia, logo, imagens, componentes — é [`docs/brand.md`](docs/brand.md); decisão registrada em ADR-0013. Os design tokens estão implementados em `src/styles/theme.css`. O que não está definido no brand book é decisão pendente do dono do projeto.

O princípio de expressão é **voz contida, visual expressivo** (ADR-0016): a copy é enxuta, mas a ornamentação greco-romana — molduras, meandros, colunas de ambiente, frontões — é generosa. O limite inegociável: ornamento no ambiente é livre, ornamento sobre os dados (macros, kcal, números, listas) é proibido.

## Linguagem

**Plano**:
O programa personalizado completo de dieta, treino e hidratação que um Usuário segue. Define "as regras do jogo" de um período: meta calórica, macros, objetivo declarado, dias de treino, restrições. Existe como estrutura de dados. Qualquer mudança nesses números-base encerra o Plano atual (arquiva) e inicia um novo — não é editado no lugar. O Plano contém múltiplos Perfis de Dia de refeição — um conjunto de Refeições específico para cada padrão de dia da semana.
_Evitar_: programa, rotina, protocolo

**Plano Ativo**:
O Plano vigente do Usuário. Apenas um por Usuário em qualquer momento. Tem data de início; sem data de fim até ser arquivado.
_Evitar_: plano atual, plano em curso

**Plano Arquivado**:
Um Plano que já foi substituído. Mantém sua data de início e data de arquivamento, e todos os Registros de Aderência gerados durante sua vigência permanecem vinculados a ele. Consultável como histórico.
_Evitar_: plano antigo, plano inativo, plano descartado

**Período de Vigência**:
O intervalo de datas durante o qual um Plano foi (ou é) o Plano Ativo do Usuário. Definido por data de início e, para Planos Arquivados, data de arquivamento.
_Evitar_: duração, período do plano

**Era**:
Nome de **apresentação** de um Plano na tela de Histórico ("Suas eras") — cada Plano é um capítulo numerado da jornada do Usuário. Não é uma entidade nova: não existe no domínio, na persistência nem em nenhum tipo; é só como a UI chama um Plano quando o exibe como história vivida. A numeração é cronológica (era 1 = o Plano mais antigo) e não muda quando um novo Plano é criado.
_Evitar_: usar "Era" fora da UI de Histórico — em domínio, dados e código de motor, é Plano

**Usuário**:
A pessoa que possui Planos e gera Registros de Aderência. Pode ter um Plano Ativo e múltiplos Planos Arquivados. É o dono do Plano — mas não necessariamente quem o criou ou quem tem permissão para editá-lo (ver ADR-0004).
_Evitar_: pessoa, atleta, cliente

**Motor de Geração**:
O componente que produz um Plano a partir das especificações do Usuário. Opera em duas etapas: (1) cálculo determinístico de meta calórica e macros via TMB (Mifflin-St Jeor) + fator de atividade + ajuste por objetivo; (2) seleção de itens do Banco de Opções que satisfazem esses números e as preferências do Usuário. Sem IA generativa — mesmos inputs sempre produzem o mesmo Plano. O Plano gerado contém exatamente uma OpcaoDeRefeicao por Refeição (a mais próxima do alvo calórico). Parâmetros de ajuste calórico e distribuição de macros documentados em ADR-0011.
_Evitar_: gerador, algoritmo, calculadora de plano

**TMB** (Taxa Metabólica Basal):
O gasto calórico de repouso do Usuário, calculado pela fórmula Mifflin-St Jeor. Ponto de partida do cálculo de meta calórica do Motor de Geração.
_Evitar_: metabolismo basal, BMR

**Camada de Persistência**:
A abstração que isola "onde os dados moram" do restante da aplicação. Na Camada 1, usa IndexedDB local. Na Camada 2, será substituída por chamadas a um backend (provável Supabase) sem alterar lógica de negócio ou componentes. Toda leitura e escrita de dados passa por ela — nenhuma parte da aplicação acessa IndexedDB ou API diretamente.
_Evitar_: storage, banco de dados, persistence layer

**Banco de Opções**:
Conjunto curado de Opções de Refeição e exercícios mantido manualmente (não gerado por algoritmo nem por IA). É a fonte de conteúdo que o Motor de Geração usa para popular o Plano após calcular os números-base. Os macros das Opções de Refeição são estimativas calculadas a partir da tabela TACO 4ª edição — pendentes de revisão manual pelo usuário (ver `.scratch/revisao-macros-banco/issue.md`).
_Evitar_: biblioteca, catálogo, base de dados de alimentos

**Perfil de Dia**:
Agrupamento de Refeições que se aplica a um ou mais dias da semana com o mesmo padrão alimentar. Um Plano contém múltiplos Perfis de Dia: a UI exibe o Perfil correspondente ao dia atual usando `resolverPerfilDia`. Simétrico ao conceito de SessaoTreino, que agrupa exercícios por dia de treino. O Banco de Opções define quatro Perfis: CEDO (Seg/Qua/Qui), TERCA, SEXTA e FIM_DE_SEMANA (Sáb/Dom).
_Evitar_: cardápio do dia, template de dia, plano diário

**Refeição**:
Um slot de alimentação com horário definido, pertencente a um Perfil de Dia (ex: Café da manhã às 07:00 no perfil CEDO; Café da manhã às 08:30 no perfil TERCA). Contém uma ou mais Opções de Refeição, cada uma com macros precisos. O Motor de Geração seleciona exatamente uma Opção por slot ao montar o Plano.
_Evitar_: refeição livre (ambíguo com Refeição Livre), meal

**Opção de Refeição**:
Uma combinação específica de alimentos dentro de uma Refeição. Cada Opção tem valores canônicos de kcal, proteína, carboidrato e gordura.
_Evitar_: alternativa, variação

**SessaoTreino**:
A representação no Plano da sessão de musculação de um dia específico da semana. Contém SlotDeExercicio em sequência e uma flag indicando se há JJ naquele mesmo dia (com impacto em hidratação e orientação de cardio). SessaoTreino é o dado estruturado — Treino é o ato de realizá-la.
_Evitar_: treino do dia, plano de treino diário, workout

**SlotDeExercicio**:
Uma posição dentro de uma SessaoTreino que contém uma ou mais OpcaoDeExercicio. O Usuário escolhe uma das opções ao logar. Simétrico ao conceito de Refeição (que agrupa OpcaoDeRefeicao).
_Evitar_: exercício do treino, linha de treino, movimento

**OpcaoDeExercicio**:
Um Exercício específico disponível como alternativa dentro de um SlotDeExercicio (ex: "Supino reto com barra" ou "Supino com halteres" quando não há barra disponível). O Usuário escolhe uma ao logar o treino. Simétrico ao conceito de Opção de Refeição.
_Evitar_: exercício alternativo, substituto, variação

**Exercicio**:
Um exercício de musculação no Banco de Opções, com nome, GrupoMuscular(es) que trabalha, número de séries e Repetição prescrita. A prescrição (séries e Repetição) é fixa no Banco — não varia por Plano neste momento.
_Evitar_: movimento, atividade, exercício (sem maiúscula, que pode ser genérico)

**GrupoMuscular**:
Conjunto fechado (enum) dos grupos musculares reconhecidos pelo sistema. Usado pelo Motor de Geração para montar divisões de treino (ex: ABC). Valores: Peito, Tríceps, Costas, Bíceps, Ombros, Quadríceps, Glúteo, Isquiotibiais, Panturrilha, Abdômen.
_Evitar_: músculo (isolado), categoria, grupo (genérico)

**Repetição**:
A prescrição de repetições de um Exercicio. União discriminada com cinco variantes cobrindo todos os casos do Banco de Opções: **Faixa** `{ min, max }` para "8~10"; **Fixo** `{ valor }` para "20"; **Falha** para "até a falha/máximo"; **Tempo** `{ min, max }` em segundos para "30~45s"; **Pirâmide** `{ sequencia: number[] }` para "21 (7+7+7)" ou "12→15→20". Nunca string livre.
_Evitar_: reps (string), "8~10" (string), repetições como texto

**Registro de Aderência**:
O registro de um Usuário para um dia específico. Contém Registros de Refeição, consumo de água, conclusão de Treino/JJ e itens de Checklist. Sempre vinculado ao Plano Ativo na data do registro. É "como o Usuário jogou aquele dia dentro das regras do Plano" — nunca modifica o Plano. Tem dois carimbos de tempo: `data` (data do dispositivo no momento da criação — imutável) e `editado_em` (timestamp da última modificação — atualizado a cada edição). Pode ser editado retroativamente; `editado_em` preserva quando a edição aconteceu de fato.
_Evitar_: log do dia, diário, entrada diária

**Registro de Refeição**:
O registro diário do usuário para uma Refeição. Tem um Status (Seguiu / Não Seguiu), opcionalmente qual Opção de Refeição foi seguida, e opcionalmente valores reais de macros que sobrescrevem os valores da Opção para aquele dia.
_Evitar_: log de refeição, entrada

**Status de Refeição**:
Estado binário de um Registro de Refeição: **Seguiu** (o usuário fez a Refeição conforme o Plano) ou **Não Seguiu** (o usuário não fez ou substituiu). Não existe estado intermediário — desvios são capturados pelos macros reais opcionais.
_Evitar_: parcialmente, seguiu parcialmente

**Aderência**:
Medida diária de quanto o usuário seguiu o Plano nos quatro eixos: Refeições, Água, Treino e Checklist. É o dado central que o app coleta.
_Evitar_: compliance, consistência, disciplina

**Progresso**:
Variação de peso (e futuramente medidas corporais) ao longo do tempo. Funciona como sinal de validação de que a Aderência está funcionando — não é o objetivo primário do logging.
_Evitar_: resultado, evolução, transformação

**Treino**:
Sessão de musculação na academia. Distinto de JJ. Parte do Plano semanal.
_Evitar_: workout, sessão de treino, exercício (para a sessão inteira)

**JJ**:
Sessão de jiu-jitsu. Atividade física distinta do Treino, com impacto diferente em hidratação e caloria. Ocorre Seg/Qua/Sex.
_Evitar_: treino de jiu-jitsu, arte marcial (no contexto do Plano)

**Meta de Hidratação**:
O volume diário de água definido pelo Plano, calculado como 35 ml por kg de peso corporal. Valor fixo ao longo da Vigência do Plano — não varia por dia de treino ou JJ (ADR-0010). Armazenado em `meta_agua_diaria_ml`. O usuário registra o consumo real em `RegistroDeAderencia.agua_consumida_ml`.
_Evitar_: meta de água (ambíguo com "objetivo de água"), hidratação diária (sem âncora no Plano)

**Checklist**:
Lista de tarefas diárias de aderência que não pertencem a uma Refeição, Treino ou registro de Água. Marcável por dia. Quatro itens padrão aprovados como produto em `src/banco-opcoes/checklist.ts`: beber toda a água do dia, dormir pelo menos 7 horas, não pular nenhuma refeição, tomar creatina e vitaminas.
_Evitar_: tarefas, to-do, itens do dia
