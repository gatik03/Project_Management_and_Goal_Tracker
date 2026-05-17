FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
RUN npm ci --workspace client

FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY client ./client
WORKDIR /app/client
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/client/dist /usr/share/nginx/html
EXPOSE 80
