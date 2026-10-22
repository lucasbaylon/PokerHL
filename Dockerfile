# ---------- Étape 1 : build du frontend Angular ----------
FROM node:20.20.2-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build:production

# ---------- Étape 2 : dépendances du backend ----------
FROM node:22.23.4-alpine AS backend-deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- Étape 3 : image finale ----------
FROM node:22.23.4-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY --from=backend-deps /app/node_modules ./node_modules
COPY package.json server.js database.js ./
COPY --from=frontend-build /app/frontend/dist/frontend/browser ./dist

USER node

EXPOSE 3000

CMD ["node", "server.js"]
