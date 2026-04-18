# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Vite env vars are baked at build time — declare them as ARGs
ARG VITE_AUTH_BASE_URL=http://localhost:3000
ARG VITE_API_BASE_URL=http://localhost:8080/api
ARG VITE_USE_MOCK=false
ENV VITE_AUTH_BASE_URL=$VITE_AUTH_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_USE_MOCK=$VITE_USE_MOCK

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build l'application
RUN npm run build-only

# Production stage
FROM node:22-alpine

WORKDIR /app

# Installer un serveur HTTP léger (serve)
RUN npm install -g serve

# Copier les fichiers buildés depuis le builder
COPY --from=builder /app/dist ./dist

# Exposer le port
EXPOSE 5173

# Lancer l'app
CMD ["serve", "-s", "dist", "-l", "5173"]

