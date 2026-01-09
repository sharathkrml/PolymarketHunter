FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
# We also install @types/node explicitly to ensure TS compatibility in the container
RUN npm install && npm install -D @types/node

# Copy source code
COPY . .

# build app
RUN npm run build
