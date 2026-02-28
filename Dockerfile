FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache \
  fontconfig \
  ttf-dejavu \
  ttf-liberation

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY assets ./assets

ENV NODE_ENV=production

CMD ["node", "src/bot.js"]
