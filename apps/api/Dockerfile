FROM node:22.22.3-bookworm-slim AS pruner
WORKDIR /app
ENV TURBO_TELEMETRY_DISABLED=1
RUN npm install --global turbo@2.5.5
COPY . .
RUN turbo prune @pantry-pilot/api --docker

FROM node:22.22.3-bookworm-slim AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN npm ci
COPY --from=pruner /app/out/full/ .
RUN npm run build

FROM node:22.22.3-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=pruner /app/out/json/ .
RUN npm ci --omit=dev
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist
EXPOSE 3000
CMD ["node", "apps/api/dist/server.js"]
