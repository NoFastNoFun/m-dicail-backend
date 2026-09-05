FROM node:22-alpine AS builder
WORKDIR /app

ARG APP=api
ENV HUSKY=0

COPY package.json pnpm-lock.yaml ./
# Use npm (bundled with the image) to install a pinned pnpm — avoids Corepack's
# separate download path, which failed on the VPS when Docker egress was filtered.
RUN npm install -g pnpm@9.15.0 --fetch-retries=5 --fetch-retry-maxtimeout=60000 \
  && pnpm install --frozen-lockfile

COPY . .
RUN pnpm nest build ${APP}


FROM node:22-alpine AS production
WORKDIR /app

ARG APP=api
ENV APP=${APP}
ENV NODE_ENV=production
ENV HUSKY=0

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@9.15.0 --fetch-retries=5 --fetch-retry-maxtimeout=60000 \
  && pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

EXPOSE 8000
CMD ["sh", "-c", "exec node dist/apps/${APP}/main"]
