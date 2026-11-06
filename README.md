# 🦷 OdontoGest - Sistema de Gestão Odontológica e Almoxarifado de Saúde (PBS)

Sistema moderno e integrado para gestão de **Pedidos de Bens e Serviços (PBS)**, controle de insumos odontológicos, unidades de saúde (USF/PAM/SMS), equipamentos com chamados de manutenção e controle orçamentário.

Construído com conformidade **OWASP Top 10**, autenticação segura via **OAuth 2.0 PKCE** e cookies HttpOnly.

---

## 🛠️ Stack Tecnológica

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Backend**: [Fastify 5](https://fastify.dev/) com TypeScript e execução via [TSX](https://github.com/privatenumber/tsx)
- **Banco de Dados & ORM**: [MySQL 8.0](https://www.mysql.com/) e [Prisma ORM 6](https://www.prisma.io/)
- **Containerização Local**: [Docker](https://www.docker.com/) & Docker Compose (`Dockerfile.local`)
- **Deploy em Nuvem**: [Railway](https://railway.com/) via integração nativa Git (Nixpacks / Node.js)
- **Design System & Segurança**: Vanilla CSS, Glassmorphism moderno, Proteção Anti-CSRF (Double-Submit), Sessions Seguras.

---

## 🚀 Deploy em Produção (Railway)

O projeto está configurado para deploy automático na **Railway** via integração com o GitHub:

1. Ao enviar commits para a branch principal (`git push`), a Railway detecta as alterações e realiza o build nativo com **Nixpacks** (sem Docker na nuvem).
2. O arquivo [railway.json](file:///railway.json) define explicitamente o builder como `NIXPACKS` e os comandos `npm run build` e `npm run start`.
3. Variáveis de ambiente configuradas na Railway:
   - `DATABASE_URL`: URL de conexão do MySQL na Railway (ex: `${{MySQL.DATABASE_URL}}`).
   - `COOKIE_SECRET`: Chave secreta para criptografia de cookies e CSRF.
   - `NODE_ENV`: `production`

---

## 🐳 Inicialização Rápida com Docker (Para Computador de Testes Locais)

O projeto possui `docker-compose.yml` utilizando `Dockerfile.local` exclusivamente para testes locais:

### 1. Iniciar Banco de Dados MySQL e phpMyAdmin (Recomendado para Dev Local)

Para desenvolver localmente com recarregamento instantâneo (**Vite HMR**):

```powershell
# Sobe o MySQL 8.0 e o phpMyAdmin em segundo plano
docker compose up -d db phpmyadmin
```

O container do MySQL irá inicializar automaticamente com as tabelas e dados iniciais de `almoxarifado_saude_db.sql`.

### 2. Iniciar Stack Completa 100% no Docker (App + Banco + phpMyAdmin)

Se preferir rodar toda a aplicação conteinerizada:

```powershell
# Compila e sobe a aplicação, banco e phpMyAdmin
docker compose up -d --build
```

A aplicação estará acessível em: **[http://localhost:3001](http://localhost:3001)**

---

## 💻 Execução Local (Modo Desenvolvimento)

Se você estiver rodando o banco no Docker e a aplicação na sua máquina:

### 1. Instalar as dependências
```powershell
npm.cmd install
```

### 2. Configurar o arquivo `.env`
O projeto já conta com o arquivo [.env](file:///.env). Caso precise recriá-lo:
```ini
DATABASE_URL="mysql://root:root@localhost:3306/almoxarifado_saude_db"
PORT=3001
NODE_ENV=development
COOKIE_SECRET="super-secret-key-pbs-saude-owasp-2026"
DEBUG_PRISMA=false
```

### 3. Sincronizar o Banco de Dados com Prisma
```powershell
# Gera os clientes de tipagem do Prisma
npx.cmd prisma generate

# Sincroniza o schema com o MySQL
npx.cmd prisma db push
```

### 4. Executar o Servidor de Desenvolvimento
```powershell
npm.cmd run dev
```

- **Frontend (Vite Dev Server)**: [http://localhost:3000](http://localhost:3000)
- **Backend API (Fastify)**: [http://localhost:3001](http://localhost:3001)
- O Vite faz proxy automático de `/api` para a porta `3001`.

---

## 🌐 Portas e Acessos

| Serviço | URL | Credenciais Padrão |
| :--- | :--- | :--- |
| **Frontend (Dev)** | [http://localhost:3000](http://localhost:3000) | - |
| **Aplicação Completa (Docker/Prod)** | [http://localhost:3001](http://localhost:3001) | - |
| **phpMyAdmin** | [http://localhost:8080](http://localhost:8080) | Servidor: `db` \| Usuário: `root` \| Senha: `root` |
| **MySQL Database** | `localhost:3306` | Banco: `almoxarifado_saude_db` \| User: `root` \| Senha: `root` |

---

## 👤 Contas de Acesso Padrão (Ambiente de Testes)

| Usuário | E-mail | Senha Padrão | Perfil | Unidade |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador Geral** | `admin@saude.gov.br` | `123456` | `ADMINISTRADOR` | SMS (Secretaria) |
| **Dra. Maria Fernanda** | `solicitante@saude.gov.br` | `123456` | `SOLICITANTE` | USF Waldemar Queiroz |
| **Carlos Eduardo** | `gestor@saude.gov.br` | `123456` | `GESTOR` | PAM Costa e Silva |

---

## 🐳 Comandos Úteis do Docker

```powershell
# Ver status dos containers
docker compose ps

# Ver logs em tempo real
docker compose logs -f

# Parar todos os serviços
docker compose stop

# Parar e remover os containers (mantendo os dados do volume)
docker compose down

# Resetar o banco de dados (apagando os dados persistidos no volume)
docker compose down -v
docker compose up -d db
```

---

## 🎯 Skill de Desenvolvimento: `tlc-spec-driven`

O projeto conta com a skill **`tlc-spec-driven`** instalada em [.agents/skills/tlc-spec-driven/](file:///.agents/skills/tlc-spec-driven/).

Ela implementa o fluxo de **Spec-Driven Development (SDD)** em 4 fases adaptativas:
1. **Specify**: Definição de requisitos com notação EARS e critérios de aceitação claros.
2. **Design**: Análise arquitetural e modelo de dados.
3. **Tasks**: Quebra em tarefas atômicas sequenciais e critérios de verificação.
4. **Execute**: Implementação rastreável com testes e Conventional Commits atômicos.

Para acionar o fluxo ao solicitar novas funcionalidades ao assistente AI, use comandos como:
- *"Especificar funcionalidade [nome]"*
- *"Planejar tarefas para [funcionalidade]"*
- *"Implementar e verificar com tlc-spec-driven"*
