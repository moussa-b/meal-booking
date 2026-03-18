# Stage 1: Dependencies
FROM node:25-slim AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Stage 2: Builder
FROM node:25-slim AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variable to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN npm run build

# Stage 3: Runner
FROM node:25-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install production dependencies needed for migrations and seed script
RUN npm install -g db-migrate db-migrate-mysql tsx

# Copy necessary files from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Install production dependencies (including mysql2, dotenv, bcryptjs for seed script)
RUN npm ci --only=production

# Copy migration files and configuration
COPY --from=builder --chown=nextjs:nodejs /app/migrations ./migrations
COPY --from=builder --chown=nextjs:nodejs /app/database.json ./database.json
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Excel templates required at runtime
COPY --from=builder --chown=nextjs:nodejs /app/excel_templates ./excel_templates

# Copy lib/db for database connection (needed for seed script)
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

# Make entrypoint script executable (before switching user)
RUN chmod +x scripts/docker-entrypoint.sh

# Expose the port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Switch to non-root user (after making script executable)
USER nextjs

# Use entrypoint script to run migrations before starting the app
ENTRYPOINT ["scripts/docker-entrypoint.sh"]
CMD ["node", "server.js"]
