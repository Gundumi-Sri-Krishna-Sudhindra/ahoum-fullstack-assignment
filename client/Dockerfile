# Stage 1: Build production React/Vite assets
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies using clean install
COPY package.json package-lock.json /app/
RUN npm ci

# Copy source code and build for production with /api relative base URL
COPY . /app/
ENV VITE_API_BASE_URL=/api
RUN npm run build

# Stage 2: Serve compiled assets with lightweight Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
