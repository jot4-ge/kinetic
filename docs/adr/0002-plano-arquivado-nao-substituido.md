# Planos são arquivados, não substituídos

Quando o usuário muda de fase (ex: cutting → manutenção), o Plano anterior recebe uma data de arquivamento e permanece consultável com todos os seus Registros de Aderência vinculados. Consideramos simplesmente sobrescrever o Plano ativo, mas isso destruiria a capacidade de calcular métricas históricas por fase ("nesse cutting de X semanas, segui Y% das refeições e perdi Z kg"). O vínculo entre Registro de Aderência e o Plano vigente na época é o que torna esse histórico possível.
