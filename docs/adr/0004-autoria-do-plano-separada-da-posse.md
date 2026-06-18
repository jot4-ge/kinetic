# Autoria do Plano é separada da posse — o modelo não assume que dono = editor

Na Camada 1, o Usuário é tanto o dono quanto o único capaz de gerar/editar seu Plano. Mas o domínio não modela "quem pode editar um Plano" como sendo implicitamente sempre o próprio Usuário. A razão: na Camada 2 (sem prazo definido), um Treinador/Nutricionista precisará poder revisar e ajustar Planos de outros Usuários. Modelar a edição como "só o dono acessa" hoje criaria acoplamento difícil de desfazer depois.

Na prática: o Plano tem um campo de autoria/autorização separado do campo de posse, mesmo que na Camada 1 os dois sempre apontem para o mesmo Usuário.
