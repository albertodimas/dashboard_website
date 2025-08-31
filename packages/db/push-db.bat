@echo off
set DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres?schema=public
set DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres?schema=public
npx prisma db push --force-reset