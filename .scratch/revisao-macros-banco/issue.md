---
slug: revisao-macros-banco
title: Revisar macros estimados do Banco de Opções (refeicoes.ts)
labels: [needs-info]
---

Os macros de todas as OpcaoDeRefeicao em `src/banco-opcoes/refeicoes.ts` foram calculados a partir da tabela TACO 4ª edição durante a migração do legado. O legado armazenava apenas um total de kcal aproximado por cartão de refeição — os valores de proteína, carboidrato e gordura foram derivados das listas de ingredientes e são estimativas.

**O que revisar:** para cada OpcaoDeRefeicao em REFEICOES_CEDO, REFEICOES_TARDE e REFEICOES_SABADO, validar `kcal`, `proteina_g`, `carboidrato_g` e `gordura_g` contra pesagens reais ou fontes primárias dos ingredientes.

**Impacto enquanto não revisado:** os macros do Plano (meta vs. real no Registro de Aderência) podem divergir sistematicamente; usuário pode observar aderência aparente sem atingir as metas reais.

**Escopo:** apenas `src/banco-opcoes/refeicoes.ts` — exercícios não têm macros.
