FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for better layer caching.
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci

# Copy source files after dependencies are installed.
COPY shared/ ./shared/
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY docker/ ./docker/

RUN npm run build -w shared
RUN npm run build -w backend
RUN npm run build -w frontend

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache nginx tini \
    && mkdir -p /app/data /usr/share/nginx/html /run/nginx

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY docker/nginx.all-in-one.conf /etc/nginx/nginx.conf
COPY docker/start-all-in-one.sh /app/docker/start-all-in-one.sh

RUN chmod +x /app/docker/start-all-in-one.sh

ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/hookdump.db
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["/app/docker/start-all-in-one.sh"]
