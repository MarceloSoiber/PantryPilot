FROM node:22.22.3-bookworm-slim AS pruner
WORKDIR /app
ENV TURBO_TELEMETRY_DISABLED=1
RUN npm install --global turbo@2.5.5
COPY . .
RUN turbo prune @pantry-pilot/api --docker

FROM node:22.22.3-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=pruner /app/out/json/ .
RUN npm ci
COPY --from=pruner /app/out/full/ .
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=@pantry-pilot/api"]
