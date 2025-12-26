FROM node:18-alpine

WORKDIR /app

# Copy root package.json and install backend dependencies
COPY package*.json ./
RUN npm install

# Copy client package.json and install frontend dependencies
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy source code
COPY . .

# Build frontend
RUN cd client && npm run build

# Expose port
EXPOSE 1507

# Start backend server
CMD ["node", "server.js"]
