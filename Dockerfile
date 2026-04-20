FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_AUTH_BASE_URL=http://localhost:3000
ARG VITE_API_BASE_URL=http://localhost:8080/api
ARG VITE_USE_MOCK=false
ENV VITE_AUTH_BASE_URL=$VITE_AUTH_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_USE_MOCK=$VITE_USE_MOCK

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build-only


FROM node:22-alpine

WORKDIR /app

RUN npm install -g serve \
    && addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /app/dist ./dist

USER app

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -q -O- http://localhost:5173/ >/dev/null || exit 1

CMD ["serve", "-s", "dist", "-l", "5173"]
