Tecnologias

HTML5 + CSS3 + JavaScript puro (sem frameworks)
PWA (Progressive Web App) — funciona offline e pode ser instalado no iPhone/Android
localStorage para persistência dos dados no dispositivo

Como usar localmente
bash# Qualquer um dos comandos abaixo inicia um servidor local
python3 -m http.server 8000
# ou
python -m http.server 8000
Acesse http://localhost:8000 no navegador.
Estrutura
rotina-sync/
├── index.html      # Estrutura e conteúdo
├── style.css       # Visual e responsividade mobile
├── script.js       # Lógica, interatividade e persistência
├── manifest.json   # Configuração PWA
├── sw.js           # Service Worker (cache offline)
└── icons/          # Ícones do app (192x192 e 512x512)
Instalação no iPhone (Safari)

Abra o link no Safari
Toque no botão de compartilhar (quadrado com seta)
Selecione "Adicionar à Tela de Início"
O app abre em tela cheia sem barra de endereços
