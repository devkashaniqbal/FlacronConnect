FROM node:20-alpine

WORKDIR /app

# Install ws dependency (not needed in Cloud Functions but required for Cloud Run)
COPY package*.json ./
RUN npm ci --only=production

# Install ws for the WebSocket bridge
RUN npm install ws

COPY . .

# Build TypeScript (only the bridge file)
RUN npx tsc src/voice/realtimeBridge.ts \
      --module commonjs \
      --target es2020 \
      --esModuleInterop true \
      --outDir lib/voice \
      --skipLibCheck true || true

EXPOSE 8080

CMD ["node", "lib/voice/realtimeBridge.js"]
