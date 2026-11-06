# Imagem base oficial do Node.js Alpine
FROM node:20-alpine

# Diretório de trabalho na imagem
WORKDIR /app

# Copia os manifestos de dependências e schema do Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependências do projeto
RUN npm install

# Copia o restante dos arquivos do projeto
COPY . .

# Gera os tipos do Prisma Client
RUN npx prisma generate

# Compila o frontend React com Vite para a pasta dist/public
RUN npx vite build

# Define a porta padrão do servidor Fastify
EXPOSE 3001

# Variável de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Executar como usuário não-root node
RUN chown -R node:node /app
USER node

# Comando de inicialização do backend
CMD ["npx", "tsx", "src/server/server.ts"]
