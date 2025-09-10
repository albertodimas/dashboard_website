-- Enable CITEXT and convert email columns to case-insensitive text
CREATE EXTENSION IF NOT EXISTS citext;

-- Convert key email columns to CITEXT for case-insensitive uniqueness and search
ALTER TABLE "customers" ALTER COLUMN "email" TYPE CITEXT USING "email"::citext;
ALTER TABLE "login_attempts" ALTER COLUMN "email" TYPE CITEXT USING "email"::citext;
ALTER TABLE "users" ALTER COLUMN "email" TYPE CITEXT USING "email"::citext;
ALTER TABLE "businesses" ALTER COLUMN "email" TYPE CITEXT USING "email"::citext;
ALTER TABLE "tenants" ALTER COLUMN "email" TYPE CITEXT USING "email"::citext;

