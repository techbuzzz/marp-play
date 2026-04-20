# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY nextjs_space/package.json nextjs_space/yarn.lock* ./
COPY nextjs_space/.yarnrc.yml ./
COPY nextjs_space/.yarn ./.yarn

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY nextjs_space . .

# Build application
RUN yarn build

# Production stage
FROM node:20-alpine AS runtime

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built application from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
