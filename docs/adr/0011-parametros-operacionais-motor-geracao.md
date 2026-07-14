# Parâmetros operacionais do Motor de Geração: ajustes calóricos, macros e seleção de refeições

## Ajustes calóricos por objetivo

Cutting: −18% do TDEE (centro do range 15–20% recomendado para déficit moderado — preserva massa muscular em atletas de força sem estender o ciclo). Bulk: +12% (lean bulk — abaixo do teto de +15% para minimizar acúmulo de gordura). Manutenção e Recomposição: sem ajuste calórico (split de macros diferente, kcal_meta = TDEE).

## Proteína e piso de gordura

Proteína calculada por objetivo: 2,2 g/kg em Cutting e Recomposição (teto da faixa recomendada — preservação de massa em déficit ou neutro); 2,0 g/kg em Manutenção (homeostase muscular); 1,8 g/kg em Bulk (o superávit calórico já estimula síntese proteica — proteína adicional deslocaria carboidrato sem ganho fisiológico). Piso de gordura fixado em 0,8 g/kg — acima do mínimo fisiológico publicado (0,6–0,7 g/kg) para dar margem a flutuações sem comprometer funções hormonais. Carboidrato preenche as calorias restantes após proteína e gordura.

## Seleção de Opções de Refeição

O Motor distribui `kcal_meta` igualmente entre os slots de Refeição (`kcal_meta ÷ n_refeições`) e seleciona a OpcaoDeRefeicao com kcal mais próximo desse alvo por proximidade absoluta, gerando um Plano com exatamente uma Opção por Refeição. Distribuição proporcional (ex: 25% no café, 30% no almoço) foi rejeitada: os pesos exatos não estão definidos no produto, e o Banco foi curado com opções de kcal aproximadamente equivalentes entre slots — forçar pesos diferentes criaria distorção na seleção sem benefício real. Tiebreak por posição de declaração no array do Banco garante determinismo sem estado adicional.

## Distribuição calórica por Perfil de Dia (ADR-0012)

O cálculo kcal_por_slot é per-perfil: cada Perfil de Dia divide kcal_meta pelo número de slots daquele perfil especificamente. Com quatro perfis de 4, 5 e 6 slots, os totais diários resultantes diferem entre si.

meta_calorica_diaria é uma meta de referência usada como base de cálculo, não um piso absoluto garantido em todos os dias da semana. O total real consumido varia por perfil porque o gasto energético também varia: dias com academia de manhã (CEDO: Seg/Qua/Qui, 6 slots) geram maior ingestão que dias de repouso (TERCA, 4 slots) ou com atividade apenas à tarde (SEXTA e FIM_DE_SEMANA, 4–5 slots). Essa variação não é o Motor falhando em atingir a meta — é a meta sendo distribuída de forma não-uniforme por design, espelhando o gasto real da semana. A meta_calorica_diaria permanece o parâmetro correto para calcular metas de macros e monitorar aderência média semanal. Para distribuição uniforme entre dias, seria necessário um Banco com opções de densidade calórica proporcionalmente maior nos perfis de menos slots — decisão explicitamente rejeitada (itens do Banco de dias menos ativos têm porções menores por design). Na prática, o Usuário come de forma mais robusta nos dias de Treino com academia pela manhã e de forma mais leve na Terça (sem atividade) e nos fins de semana — variação intencional que reflete o gasto semanal real e não requer ajuste manual.
