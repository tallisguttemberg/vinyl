FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install
COPY . .
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend ./backend
WORKDIR /app/backend
EXPOSE 4000
CMD ["npm", "start"]
