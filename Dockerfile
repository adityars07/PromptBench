FROM node:20-slim AS frontend-builder
WORKDIR /app/code/client
COPY code/client/package*.json ./
RUN npm install
COPY code/client/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

# Install system dependencies & curl for healthcheck & nodejs
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/code/client/dist /app/code/client/dist

# Build Node backend
WORKDIR /app/code/server
RUN npm install
RUN npm run build

WORKDIR /app
RUN sed -i 's/\r$//' start.sh && chmod +x start.sh
RUN mkdir -p /app/data && chmod -R 777 /app

# Hugging Face Spaces port
EXPOSE 7860

CMD ["bash", "start.sh"]
