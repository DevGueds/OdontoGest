# Revisão do frontend e senha mínima

Revisão complementar de setembro de 2026, atendendo à solicitação de senha mínima de 8 caracteres e correção integral dos problemas de apresentação encontrados no frontend.

## Alterações entregues

| Área | Problema encontrado | Correção |
|---|---|---|
| Política de senha | Validação exigia 15 caracteres. | Mínimo de 8 e máximo de 128 no servidor, troca de senha, criação e edição de usuários. Mensagens e documentação atualizadas. |
| Privacidade | Modal era descendente do cartão de login transformado por CSS, usando esse cartão como referência e ultrapassando seus limites. | Componente de modal compartilhado renderiza as janelas diretamente no body por portal. Privacidade ganhou seções, título, espaçamento, destaque informativo e botão de conclusão. |
| Primeiro acesso | Rótulos e campos sem grupos/espaçamento, aparência diferente das demais telas. | Formulário próprio com hierarquia visual, campos de largura completa, confirmação de senha, botões para mostrar/ocultar e erros apresentados junto ao formulário. |
| Modais gerais | Posicionamento dependia de cabeçalhos/cartões com transform ou backdrop-filter; rolagem podia afetar a janela inteira. | Todos os modais utilizam a mesma estrutura. Cabeçalho permanece acessível e o conteúdo rola internamente, respeitando altura e largura da janela, inclusive no modo paisagem. |
| Teclado | Foco podia permanecer atrás da janela. | Diálogo identificado, conteúdo de fundo inativo, foco restrito ao modal ativo, retorno ao elemento anterior e Escape para fechar janelas dispensáveis. A troca inicial continua obrigatória. |
| Cabeçalho | Muitos controles e nome de usuário longo disputavam espaço. | Quebra organizada, nome com limite visual e menu “Opções” no celular para acessar controles da conta/relatórios sem ocupar toda a tela. |
| Navegação | Barra lateral usava altura fixa do cabeçalho e podia cobrir botões depois da seleção. | Altura acompanhada por ResizeObserver; seleção transfere foco ao conteúdo e reinicia a rolagem. No celular, navegação inferior rolável com rótulos e espaço reservado no conteúdo. |
| Cards financeiros | Colunas mínimas fixas, legendas em três colunas e valores excediam cards estreitos. | Grids limitadas ao espaço disponível, legendas reorganizadas por largura e linhas de orçamento com quebra adequada. |
| Formulários | Campos e seletores ultrapassavam seus grupos; campo de senha ficava com largura incorreta; ações podiam se sobrepor. | Larguras e mínimos consistentes, grupos responsivos, botões com quebra, campos de senha corrigidos e rótulos de campos adicionados. |
| Tabelas | Textos/status/botões podiam quebrar letra por letra ou comprimir demais as colunas. | Largura mínima legível e rolagem horizontal no contêiner da tabela, sem alargar a página. Indicação de rolagem no celular. |
| Ficha PBS | Estilos essenciais da tabela existiam apenas para impressão. | Prévia também recebe bordas, espaçamento e largura de documento; permanece rolável no celular e preserva regras de impressão. |
| Coerência de ações | Gestor via cancelamento sem autorização; envio aparecia antes do atendimento; preço do catálogo era editável na solicitação. | Botões alinhados às regras da API; preço apenas para leitura; quantidade atendida limitada ao menor valor entre pedido e disponibilidade. |
| Textos e estados | Menções incorretas ao perfil Gestor, termos técnicos em carregamento e datas ISO visíveis. | Textos ajustados às funções da tela, carregamento simplificado, erro de login anunciado e datas de manutenção em formato brasileiro. |
| Build no Windows | Regenerar Prisma em todo build tentava substituir uma DLL usada pelo servidor em execução. | Geração do cliente na instalação ou pelo comando explícito `prisma:generate`; build de frontend pode ocorrer com o serviço ativo. |

Senhas existentes não foram modificadas nesta revisão. A proteção por hash, o limite de tentativas e a troca obrigatória de credenciais temporárias continuam ativos.

## Telas verificadas

Login, privacidade antes/depois do login, troca inicial e voluntária de senha, dashboard, central de atendimento, novo pedido, aportes/orçamento, honorários, catálogo de materiais/unidades, usuários e equipamentos/manutenção.

Também foram percorridos os formulários de cadastro/edição, ajuste de estoque, recebimento, atendimento, envio, ficha PBS, relatório, reparo, preventiva e atualização de chamado. A navegação foi conferida nos perfis administrador, gestor, solicitante e técnico, com dados fictícios que incluem nomes e descrições longos.

## Validação e evidências

O teste `npm run test:frontend` utiliza MySQL temporário e navegador Microsoft Edge. Ele cria seu próprio banco, aplica as migrações, executa os cenários e remove esse banco ao concluir. Nenhum cadastro de teste é gravado na base de trabalho.

| Resolução | Contexto |
|---|---|
| 1440 × 900 | Desktop |
| 1024 × 768 | Notebook/tela menor |
| 768 × 1024 | Tablet retrato |
| 390 × 844 | Celular retrato |
| 320 × 740 | Celular estreito |
| 844 × 390 | Janela baixa/modo paisagem |

Foram geradas 327 capturas em `.local/frontend-review`. A verificação mede excesso de largura na página/cards/formulários, limites dos modais, isolamento do foco, fechamento por teclado e erros de JavaScript. Testa ainda confirmação incorreta de senha, alteração real com exatamente 8 caracteres e novo login com essa senha.

Resultado final: nenhum problema de layout detectado por essas verificações e nenhum erro de página ou chamada externa no cenário. Os 7 testes unitários e 13 testes de integração da aplicação também passaram, assim como TypeScript e build. O JSON de evidências fica em `.local/frontend-review/findings.json`.

As capturas e a revisão visual complementam as verificações automáticas; não representam teste de todos os navegadores/dispositivos físicos nem certificação de acessibilidade. Tabelas extensas e a ficha de impressão utilizam rolagem horizontal dentro de seus próprios contêineres, preservando a legibilidade das colunas.

Para conferir localmente, recarregue `http://localhost:3000` e faça login novamente após a atualização do servidor. No celular, o botão “Opções” abre os controles de conta, privacidade, senha e exportações disponíveis para o perfil.
