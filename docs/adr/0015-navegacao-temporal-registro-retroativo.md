# Navegação temporal: registro retroativo de qualquer dia, no Plano vigente na data

A UI permite ver e editar o Registro de Aderência de **qualquer dia passado**, não só o dia atual, através de um calendário. Isso concretiza a capacidade que o [ADR-0008](0008-dois-carimbos-de-tempo-no-registro.md) já desenhou (dois carimbos de tempo) e refina a intenção dele: `data` é o dia a que o Registro **pertence** (imutável), não necessariamente o instante da criação — um Registro pode ser criado retroativamente para um dia anterior.

**Sem limite de prazo.** Não se restringe quão antigo um dia editável pode ser: `editado_em` já preserva a informação real de quando cada edição aconteceu (ADR-0008), então limitar prazo criaria fricção sem ganho de integridade.

**`editado_em` distingue registro ao vivo de retroativo.** A regra de carimbo passa a ser: `editado_em` permanece nulo **apenas** para um Registro gravado ao vivo no próprio dia (`data == hoje`) e nunca editado desde então. Toda escrita retroativa — inclusive a **primeira** gravação de um dia passado — preenche `editado_em` com o instante atual. Assim, um dia esquecido e preenchido depois nunca se confunde com um dia registrado na hora.

**O Plano da data é o vigente naquela data, não o Plano Ativo de hoje** (ADR-0002/0003). Resolução:

- Se o dia **já tem** Registro, seu `plano_id` imutável é a autoridade — o Registro é exibido/editado no Plano ao qual foi vinculado, mesmo que esse Plano esteja hoje arquivado.
- Se o dia **não tem** Registro, resolve-se o Plano vigente na data: o Plano de maior `inicio` menor-ou-igual à data (empate de `inicio` — regeneração no mesmo dia — desempata por `criado_em`, o mais recente vencendo, coerente com o Plano que passou a Ativo naquele dia).
- Datas **anteriores ao primeiro Plano** não têm Plano vigente: a tela do dia trata isso com clareza (nada a registrar), sem permitir edição.

Dias **futuros** não são editáveis — não se registra o que ainda não aconteceu. O calendário os exibe desabilitados; a rota do dia recusa uma data futura.

**Reúso, não duplicação.** A experiência de registro (refeições, água, treino/JJ, checklist) é um único componente parametrizado por data + Plano + Registro existente. A tela "hoje" e a tela de um dia qualquer diferem só na resolução de contexto (hoje + Plano Ativo via caminho rápido; data + Plano por vigência), não na UI de edição.
