# Workspace MCP - Dockerfile
FROM node:18-alpine

# Installer les dépendances système
RUN apk add --no-cache \
    git \
    python3 \
    py3-pip \
    imagemagick \
    docker-cli \
    bash

# Créer le dossier de l'app
WORKDIR /app

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm ci --only=production

# Copier le code source
COPY . .

# Compiler TypeScript
RUN npm run build

# Créer les dossiers data
RUN mkdir -p data/cache data/logs

# Exposer le port
EXPOSE 3100

# Variable d'environnement
ENV NODE_ENV=production
ENV MCP_PORT=3100

# Démarrer le serveur
CMD ["node", "dist/server.js"]
