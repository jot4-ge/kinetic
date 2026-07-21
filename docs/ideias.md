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
