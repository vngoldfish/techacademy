FROM node:22-slim

ENV NODE_V8_FLAGS="--no-opt --no-turboshaft"






# Install postgresql-client
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy rest of application code
COPY . .

# Generate Prisma Client
RUN node --no-opt --no-turboshaft node_modules/prisma/build/index.js generate

# Build the application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]
