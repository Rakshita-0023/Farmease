# Root-level convenience image for the Core service.
# The ECS/Compose deployment uses backend/Dockerfile explicitly.
FROM node:20-bookworm-slim
WORKDIR /app
COPY backend/package*.json ./backend/
RUN npm ci --omit=dev --prefix backend
COPY backend ./backend
ENV NODE_ENV=production
EXPOSE 5001
USER node
CMD ["node", "backend/server.js"]
