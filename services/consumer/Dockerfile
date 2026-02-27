#############################################################################################################
## Execute this from monorepo root: `docker build -f services/consumer/Dockerfile -t declutter/consumer .` ##
#############################################################################################################

#############
## BUILDER ##
#############
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
RUN apk add --no-cache python3 make g++

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

COPY packages/lib/package.json packages/lib/
COPY packages/queue/package.json packages/queue/
COPY packages/tracing/package.json packages/tracing/
COPY services/api/package.json services/api/

RUN pnpm install --frozen-lockfile

COPY packages/ packages/
COPY services/consumer/ services/consumer/
COPY tsconfig.json ./

RUN pnpm --filter @declutter/consumer build

############
## RUNNER ##
############
FROM node:22-alpine AS runner
WORKDIR /app

RUN npm install pulsar-client @valkey/valkey-glide

COPY --from=build /app/services/consumer/dist/index.js ./index.js

EXPOSE 4000
CMD ["node", "index.js"]