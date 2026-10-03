FROM node:22-bookworm

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

COPY backend/package.json ./backend/package.json
COPY backend/prisma ./backend/prisma
ENV DATABASE_URL="postgresql://tew:tew_local_dev@db:5432/expertise_wins?schema=public"
RUN cd backend && npm install && npx prisma generate

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

CMD ["sleep", "infinity"]