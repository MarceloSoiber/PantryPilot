FROM node:22.22.3-bookworm-slim AS pruner
WORKDIR /app
ENV TURBO_TELEMETRY_DISABLED=1
RUN npm install --global turbo@2.5.5
COPY . .
RUN turbo prune @pantry-pilot/web --docker

FROM node:22.22.3-bookworm-slim AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN npm ci
COPY --from=pruner /app/out/full/ .
RUN npm run build --workspace=@pantry-pilot/web

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist/web/browser /usr/share/nginx/html
EXPOSE 8080
