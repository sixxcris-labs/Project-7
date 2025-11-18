FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Next.js port
EXPOSE 3000

# Start Next.js in development mode
# For production, use: npm run build && npm start
# Note: tsconfig.base.json is mounted via volume in docker-compose.yml
CMD ["npm", "run", "dev"]

