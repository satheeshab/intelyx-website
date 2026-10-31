# Intelyx website: React app + Node.js server in one container (AWS Lightsail container service).
#
#   docker build -t intelyx-web .
#   docker run --rm -p 8080:8080 -e ALLOW_LOG_EMAIL=true intelyx-web      # then open http://localhost:8080
#
# Lightsail runs linux/amd64. On an Apple Silicon Mac build with:  docker build --platform linux/amd64 ...

# ---- Stage 1: build the React app -------------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

# Install dependencies first so Docker can cache them until package files change
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci

COPY client client
RUN npm run build -w client

# ---- Stage 2: production dependencies only (server) -------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci --omit=dev --workspace=server --include-workspace-root=false

# ---- Stage 3: runtime image -------------------------------------------------------------------
FROM node:24-alpine
ENV NODE_ENV=production \
    PORT=8080
WORKDIR /app

COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/client/dist ./client/dist
COPY server ./server
COPY package.json ./

# Run as the unprivileged "node" user that ships with the image
USER node
EXPOSE 8080
CMD ["node", "server/src/index.js"]
