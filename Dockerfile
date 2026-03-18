# Stage 1: Build the Vite App for production
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and install dependencies cleanly
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the static site (transpiles and minimizes files into the /app/dist directory)
RUN npm run build

# Stage 2: Serve the app using an optimized, lightweight web server
# using the official unprivileged nginx image which runs natively as a non-root user (nginx UID 101)
FROM nginxinc/nginx-unprivileged:alpine

# Copy the built assets from the 'builder' stage over to NGINX's default unprivileged html serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Documenting that port 8080 is used (Cloud Run listens to 8080 by default for container deployments)
EXPOSE 8080

# The base container automatically starts the nginx server, so no CMD is strictly needed here.
