-- Consolidate Customers to global unique by email
-- IMPORTANT: Before applying this migration, run the consolidation script to remove duplicates:
--   pnpm -F @nexodash/db tsx packages/db/scripts/consolidate-customers-global.ts --apply

-- Drop previous tenant-scoped unique if exists
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_tenantId_email_key";

-- Add global unique on email
ALTER TABLE "customers" ADD CONSTRAINT "customers_email_key" UNIQUE ("email");

