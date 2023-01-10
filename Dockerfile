# Install dependencies only when needed
FROM node:16.15.0-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN apk add --no-cache sqlite
RUN apk add --no-cache python3
RUN apk add --no-cache make
RUN apk add --no-cache build-base
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:16.15.0-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
ARG NEXT_PUBLIC_CLUSTER=devnet
RUN NEXT_PUBLIC_CLUSTER=${NEXT_PUBLIC_CLUSTER} yarn build

# Production image, copy all the files and run next
FROM node:16.15.0-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/configs ./configs
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/contracts ./contracts
COPY --from=builder /app/artifacts ./artifacts
COPY --from=builder /app/styles ./styles
COPY --from=builder /app/utils ./utils
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pages ./pages

USER nextjs

# Expose
EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED 1
CMD ["yarn", "start"]