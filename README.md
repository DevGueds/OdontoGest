# OdontoGest

Gestão local de materiais odontológicos, pedidos PBS, equipamentos, manutenção, honorários e recursos financeiros. React 19 + TypeScript + Fastify 5 + Prisma 6 + MySQL 8.

Veja a análise, as correções e suas limitações no [relatório de auditoria](docs/AUDITORIA-2026-09.md).

## Executar nesta máquina

Requisitos: Node.js 22.12 ou superior compatível com as dependências, npm e serviço Windows `MySQL80` em execução. Execute os comandos na raiz deste projeto.

```powershell
Get-Service MySQL80
npm ci
npm run build
npm run start:local
```

Acesse **http://localhost:3000**. Esse modo serve a interface compilada e a API em um único processo, vinculado a `127.0.0.1`. Após mudanças no código da interface, execute novamente o build e reinicie o servidor. Não execute simultaneamente dois servidores na mesma porta.

Para desenvolver com recarregamento automático, pare o servidor anterior e use `npm run dev`: Vite em 3000 e API em 3001. Para execução direta da API na porta configurada em `.env`, use `npm start`.

## Acesso após a auditoria

A conta administrativa inicial está em `.local/primeiro-acesso-admin.txt`, arquivo protegido pelas permissões do usuário Windows. Leia-o localmente; não publique esse arquivo nem copie sua senha para chamados ou repositórios. O primeiro acesso exige uma nova senha de 8 a 128 caracteres. Após guardar o acesso em local apropriado, exclua a credencial temporária.

As duas contas preexistentes preservaram a senha de acesso, agora armazenada com scrypt; também precisam escolher outra senha antes de usar o sistema. Não existe mais acesso administrativo automático por senha padrão. Administradores podem criar contas ou redefinir uma senha temporária pela tela Usuários.

Sessões expiram após 30 minutos sem atividade ou 8 horas desde o login. Reiniciar o servidor encerra todas as sessões. Mudanças de senha e de cadastro/perfil revogam as sessões da conta afetada.

## Configuração e banco

`.env.example` contém somente um modelo. A configuração desta máquina já foi preparada:

- `.env`: conexão da aplicação com usuário MySQL restrito, pool de 10 conexões e segredo aleatório dos cookies.
- `.env.migrate`: conexão administrativa utilizada somente pelos comandos de migração e testes isolados.
- `.local/`: credencial inicial, cópias criptografadas e arquivos locais de operação.

Esses arquivos estão fora do Git. Não envie `.env.migrate` para um servidor de aplicação. Alterar `COOKIE_SECRET` invalida a assinatura dos cookies existentes.

Para aplicar migrações versionadas:

```powershell
npm run db:migrate
```

O build não modifica o banco. O cliente Prisma é gerado na instalação; após alterar `schema.prisma`, pare os processos que o utilizam e execute `npm run prisma:generate`. Essa separação permite recompilar a interface sem tentar substituir a DLL do Prisma que o Windows mantém em uso. Não use `prisma:db-push`, reset ou a exportação SQL histórica como rotina de atualização de uma base existente. O histórico `prisma/migrations` é a referência do esquema atual. Alterações futuras que criem tabelas exigem também revisar os privilégios do usuário restrito.

`npm run db:secure-local` é uma ferramenta de preparação/recuperação administrativa: converte senhas legadas, cria o primeiro administrador se ainda não houver um e rotaciona o segredo de cookies. Requer uma unidade já cadastrada; não é necessário executá-la a cada inicialização. `scripts/restrict-db-local.ts` foi usado uma vez para separar a conexão root e não deve ser repetido nesta instalação.

## Verificação

```powershell
npm run typecheck
npm test
npm run build
npm run test:integration
npm run test:frontend
npm audit
npx tsx scripts/check-local.ts
```

Os testes de integração requerem Microsoft Edge instalado, porta 3417 livre e uma conexão em `.env.migrate` que possa criar/remover bancos de teste. O executor cria um banco aleatório `odontogest_test_<identificador>`, aplica as migrações e remove somente esse banco ao terminar. Não execute o arquivo de testes diretamente contra a base de trabalho.

`test:frontend` percorre as telas e os modais com dados fictícios, valida seis tamanhos de tela e os quatro perfis, testa a troca de senha com 8 caracteres e salva capturas em `.local/frontend-review`. Execute-o separadamente de `test:integration`, pois ambos utilizam a porta 3417. Veja também a [revisão de frontend](docs/REVISAO-FRONTEND-2026-09.md).

## Cópia de recuperação local

```powershell
npm run db:backup-local
npx tsx scripts/verify-backup-local.ts .local/backup-NOME-GERADO.dpapi
```

O comando informa o nome efetivo do arquivo. O conteúdo é um snapshot JSON das tabelas acessíveis à conta utilizada, criptografado com Windows DPAPI para o usuário Windows atual. A cópia anterior à auditoria, com codificação UTF-8 conferida, está em `.local/backup-antes-auditoria-utf8.dpapi`.

O verificador testa descriptografia e leitura; não realiza restauração. Essa cópia depende das chaves do perfil Windows e não contém um procedimento completo de recuperação de desastre. A exportação SQL disponível na interface contém dados operacionais e exclui contas, senhas e auditoria; também não substitui backup completo. Antes de uso institucional, implante backup externo criptografado, retenção e restauração testada com ferramentas do MySQL.

## Publicação futura

O modo entregue atende ao uso local. Para publicar, configure `NODE_ENV=production`, origens HTTPS explícitas em `APP_ORIGINS`, certificado/reverse proxy, gestão de segredos, backup e monitoramento. A aplicação exige HTTPS nas origens de produção e usa cookies Secure/HSTS nesse modo. A configuração de proxy deve preservar o IP confiável do cliente sem aceitar cabeçalhos arbitrários; `trustProxy` está desativado.

Sessões, limites de requisições e caches são locais ao processo. Múltiplas instâncias exigem armazenamento compartilhado e invalidação coordenada. Os requisitos organizacionais de privacidade e os limites funcionais estão detalhados no relatório.
