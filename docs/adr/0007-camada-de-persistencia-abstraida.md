# A Camada de Persistência é abstraída do restante da aplicação

Nenhuma parte da aplicação (lógica de negócio, Motor de Geração, componentes de UI) acessa IndexedDB ou APIs de backend diretamente. Toda leitura e escrita passa pela Camada de Persistência, que expõe uma interface de repositório agnóstica ao storage subjacente. Quando o backend for introduzido, somente a implementação da Camada de Persistência muda — o resto da aplicação não sabe nem precisa saber que a troca aconteceu.
