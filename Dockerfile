FROM node:22-alpine AS builder
WORKDIR /app

ARG APP=api
ENV HUSKY=0

# Pin to packageManager in package.json — avoid pnpm@latest (extra registry lookup, flaky).
COPY package.json pnpm-lock.yaml ./
RUN corepack enable \
  && corepack prepare pnpm@9.15.0 --activate \
  && pnpm install --frozen-lockfile

COPY . .
RUN pnpm nest build ${APP}


FROM node:22-alpine AS production
WORKDIR /app

ARG APP=api
ENV APP=${APP}
ENV HUSKY=0

COPY package.json pnpm-lock.yaml ./
RUN corepack enable \
  && corepack prepare pnpm@9.15.0 --activate \
  && pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

EXPOSE 8000
CMD ["sh", "-c", "exec node dist/apps/${APP}/main"]
