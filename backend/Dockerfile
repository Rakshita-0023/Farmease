FROM node:20-bookworm-slim

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY backend/ ./

ENV NODE_ENV=production
EXPOSE 5001
USER node
CMD ["node", "server.js"]
