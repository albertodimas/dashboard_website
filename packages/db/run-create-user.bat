@echo off
set DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres?schema=public
set DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres?schema=public
node create-test-user.js