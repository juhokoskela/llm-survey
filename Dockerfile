FROM node:24-bookworm-slim AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME/bin:$PATH
ENV PNPM_VERSION=11.5.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl libatomic1 \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p "$PNPM_HOME" \
  && touch /root/.profile \
  && curl -fsSL https://get.pnpm.io/install.sh \
    | env PNPM_HOME="$PNPM_HOME" PNPM_VERSION="$PNPM_VERSION" ENV=/root/.profile SHELL=/bin/sh sh - \
  && pnpm --version

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS migrate

COPY . .
CMD ["pnpm", "db:migrate"]

FROM deps AS builder

COPY . .
RUN pnpm build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/next.config.mjs ./next.config.mjs
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node scripts/migrate-production.mjs scripts/start-production.mjs ./scripts/

USER node

EXPOSE 3000

CMD ["node", "scripts/start-production.mjs"]
