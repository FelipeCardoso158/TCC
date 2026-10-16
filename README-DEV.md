# SGOM — Guia de Desenvolvimento

## Requisitos
- Node.js 20+
- pnpm 9+
- Docker/Docker Compose

## Setup rápido
1. Copie .env.example para .env
2. docker compose -f docker-compose.dev.yml up -d
3. pnpm install
4. npx prisma migrate dev
5. pnpm --filter api start:dev
6. pnpm --filter web dev

## Links
- Swagger API: http://localhost:3333/docs
- MinIO Console: http://localhost:9001 (minio/minio123)

## Scripts
- dev/build/lint/typecheck via turbo/pnpm

