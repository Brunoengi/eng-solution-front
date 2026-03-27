# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_ESTRUTURA_API_URL=
ARG NEXT_PUBLIC_ESTRUTURA_API_PATH=/beam2d/system
ARG NEXT_PUBLIC_ESTRUTURA_API_ENVELOPE_PATH=/beam2d/envelope
ENV NEXT_PUBLIC_ESTRUTURA_API_URL=$NEXT_PUBLIC_ESTRUTURA_API_URL
ENV NEXT_PUBLIC_ESTRUTURA_API_PATH=$NEXT_PUBLIC_ESTRUTURA_API_PATH
ENV NEXT_PUBLIC_ESTRUTURA_API_ENVELOPE_PATH=$NEXT_PUBLIC_ESTRUTURA_API_ENVELOPE_PATH
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
