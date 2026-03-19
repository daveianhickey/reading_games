# Use a lightweight Node image as requested
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install ALL dependencies (necessary because Vite is specifically a devDependency required to build the app)
RUN npm ci

# Copy the rest of your code
COPY . .

# Build the static site into the /dist folder
RUN npm run build

# Install a simple, official, minimalist Node static file server to host the built frontend
RUN npm install -g serve

# CRITICAL SECURITY STEP: Switch away from root to the unprivileged 'node' user that comes built into the node:alpine image
USER node

# Expose port (Cloud run uses PORT env or 8080 by default)
EXPOSE 8080

# The command to start your app
CMD ["npm", "start"]
