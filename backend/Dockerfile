# Imagem base
FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl

# Argumento de build para o Prisma
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Copia arquivos de dependência primeiro
COPY package*.json ./

# Instala todas as dependências (inclui dev deps para build)
RUN npm install

# Copia o restante do projeto
COPY . .

# Gera Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ==========================
# Imagem final (produção)
# ==========================
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Também mantém a variável disponível no runtime
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Copia package files
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm install --omit=dev

# Copia artefatos necessários do estágio de build
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3333

CMD ["node", "dist/server.js"]