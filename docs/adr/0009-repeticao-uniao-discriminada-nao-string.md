# Repetição é uma união discriminada de cinco variantes, não uma string livre

A prescrição de repetições de um Exercicio usa uma union type com cinco variantes — Faixa, Fixo, Falha, Tempo, Pirâmide — em vez de string livre. A razão: o Banco de Opções legado usava strings como "8~10", "máximo", "30~45s", "21 (7+7+7)" e "12→15→20", que são legíveis mas opacas — não é possível calcular totais de volume, validar inputs, ou exibir de forma adaptativa sem parsear strings frágeis. A union type torna cada caso explícito e permite cálculo de volume (séries × reps) nos casos Faixa, Fixo e Pirâmide, e exibição semântica nos casos Falha e Tempo.

O trade-off rejeitado: string livre é mais simples de escrever para conteúdo novo no Banco de Opções, mas transfere o custo para toda leitura dos dados. Com um Banco curado (não gerado dinamicamente), o custo de estruturar no momento da escrita é aceitável e pago uma vez.
