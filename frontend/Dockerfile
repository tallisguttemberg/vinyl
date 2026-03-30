FROM node:20-slim AS builder
WORKDIR /app

# Configure npm for flaky networks (large binaries like @prisma/engines)
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 300000

COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/
RUN npm install
COPY . .
WORKDIR /app/frontend
RUN npx prisma generate --schema=../backend/prisma/schema.prisma
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
