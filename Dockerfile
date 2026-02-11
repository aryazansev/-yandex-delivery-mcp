FROM node:20-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Remove build dependencies to reduce image size
RUN apk del python3 make g++

# Install wget for health check
RUN apk add --no-cache wget

# Expose port
EXPOSE 3002

# Set environment
ENV NODE_ENV=production
ENV MCP_PORT=3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

# Start server
CMD ["node", "build/server.js"]
