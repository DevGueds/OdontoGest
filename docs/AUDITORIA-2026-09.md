# Auditoria técnica e correções do OdontoGest

Período: 23 a 25 de setembro de 2026. Ambiente: Windows, MySQL80 local, aplicação em localhost:3000. Escopo: código disponível, esquema e configuração do banco, dependências, chamadas HTTP e fluxos de interface no Microsoft Edge.

## Resultado

O MVP possui os módulos centrais de gestão, mas a implementação original apresentava falhas críticas de autenticação e exposição de dados, além de inconsistências de estoque e persistência. As falhas descritas como corrigidas abaixo receberam alterações no código e validação automatizada. A instalação local também recebeu migrações, proteção das senhas e separação de privilégios no MySQL.

O resultado é uma base mais segura para continuar o desenvolvimento e o uso local. Não equivale a certificação, pentest exaustivo, garantia de ausência de vulnerabilidades ou adequação jurídica integral à LGPD. A revisão não incluiu rede corporativa, segurança física, sistema operacional completo, engenharia social ou serviços externos de produção.

O mapeamento usa a edição vigente [OWASP Top 10:2025](https://top10.owasp.org/2025/pt-BR/). A edição é relevante: a numeração das categorias mudou em relação a 2021.

## Falhas encontradas e tratamento

Severidades são avaliações técnicas desta revisão, sem pontuação CVSS formal.

| Severidade | Situação original e impacto | Correção aplicada | Evidência principal |
|---|---|---|---|
| Crítica | Fluxo OAuth local aceitava `user_id` sem autenticação prévia, permitindo assumir uma conta. | Removido o fluxo inseguro e qualquer login administrativo automático. Login consulta o banco e verifica a senha. | `src/server/app.ts`, testes de autenticação e remoção de OAuth. |
| Crítica | Leituras e exportação SQL acessíveis sem sessão; escritas sem autorização suficiente por perfil/unidade. | Autenticação nas rotas de negócio, autorização no servidor e filtros de unidade para solicitantes. Exportação e gestão de contas exclusivas do administrador. | Testes de chamadas diretas, perfis e acesso a outra unidade. |
| Crítica | Senhas em texto simples e expostas pelo cadastro/API/interface. | scrypt com sal aleatório, projeções de usuário sem senha/hash, remoção da coluna de senhas e troca obrigatória das credenciais legadas. | Banco real: zero senhas legadas; testes de respostas, login e troca. |
| Alta | Exceções do MySQL acionavam armazenamento em memória, inclusive para operações que pareciam salvas. | Removido o fallback; indisponibilidade retorna erro e a interface mantém os dados digitados. | Falha simulada de banco/API, sem sucesso fictício. |
| Alta | Atendimento podia descontar estoque parcialmente, duas vezes ou além do disponível; transições eram pouco controladas. | Transação com bloqueio do pedido, decremento condicional, cálculo da diferença atendida, validação de itens e estados, estorno único no cancelamento. | Concorrência real no MySQL, rollback de múltiplos itens e repetição de atendimento. |
| Alta | Preço enviado pelo navegador e numeração por contagem permitiam inconsistência/falsificação. | Preço e natureza obtidos do catálogo, snapshot no item, totais Decimal e número baseado no ID único do pedido. Responsável pela solicitação deriva da conta autenticada. | Testes de preço adulterado, limite, item duplicado e natureza histórica. |
| Alta | CORS amplo, segredo fixo, login sem proteção CSRF e ausência de limites. | Origens explícitas, segredo aleatório, cookies assinados HttpOnly/SameSite, CSRF em todas as escritas e limites de tentativas/requisições. | Testes de cookies, origem, CSRF e limitação do login. |
| Alta | Interpolação de conteúdo em impressão/exportação podia inserir HTML, fórmulas de planilha ou SQL. | Escape por contexto, CSV com neutralização de fórmulas e SQL com literais hexadecimais UTF-8; remoção de handlers inline e CSP. | Casos maliciosos nos testes de exportação e renderização no navegador. |
| Alta | Aplicação utilizava root no MySQL e havia dependências com alertas conhecidos. | Conta restrita por tabela, credencial de migração separada, atualização de pacotes e override transitivo validado. | Verificação de privilégios; `npm audit` passou de 7 alertas (6 altos/1 moderado) para zero. |
| Média | Natureza do material não persistia corretamente e consolidação financeira podia usar memória. | Persistência e snapshot de natureza; consolidação no banco; somente manutenção concluída entra como despesa realizada. | Testes de pedidos, manutenção e consolidação. |
| Média | Equipamento e chamado podiam ter unidades incoerentes; manutenção avançava sem aprovação. | Validação de vínculo sob transação, aprovação administrativa e sequência de estados. Preventiva concluída atualiza a data do equipamento. | Testes de vínculo e ciclo de manutenção. |
| Média | Ajuste simultâneo de estoque podia sobrescrever uma alteração recente; estoque zero virava valor padrão. | Ajuste compara quantidade anterior, rejeita conflito e aceita zero. Novos materiais começam com zero se não informado. | Testes de conflito e validação. |
| Média | Datas SQL eram exibidas no dia anterior; formulários perdiam preenchimento em falhas. | Tratamento explícito de datas de calendário, fuso São Paulo para o dia corrente e fechamento/limpeza somente após confirmação de sucesso. | Testes de virada de dia e erro ao salvar no navegador. |
| Média | Ausência de trilha de segurança, erro técnico exposto e arquivos/fontes externos. | Eventos mínimos de auditoria, respostas genéricas com identificador, logs sem corpo/credenciais e fontes/ícones locais. | Testes de auditoria, erro e zero requisições externas no cenário de navegador. |

## Funcionalidade e regras consolidadas

### Permissões

As restrições são aplicadas na API; ocultar um botão não é usado como controle de acesso.

| Perfil | Consultas | Alterações permitidas |
|---|---|---|
| ADMINISTRADOR | Operação global, financeiro e usuários. | Cadastros, estoque, todo o fluxo de pedidos, manutenção, recursos, usuários e exportação SQL. |
| GESTOR | Operação e financeiro globais; sem lista de contas ou exportação SQL. | Perfil de consulta nesta implementação. |
| SOLICITANTE | Catálogo; unidade, pedidos, equipamentos e chamados da própria unidade. | Criar pedido/chamado na própria unidade; cancelar pedido da unidade ainda SOLICITADO. |
| TECNICO | Unidades/equipamentos e chamados aprovados, em andamento ou concluídos. | Avançar chamado aprovado para EM_ANDAMENTO e depois CONCLUIDO; informar custo. |

O vínculo é por unidade, não por autor individual: solicitantes da mesma unidade compartilham seus pedidos. Técnicos têm acesso global aos equipamentos e chamados aprovados, conforme o modelo existente, sem atribuição individual de chamado. Se a operação precisar de atribuição por técnico, será necessário acrescentar esse vínculo.

### Pedidos e estoque

O fluxo controlado é `SOLICITADO → RECEBIDO → ATENDIDO_PARCIAL/ATENDIDO_TOTAL → ENVIADO`. Um atendimento zerado retorna a RECEBIDO; ajustes acumulados podem ocorrer antes do envio. Cancelamento administrativo é permitido antes do envio e devolve ao estoque o que já havia sido atendido. Pedidos enviados/cancelados não podem ser reabertos pelo mesmo fluxo.

A quantidade de atendimento enviada representa o total acumulado do item, não um novo acréscimo. Exemplo: atender 3 e depois 5 desconta 3 e depois 2; repetir 5 não desconta novamente. Se outro pedido consumir o saldo antes, a segunda operação falha integralmente com conflito, sem estoque negativo. Um ajuste manual também informa o saldo que o operador visualizou, impedindo sobrescrita silenciosa.

O pedido guarda preço e natureza do material no momento da criação. Alterações posteriores de catálogo não reescrevem esses valores históricos. Os nomes informados para recebimento/envio identificam os responsáveis operacionais; a conta que registrou a ação fica separadamente na auditoria.

### Manutenção, financeiro e interface

Chamados seguem `ABERTO → APROVADO_ADM → EM_ANDAMENTO → CONCLUIDO`, ou `ABERTO → RECUSADO`. A conclusão de preventiva atualiza sua data no equipamento. Transferir equipamento com histórico foi bloqueado para não reatribuir silenciosamente custos e chamados.

A consolidação soma materiais atendidos de pedidos não cancelados, honorários registrados e reparos concluídos. Honorários e pedidos têm totais calculados pelo servidor. Os recursos mantêm natureza de custeio/investimento. A seleção de material usa o registro efetivo de estoque, sem agrupar fornecedores/registros e escolher um ID arbitrário.

Formulários preservam o preenchimento em falhas; mensagens de carregamento e erro são visíveis. Saída, troca de senha e mudança de sessão limpam os dados da conta anterior. Assinaturas pessoais fixas nos documentos foram substituídas por indicações de função.

## Segurança por categoria OWASP 2025

| Categoria | Controles e limites observados |
|---|---|
| A01 — Acesso | Autenticação, perfis no servidor, escopo de unidade, proteção de exportação/contas e testes de acesso indevido. |
| A02 — Configuração | Bind local, origens permitidas, limite de corpo/tempo, CSP/headers, segredo externo e separação da conexão de migração. HTTPS é exigido na configuração de produção. |
| A03 — Cadeia de software | Lockfile, atualização de dependências, auditoria npm sem alertas na data da verificação e build/testes após atualização. Isso não avalia integralmente todos os fornecedores. |
| A04 — Criptografia | scrypt com sal de 16 bytes, N=32768/r=8/p=3; comparação constante; cookies assinados; cópia local DPAPI. Cookies Secure em produção. O banco em disco não recebeu criptografia integral. |
| A05 — Injeção | Validação estrita, consultas parametrizadas, identificadores SQL vindos de listas constantes, escape HTML/CSV/SQL e CSP. |
| A06 — Projeto | Estados explícitos, transações, estoque condicional, preços confiáveis, senha inicial obrigatória e proteção do último administrador. |
| A07 — Autenticação | Remoção de impersonação OAuth, erros genéricos, limitação por IP/conta, sessões aleatórias com expiração, rotação/revogação e confirmação da senha atual. MFA ainda não implementado. |
| A08 — Integridade | Migrações versionadas, chaves estrangeiras, índices, CHECKs de quantidades/valores, unicidade de item e atualização atômica. Sem pipeline de assinatura de artefatos. |
| A09 — Auditoria | Intenção persistida antes de escritas autorizadas, resultado posterior, eventos de negação e identificador de requisição; sem senhas/corpos nos eventos. Não há central de alertas nem log imutável externo. |
| A10 — Exceções | Banco indisponível bloqueia a operação, transações revertem falhas e erros ao cliente não incluem stack/conexão. Cache não memoriza rejeições. |

A escolha dos parâmetros de senha segue uma configuração publicada pela [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Limites atuais: 300 requisições/minuto/IP; login 15/15 minutos/IP e 10 tentativas falhas/conta/15 minutos; troca de senha 6/15 minutos; exportação 3/minuto. Sessões: até 5 por usuário, 5.000 no processo, 30 minutos de inatividade e 8 horas absolutas. Todos esses limites são locais ao processo.

## Privacidade e LGPD

O sistema contém dados pessoais mesmo sem prontuários: nomes, e-mails, função/registro profissional, unidade de trabalho, responsáveis por pedidos e dados de honorários. Campos livres podem receber dados indevidos; o aviso de privacidade orienta não cadastrar pacientes ou diagnósticos.

| Conjunto | Finalidade operacional | Proteção aplicada |
|---|---|---|
| Contas e credenciais | Identificação e controle de acesso. | Hash de senha, acesso administrativo, cookies essenciais e revogação de sessões. |
| Pedidos/responsáveis | Solicitação, atendimento e movimentação de materiais. | Escopo por unidade/perfil, escape de relatórios e acesso autenticado. |
| Honorários e registros profissionais | Gestão de despesas. | Consulta restrita a gestor/administrador e ausência de persistência no armazenamento local do navegador. |
| Auditoria | Rastrear operação e resultado. | ID do ator/recurso, data, ação, resultado e ID de requisição, sem conteúdo integral ou credenciais. |
| Exportações/cópias | Operação e recuperação local. | Exportação administrativa sem contas; snapshot de recuperação criptografado e arquivos locais fora do Git. |

Os controles apoiam os princípios de necessidade, segurança e prevenção e as medidas de proteção previstas na [LGPD, especialmente arts. 6º e 46](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm). A base legal de cada finalidade, o atendimento de direitos e os prazos de conservação precisam ser definidos pelo controlador. Não foi presumido consentimento como base universal, nem feita exclusão automática de históricos sujeitos a conservação.

Decisões organizacionais pendentes: identificar controlador e canal de privacidade; registrar finalidades e bases legais; definir retenção para contas, históricos, auditoria e backups; estabelecer procedimentos de acesso/correção/eliminação quando cabíveis, resposta a incidentes, revisão de acessos e treinamento. O aviso atual informa esses limites; deve receber os dados institucionais antes de publicação. O [guia de segurança da ANPD](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/processo-guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte.pdf) oferece referência operacional, sem pressupor o enquadramento jurídico da organização como agente de pequeno porte.

## Desempenho e economia de requisições

Não foram identificadas integrações de API pagas no fluxo analisado. A economia implementada é de chamadas à API própria, consultas MySQL, transferência de arquivos e trabalho repetido.

| Medida | Comportamento e resultado |
|---|---|
| Cache no navegador | TTL de 15 segundos, máximo de 100 entradas, compartilhamento de GETs em andamento e invalidação por recurso após escrita. Limpeza/abort em mudança de sessão impede reutilizar respostas de outra conta. |
| Cache no servidor | TTL de 15 segundos, máximo de 200 entradas, chave por recurso/perfil/unidade/página, compartilhamento de consultas em andamento e invalidação após escrita. Falhas não ficam armazenadas. |
| Autorização atual | Usuário e permissões continuam sendo consultados no banco a cada requisição protegida, antes do cache. A economia não adia a revogação de acesso. |
| Busca de dados | Listas de negócio paginadas por cursor, até 200 registros por resposta, com índices para filtros/vínculos. Carregamento inicial varia por perfil; usuários só são buscados para administrador. |
| Financeiro | Consolidação da API utiliza quatro consultas agrupadas, sem uma consulta adicional por unidade, em snapshot consistente. |
| Interface | Abas carregadas sob demanda com React.lazy. No build medido, JS inicial passou de 371,80 kB (97,91 kB gzip) para 281,74 kB (82,22 kB gzip), aproximadamente 24% e 16% menores. São medidas de uma etapa intermediária versus o build otimizado, não benchmark completo contra o primeiro estado do projeto. |
| Arquivos estáticos | Brotli/gzip gerados no build e cache immutable de um ano para assets com hash; HTML revalidável. Isso evita compressão repetida em runtime e baixa novamente somente assets alterados. |
| Recursos locais | Fontes e ícones empacotados localmente; nenhuma consulta Google Fonts/CDN no cenário testado. |
| Escritas | Requisições idênticas simultâneas na mesma instância da interface são reunidas; sem retry automático de mutações. Não constitui idempotência persistente entre dispositivos/reinícios. |

No teste de navegador, percorrer as abas após o carregamento não gerou novas consultas de dados. O cenário completo de login, navegação, tentativa de gravação com falha e logout registrou 22 chamadas de API e zero chamadas externas.

As duas camadas de cache podem compor uma defasagem próxima de 30 segundos entre usuários em uma nova leitura, além do tempo de requisição. A tela já aberta não recebe atualização por push; ao voltar o foco ocorre recarga. Escritas na própria sessão invalidam o cache correspondente imediatamente. Estoque e autorização são revalidados no servidor, independentemente da informação exibida. API usa `Cache-Control: no-store, private`, sem cache HTTP de dados pessoais.

O cliente ainda reúne todas as páginas dos conjuntos que carrega. Para grande volume, a próxima etapa é paginação/filtro de tela no servidor, agregações por período e carregamento de dados ao abrir cada módulo. Os números acima não demonstram capacidade para centenas de usuários: não foi executado teste de carga sustentada.

## Banco, migrações e preservação

Antes das alterações, havia 3 unidades, 15 materiais, 0 pedidos e 2 usuários, sem administrador persistido. Ao término, os mesmos cadastros operacionais permanecem e há 3 usuários, incluindo o administrador inicial criado para operação segura. O catálogo foi comparado à cópia anterior, incluindo IDs, descrições, unidades de medida, fornecedores e quantidades, sem diferenças. Não foram criados pedidos de teste na base de trabalho.

As migrações adicionaram a exigência de troca de senha, natureza histórica do item, auditoria, índices, chave de unidade em entradas, unicidade de item por pedido e restrições de quantidades/valores. O baseline existente foi confrontado com o esquema antes de registrar a migração inicial como aplicada. A codificação da migração inicial foi normalizada para UTF-8 e a aplicação em banco vazio foi testada. A comparação final de esquema não indicou diferenças pendentes.

O usuário runtime tem CRUD nas nove tabelas operacionais e SELECT/INSERT/UPDATE em auditoria, sem DELETE nessa tabela e sem privilégios DDL. A conta administrativa fica em `.env.migrate`; o servidor não carrega esse arquivo. `.env`, `.env.migrate` e `.local` receberam permissões restritas ao usuário Windows atual.

Foi criada uma cópia local anterior às mudanças com DPAPI. Uma diferença de codificação do transporte PowerShell foi identificada, revertida a partir dos bytes originais e conferida contra o catálogo preservado; a cópia conferida é `.local/backup-antes-auditoria-utf8.dpapi`. O script agora transporta o JSON por base64, preservando UTF-8. O verificador comprova descriptografia e conteúdo, não uma restauração completa. O original foi mantido como artefato de recuperação local.

Também foi criada e validada uma cópia após as correções: `.local/backup-2026-09-25T10-53-56-465Z.dpapi`.

## Validação executada

| Verificação | Resultado |
|---|---|
| TypeScript e build de interface | Concluídos sem erro; assets comprimidos gerados. |
| Testes unitários | 7 aprovados: senhas, cache/coalescência/invalidação, cancelamento entre sessões, injeção em exportação, validação e datas. |
| Integração MySQL/API/navegador | 13 aprovados, em banco temporário isolado com migrações reais. |
| Concorrência | Dois pedidos disputam estoque sem saldo negativo; falha em um item reverte os demais; repetição não desconta duas vezes. |
| Interface no Edge | Login, abas, perfis, ausência de chamadas externas, cache, preservação de formulário em erro e limpeza após logout. |
| Dependências | Zero vulnerabilidades reportadas pelo npm audit na verificação. Não é prova de ausência de vulnerabilidades desconhecidas. |
| Configuração real | MySQL80 ativo; aplicação sem root/DDL; zero senhas legadas; zero estoques negativos. |
| Migrações e catálogo | Esquema consistente; catálogo original preservado, inclusive acentuação. |
| Instalação final em localhost:3000 | Interface e saúde da API responderam HTTP 200. Edge confirmou login administrativo, troca inicial obrigatória, bloqueio de dados antes da troca e logout; zero erros de página ou requisições externas. A senha temporária não foi alterada pelo teste. |

Comandos reproduzíveis e requisitos estão no [README](../README.md). Testes cobrem os cenários implementados; não afirmam cobertura integral de toda combinação possível de regras.

## Limitações e evolução priorizada

| Prioridade/contexto | Trabalho restante | Motivo |
|---|---|---|
| Antes de publicação externa | TLS, proxy confiável, implantação segregada, gestão/rotação de segredos e monitoramento com alertas. | A entrega atual é local; não publica o serviço na internet. |
| Antes de uso institucional definitivo | Plano de backup externo criptografado com restauração comprovada e política de retenção. | Snapshot DPAPI depende do perfil Windows; exportação operacional não contém tudo necessário para recuperação. |
| Governança LGPD | Preencher dados do controlador/canal, bases legais, prazos e procedimentos. | Essas decisões não podem ser inferidas com segurança pelo código. |
| Rastreabilidade ampliada | Livro de movimentações com saldo anterior/posterior, motivo e evento transacional; histórico de edição e trilha protegida externamente. | A auditoria atual registra ação/resultado, sem reconstruir todo valor alterado. Intenção pode ficar com resultado 0 se o processo cair; o usuário runtime ainda pode atualizar eventos. |
| Materiais odontológicos | Lotes, validade, entrada física documentada, inventário, devolução após envio e rastreabilidade por unidade. | O modelo atual controla saldo agregado. O MVP não atende sozinho a rastreabilidade de insumos por lote. |
| Financeiro | Definir competência/caixa, conciliação e correção/estorno de lançamentos, período de análise e regras de duplicidade de honorários. | São registros gerenciais; não representam contabilidade ou folha homologadas. Recorrência classifica o aporte; não cria automaticamente créditos futuros. |
| Catálogo histórico | Snapshot de descrição/unidade do material, se documentos precisarem reproduzir exatamente a redação original. | Preço/natureza já são históricos; descrição/unidade ainda usam o catálogo associado. |
| Contas privilegiadas | MFA/SSO e recuperação de acesso institucional, com revisão de permissões. | O fluxo atual usa senha e recuperação pelo administrador local. |
| Escala | Paginação visual, agregação por período, métricas de queries e teste de carga; armazenamento compartilhado se houver múltiplos processos. | Cache, sessão e rate limit atuais funcionam em um processo; a interface ainda reúne páginas. |
| Disponibilidade de catálogo grande | Paginar usuários/alertas de preventiva e exportar em fluxo ou tarefa assíncrona. | Usuários ainda não são paginados; alertas limitam a 500; exportação monta conteúdo em memória. |

Esses itens distinguem controles entregues de capacidades adicionais e decisões operacionais. Não foram realizadas exclusões de históricos, mudanças arbitrárias de retenção ou publicação externa do sistema.
