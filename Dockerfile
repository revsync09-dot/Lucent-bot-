FROM node:20-alpine

WORKDIR /app

# Install font dependencies so Orbitron + Rajdhani render correctly on skia-canvas
RUN apk add --no-cache \
  fontconfig \
  ttf-dejavu \
  ttf-liberation \
  ttf-freefont \
  cairo-dev \
  pango-dev \
  jpeg-dev \
  giflib-dev \
  librsvg-dev \
  build-base \
  python3

# Copy package files first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source files
COPY src ./src
COPY assets ./assets

# Refresh font cache so custom fonts in assets/fonts are found
RUN fc-cache -fv 2>/dev/null || true

ENV NODE_ENV=production

# Health check for fly.io
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1

CMD ["node", "src/bot.js"]
