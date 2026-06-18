# Persistência local usa IndexedDB com o schema final desde o início

A persistência local usa IndexedDB (não localStorage) porque o volume e a estrutura dos dados (Planos, Registros de Aderência diários, Banco de Opções) excedem o que localStorage suporta bem. Mais importante: o schema armazenado no IndexedDB é idêntico ao schema final do sistema multi-usuário — incluindo campos como `usuario_id` — mesmo que hoje só exista um único usuário local. Isso garante que a migração futura para um backend (provável Supabase) seja uma troca de onde os dados moram, não um redesenho do que os dados são.
