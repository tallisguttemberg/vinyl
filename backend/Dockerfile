FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates

# Configure npm for flaky networks (large binaries like @prisma/engines)
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 300000

COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install
COPY . .
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend ./backend
WORKDIR /app/backend
EXPOSE 4000
CMD ["npm", "start"]
