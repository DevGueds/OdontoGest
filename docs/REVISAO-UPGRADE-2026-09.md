# Revisão de compatibilidade da atualização

Data: 26/09/2026. Comparação: `main`/`origin/main` em `f632233` com `changes-review-23092026-v1-erp-integration`/remota em `e8b3219`, incluindo `a903401`. As referências remotas foram atualizadas antes da comparação. Ambiente do ensaio: MySQL 8.0.46, Prisma 6.19.3 e Node.js 24.19.0 no Windows.

## Parecer

**A migration preservou os dados compatíveis nos ensaios, mas a atualização não é transparente para qualquer instalação antiga. Fazer somente o merge e iniciar a aplicação pode interromper o acesso e a operação.** Há pré-condições de dados, autenticação e configuração que precisam ser atendidas antes da liberação.

Não foi feito merge, push, reset de banco nem migração na base em uso nesta revisão. As alterações produzidas são ferramentas de verificação, testes e documentação. Nenhuma migration histórica ou regra de negócio foi reescrita.

O banco local consultado já possui as duas migrations concluídas, sem os conflitos de dados pesquisados. Possui 3 unidades, 15 materiais, 3 usuários e nenhum pedido, item, honorário, equipamento, chamado ou entrada de recurso. Portanto, ele não comprova sozinho a compatibilidade com uma instalação antiga que já tenha movimentação. Os ensaios complementares preencheram as nove tabelas antigas e exercitaram seus fluxos.

**Pendência da configuração atual:** `scripts/check-local.ts` retornou `runtimeUsesRoot: true` e `runtimeHasDDL: true`. O `.env` deste checkout contém conexão root; não havia `DATABASE_URL` herdada sobrepondo esse arquivo. Isso diverge da configuração restrita descrita na auditoria anterior. É um risco de segurança, independentemente da compatibilidade da migration. A conexão não foi modificada por esta revisão. As conexões de aplicação e migração apontam para o mesmo host, porta e banco.

## Achados que condicionam a atualização

### 1. Alta — dados aceitos pela versão antiga interrompem a migration

Arquivo: `prisma/migrations/20260923204000_security_integrity/migration.sql`, linhas 6 e 12–14.

O código antigo criava os itens recebidos sem eliminar materiais repetidos. O atendimento descontava estoque sem condição de disponibilidade, sem uma transação abrangendo todo o pedido e sem limitar o atendimento à quantidade solicitada. Entradas de recurso não tinham chave estrangeira para a unidade. Esses cenários não dependem de corrupção externa para existir.

Foram reproduzidos separadamente seis casos:

| Dados legados | Restrição nova que falha |
|---|---|
| Mesmo material em duas linhas do mesmo pedido | Índice único `(pedido_id, material_id)` |
| Estoque negativo | CHECK de estoque |
| Preço de catálogo negativo | CHECK de valor |
| Quantidade atendida maior que a pedida | CHECK de quantidades |
| Quantidade pedida igual a zero | CHECK de quantidades |
| Entrada associada a unidade inexistente | Chave estrangeira de entradas |

Em todos, `migrate deploy` retornou **P3018**. As colunas antigas mantiveram os valores, mas alterações de schema anteriores à falha já estavam confirmadas, incluindo `usuarios.senha_requer_troca`. Repetir o deploy retornou **P3009**. Logo, a migration inteira não oferece rollback transacional. Isso corresponde aos [commits implícitos de DDL no MySQL](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html).

Tratamento: executar a verificação antes da primeira tentativa, resolver as inconsistências com rastreabilidade e repetir o ensaio em cópia. Não apagar itens duplicados, limitar quantidades ou zerar saldos automaticamente: linhas podem ter preços históricos diferentes e representar movimentações reais. Em caso de falha parcial, recuperar um estado conhecido ou preparar reparo específico para o schema observado. Não marcar a migration como aplicada/rollback sem conferir os efeitos já persistidos.

### 2. Alta — migrar o schema não converte as senhas

Arquivos: `src/server/auth/store.ts:54`, `src/server/auth/password.ts:17` e `scripts/secure-local.ts:8`.

O código antigo comparava a senha digitada diretamente com `senha_hash`. A versão nova aceita exclusivamente o formato scrypt implementado no projeto. A migration SQL apenas adiciona `senha_requer_troca`, com padrão `false`; não converte credenciais. Nem build nem inicialização executam essa conversão.

No ensaio, o login com uma conta antiga foi rejeitado após somente a migration. Após executar `db:secure-local` em diretório e banco isolados, as quatro contas conservaram suas senhas de acesso e passaram a exigir troca. A repetição do conversor manteve os hashes existentes. Pela API, a conta convertida recebeu 403 ao acessar pedidos, trocou a senha por uma de **8 caracteres**, e então acessou os pedidos normalmente.

O preparo requer atenção adicional quando não existe administrador persistido: o script precisa de uma unidade e de disponibilidade do e-mail administrativo. Uma credencial legada vazia, maior que 128 caracteres ou que comece por `scrypt$` sem ser um hash válido exige revisão individual. O conversor pula qualquer valor com esse prefixo; o verificador de login é mais estrito. Conversão, criação de administrador e atualização de `.env` não formam uma única transação; confira o resultado mesmo após erro.

**Reverter somente o código deixa as contas convertidas incompatíveis com a autenticação antiga.** Não mantenha as duas versões gravando usuários simultaneamente. Uma versão antiga pode voltar a escrever senhas em texto simples.

### 3. Alta — implantação antiga deixa de executar etapas necessárias

Arquivos: `package.json:13`, `scripts/db-cli.ts`, `src/server/config.ts` e `src/server/app.ts:95`.

Na `main`, `build` também executava migrations. No branch revisado, build apenas compila e prepara os arquivos; `db:migrate` é uma etapa explícita. Executar o aplicativo novo contra o schema antigo causa falhas por campos/tabela ausentes. Uma conta MySQL limitada às tabelas antigas também precisa de SELECT/INSERT/UPDATE em `audit_events`: escritas autorizadas dependem do registro prévio da auditoria.

O segredo fixo/ausente da instalação antiga passa a ser recusado. O bind padrão passa a `127.0.0.1`, adequado ao uso local informado; acesso pela rede que existisse antes precisa ser configurado conscientemente. Em produção são exigidas origens HTTPS explícitas. Node.js deve satisfazer o mínimo 22.12 e as dependências devem vir do lockfile. No Windows, pare o processo que usa o Prisma antes de uma instalação que regenere sua DLL.

Frontend e backend precisam ser atualizados juntos, com recarregamento das abas antigas. Mudaram o login/CSRF, a assinatura dos cookies, os corpos de algumas requisições, a paginação e as permissões. As sessões anteriores não são preservadas.

### 4. Média — histórico inicial exige conferir baseline e checksum

Arquivo: `prisma/migrations/0_init/migration.sql`.

O arquivo da `main` está em UTF-16LE; o branch usa UTF-8. A comparação normalizada confirmou o mesmo SQL, inclusive os valores padrão originais. A mudança de bytes altera seu checksum.

O ensaio registrou `0_init` usando os bytes antigos e executou o deploy atual com **Prisma 6.19.3**: ele concluiu a atualização, e a segunda execução também passou. A divergência, portanto, não foi bloqueadora para esse comando/versão. Ela continua sendo uma diferença no histórico e é sinalizada pelo novo verificador; não deve ser “corrigida” com UPDATE automático em `_prisma_migrations` nem ignorada em futuros fluxos de desenvolvimento.

Um banco antigo com tabelas e sem baseline foi testado separadamente: o deploy retornou **P3005**, sem alterar seus registros. O fallback antigo que tentava `resolve --applied 0_init` foi removido. Se esse for o estado da instalação, primeiro compare o schema efetivo ao legado; registre o baseline somente se corresponder. Não use `migrate reset` ou `db push` para contornar esse problema.

### 5. Média — preservar registros não preserva todos os resultados e permissões

As mudanças abaixo são reais e em grande parte intencionais. Devem constar da homologação funcional:

| Área | Efeito após a atualização |
|---|---|
| Perfis | Gestor passa a consulta; solicitante opera sua unidade; técnico avança manutenção aprovada; administração fica concentrada no administrador. Solicitante sem unidade recebe bloqueio operacional. |
| Pedidos | Transições seguem o estado atual. Não se atende um pedido ainda SOLICITADO. Pedido enviado/cancelado não pode ser cancelado novamente pelo mesmo fluxo. |
| Estoque | Atendimento usa diferença acumulada, transação e disponibilidade. Ajuste manual exige `estoque_anterior`; clientes antigos precisam ser atualizados. |
| Cancelamentos históricos | A versão antiga marcava CANCELADO sem devolver o estoque. A migration não estorna esses casos, e a nova API rejeita novo cancelamento. Conferir com a movimentação/contagem física antes de ajustar. |
| Financeiro | Somente manutenção CONCLUIDA entra como despesa realizada. No ensaio com cinco chamados de R$ 25,50, a soma antiga de R$ 127,50 passa a R$ 25,50. Nenhum chamado foi apagado. |
| Natureza da despesa | Itens antigos recebem a natureza atual do material. A natureza original da data do pedido não existia como coluna; não é possível reconstruí-la apenas com essa migration. Depois do upgrade, o item mantém seu próprio snapshot. |
| Preços e totais novos | Novos pedidos usam preços do catálogo, totais calculados no servidor e identidade autenticada. Valores históricos não são recalculados pela migration. |
| Numeração PBS | Números antigos permanecem. Novos números usam ano da data do pedido e ID com seis posições, em vez da contagem de pedidos com quatro posições. Conferir integrações que interpretem o formato e numerações manuais preexistentes. |
| Paginação | A API limita páginas a 200 registros e usa `X-Next-Cursor`. O frontend novo percorre as páginas. Um consumidor antigo que ignore o cursor recebe apenas a primeira página. |
| Validação | Limites de 100 itens por requisição de atendimento, quantidades até 1.000.000 e tipos de contrato definidos podem impedir operações sobre cadastros antigos fora desses limites. A migration pode passar mesmo assim. |
| Exclusões/vínculos | Unidade com usuários ou recursos vinculados não pode ser excluída pelo mesmo fluxo. Equipamento com manutenção não pode ser transferido livremente para outra unidade. |
| Falhas de banco | Operação com falha passa a retornar erro. Não existe mais sucesso aparente por gravação apenas em memória. |

O último ponto é relevante para a preservação: o código antigo mantinha registros em memória após exceções do MySQL. Dados exibidos apenas nessa memória não estarão em um backup do banco e não podem ser recuperados por migration. Antes de desligar uma instalação antiga ainda em uso, conferir se o que a interface mostra está efetivamente persistido e recuperar eventuais divergências por procedimento protegido.

Os novos valores padrão de estoque e orçamento são zero, mas **não zeram saldos já cadastrados**. Isso foi conferido por comparação de todas as colunas antigas e por inserções posteriores: os orçamentos legados de R$ 123.456,78/R$ 87.654,32 foram mantidos, enquanto uma nova unidade recebeu zero.

## Evidências da execução

1. **Nove cenários de upgrade passaram**, onde “passar” inclui reconhecer as falhas esperadas nos dados inválidos: legado válido, seis casos incompatíveis, banco sem baseline e restauração do backup real anterior à auditoria.
2. O cenário válido populou as nove tabelas antigas, com IDs não sequenciais, seis estados de pedido, atendimento parcial, valores decimais, datas, nulos, vínculos e textos acentuados. Fingerprints SHA-256 das colunas existentes, por tabela e ordenadas por ID, permaneceram idênticos antes/depois da migration e de sua repetição. Não foram apenas contagens.
3. O diff do schema de origem contra o modelo antigo e do schema migrado contra o modelo novo ficou vazio para os recursos representáveis pelo Prisma. CHECKs foram exercitados pelos cenários de falha; o diff isoladamente não os comprova.
4. O backup DPAPI anterior à auditoria foi descriptografado em memória e restaurado somente em banco temporário. Seus 3 registros de unidade, 15 materiais e 2 usuários permaneceram idênticos nas colunas legadas após o upgrade. Esse backup não contém movimentações; elas foram cobertas com dados sintéticos.
5. Foram exercitados autenticação, troca obrigatória de senha via API, atendimento de pedido parcialmente atendido na versão antiga, estorno único, bloqueio de cancelamento após envio, recebimento/envio, manutenção e criação de pedido preservando a sequência de IDs.
6. `npm test`: **7/7**. `npm run test:integration`: **13/13**, incluindo navegador, autorização, concorrência, estoque e cache. `npm run build`: passou. A checagem TypeScript adicional dos novos scripts/teste também passou.
7. `npm run db:check-upgrade` na base configurada: nenhum bloqueio ou aviso nos dados/histórico avaliados. `check-local.ts`: **falhou na restrição de privilégios**, pois a conexão de aplicação usa root; segredo configurado, nenhum estoque negativo e nenhuma senha legada detectada. Duas contas ainda exigem troca de senha.
8. Ao terminar, não restaram bancos `odontogest_upgrade_*`. O serviço `MySQL80` permaneceu em execução.

Evidência local detalhada: `.local/upgrade-review/74f6687f17dd/result.json`. Ela contém contagens, fingerprints e resultados, sem registros pessoais ou senhas. O teste pode ser repetido:

```powershell
npm run db:check-upgrade
npm run test:upgrade
# Opcional, somente com o backup legado disponível neste perfil Windows:
npm run test:upgrade -- --backup .local/backup-antes-auditoria-utf8.dpapi
```

O verificador é somente leitura, não bloqueia gravações concorrentes e não substitui comparação integral de schema/permissões. Código de saída zero indica ausência dos bloqueios pesquisados, não aprovação irrestrita; avisos e a configuração também precisam ser avaliados. O ensaio sintético usa a conexão administrativa para criar seus bancos, portanto não substitui a validação dos privilégios da conta da aplicação.

## Roteiro para atualizar uma instalação antiga

1. Identificar a versão de origem, banco efetivamente usado, baseline e configuração. Executar o verificador com as credenciais daquele banco. Confirmar as permissões esperadas e revisar os avisos de comportamento. Na instalação local atual, as migrations já estão aplicadas; não reaplicá-las manualmente nem reconverter contas desnecessariamente.
2. Conferir interface antiga versus persistência, tratar dados existentes somente com evidência e ensaiar a atualização em cópia representativa. Preservar os IDs e os documentos históricos. Reservar uma janela de manutenção: não foram medidos locks e tempo de DDL para um banco grande.
3. Parar gravações da versão antiga. Fazer backup final consistente e protegido dos dados, schema, histórico de migrations e configuração, e testar restauração em destino separado. O snapshot JSON/DPAPI local não inclui DDL, contas/privilégios MySQL ou chaves do perfil Windows; a exportação SQL da interface exclui usuários/auditoria e não é backup completo.
4. Preparar a release inteira e instalar as dependências pelo lockfile, com os processos que usam Prisma parados no Windows. Executar build e testes antes de apontar a release para o banco de trabalho. Preparar `.env`, segredo e conexão administrativa separada; manter segredos fora do Git.
5. Repetir a verificação com as gravações suspensas. Se o histórico estiver ausente, concluir a comparação/baseline antes de qualquer deploy. Executar `npm run db:migrate` e conferir conclusão e schema. Se falhar, manter a aplicação indisponível e seguir o plano de recuperação; não insistir cegamente.
6. Converter credenciais legadas com `npm run db:secure-local`, quando necessário, usando a configuração daquela instalação. Conferir administrador, hashes e acesso temporário. Revisar contas incompatíveis individualmente. Esse comando também rotaciona o segredo de cookies.
7. Configurar/verificar a conta MySQL restrita da aplicação, incluindo a nova tabela de auditoria. Não repetir automaticamente `scripts/restrict-db-local.ts` nesta instalação: ele foi escrito para preparação inicial, rejeita `.env.migrate` já existente e não é reconciliador de privilégios. Tratar a configuração root encontrada nesta revisão antes da liberação.
8. Iniciar a release nova, renovar o login e as abas abertas. Validar consultas por perfil, troca de senha, saldos e um fluxo controlado de solicitação/atendimento/manutenção. Conferir contagens, valores históricos e auditoria. Liberar gravações apenas após concluir essa validação.

## Recuperação e limites

Se houver falha antes de liberar novas gravações, a recuperação mais previsível é restaurar o conjunto compatível de banco, configuração e versão a partir do backup validado, preferencialmente em outro banco, mantendo a base com falha preservada para análise. O código antigo não oferece autenticação compatível com hashes scrypt; voltar apenas o Git não resolve.

Se já houver operações na versão nova, restaurar um backup anterior descartaria essas operações. Suspenda as gravações, preserve o estado atual e reconcilie a diferença antes de qualquer reversão. Não existe migration reversa nem rotina genérica de downgrade testada neste branch.

O ensaio demonstra preservação nos dados e fluxos descritos; não garante ausência de qualquer regressão em bancos não fornecidos, dados salvos somente em memória, integrações externas ou volumes maiores. O merge pode integrar o código revisado, mas a implantação deve ser condicionada ao roteiro acima e à resolução da conexão root identificada.
