-- Add optional lastName column to users to store surname separately
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastName" text;

