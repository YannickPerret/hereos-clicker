FROM node:20-alpine

WORKDIR /app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

EXPOSE 3333

CMD ["sh", "-c", "node ace migration:run --force && node ace db:seed && node ace serve --hmr --host 0.0.0.0"]
