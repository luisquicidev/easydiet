# Use uma imagem Node.js leve
FROM node:20-alpine as builder

# Instalar ferramentas auxiliares (opcional, mas útil para debug)
RUN apk add --no-cache bash curl

# Diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./
# ou se estiver usando yarn
COPY package.json yarn.lock ./

# Instala as dependências
RUN yarn install

# Copia todo o código fonte
COPY . .

# Compila o projeto TypeScript
RUN yarn build

# Imagem de produção
FROM node:20-alpine

# Adiciona um usuário não-root para executar a aplicação
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Diretório de trabalho
WORKDIR /app

# Copia as dependências e os arquivos compilados da etapa anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Define a pasta como pertencente ao usuário não-root
RUN chown -R appuser:appgroup /app

# Muda para o usuário não-root
USER appuser

# Define variável de ambiente para determinar se a aplicação executa como API ou worker
ENV NODE_ENV=production
ENV APP_TYPE=api

# Expõe a porta da aplicação
EXPOSE 3000

# Script de entrada que decide qual app iniciar baseado na variável APP_TYPE
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Comando de entrada
ENTRYPOINT ["./docker-entrypoint.sh"]