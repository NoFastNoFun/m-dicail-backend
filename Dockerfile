FROM node:22-alpine AS builder
WORKDIR /app

ARG APP=api

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm nest build ${APP}


FROM node:22-alpine AS production
WORKDIR /app

ARG APP=api
ENV APP=${APP}

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

EXPOSE 8000
CMD ["sh", "-c", "exec node dist/apps/${APP}/main"]
