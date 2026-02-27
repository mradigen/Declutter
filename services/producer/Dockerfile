#############################################################################################################
## Execute this from monorepo root: `docker build -f services/producer/Dockerfile -t declutter/producer .` ##
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
COPY services/producer/ services/producer/
COPY tsconfig.json ./

RUN pnpm --filter @declutter/producer build

############
## RUNNER ##
############
FROM node:22-alpine AS runner
WORKDIR /app

RUN npm install pulsar-client @valkey/valkey-glide fastbloom

COPY --from=build /app/services/producer/dist/index.js ./index.js

RUN apk add --no-cache gcompat # this is needed cause the fastbloom ci mistakenly builds glibc into musl

EXPOSE 4000
CMD ["node", "index.js"]
