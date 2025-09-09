--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4 (Debian 15.4-1.pgdg110+1)
-- Dumped by pg_dump version 15.4 (Debian 15.4-1.pgdg110+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: dashboard
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO dashboard;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: dashboard
--

COMMENT ON SCHEMA public IS '';


--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: dashboard
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO dashboard;

--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: dashboard
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO dashboard;

--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: dashboard
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO dashboard;

--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: dashboard
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: dashboard
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);


ALTER TYPE public."AppointmentStatus" OWNER TO dashboard;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: dashboard
--

CREATE TYPE public."NotificationType" AS ENUM (
    'EMAIL',
    'SMS',
    'PUSH'
);


ALTER TYPE public."NotificationType" OWNER TO dashboard;

--
-- Name: PackagePaymentStatus; Type: TYPE; Schema: public; Owner: dashboard
--

CREATE TYPE public."PackagePaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."PackagePaymentStatus" OWNER TO dashboard;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: dashboard
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SUCCEEDED',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO dashboard;

--
-- Name: PurchaseStatus; Type: TYPE; Schema: public; Owner: dashboard
--

CREATE TYPE public."PurchaseStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'EXPIRED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."PurchaseStatus" OWNER TO dashboard;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: dashboard
--

CREATE TYPE public."UserRole" AS ENUM (
    'OWNER',
    'STAFF',
    'CUSTOMER'
);


ALTER TYPE public."UserRole" OWNER TO dashboard;

--
-- Name: VerificationType; Type: TYPE; Schema: public; Owner: dashboard
--

CREATE TYPE public."VerificationType" AS ENUM (
    'EMAIL_VERIFICATION',
    'PASSWORD_RESET'
);


ALTER TYPE public."VerificationType" OWNER TO dashboard;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO dashboard;

--
-- Name: ad_placements; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.ad_placements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenantId" uuid NOT NULL,
    "businessId" uuid NOT NULL,
    "position" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    impressions integer DEFAULT 0 NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    amount double precision NOT NULL,
    "isPaid" boolean DEFAULT false NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ad_placements OWNER TO dashboard;

--
-- Name: addons; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.addons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "serviceId" uuid NOT NULL,
    name text NOT NULL,
    description text,
    price double precision NOT NULL,
    duration integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.addons OWNER TO dashboard;

--
-- Name: appointment_addons; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.appointment_addons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "appointmentId" uuid NOT NULL,
    "addonId" uuid NOT NULL,
    price double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.appointment_addons OWNER TO dashboard;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenantId" uuid NOT NULL,
    "businessId" uuid NOT NULL,
    "customerId" uuid NOT NULL,
    "serviceId" uuid NOT NULL,
    "staffId" uuid NOT NULL,
    "packageId" uuid,
    "packagePurchaseId" uuid,
    "customerName" text,
    "customerPhone" text,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    status public."AppointmentStatus" DEFAULT 'PENDING'::public."AppointmentStatus" NOT NULL,
    "isHomeService" boolean DEFAULT false NOT NULL,
    "serviceAddress" text,
    "serviceLocation" public.geography,
    "estimatedArrival" timestamp(3) without time zone,
    "actualArrival" timestamp(3) without time zone,
    "distanceKm" double precision,
    "travelTimeMinutes" integer,
    notes text,
    "internalNotes" text,
    price double precision NOT NULL,
    "depositAmount" double precision,
    "totalAmount" double precision NOT NULL,
    "cancellationReason" text,
    "cancelledAt" timestamp(3) without time zone,
    "cancelledBy" uuid,
    "confirmedAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "noShowAt" timestamp(3) without time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.appointments OWNER TO dashboard;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenantId" uuid NOT NULL,
    "userId" uuid,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "oldValues" jsonb,
    "newValues" jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO dashboard;

--
-- Name: breaks; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.breaks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "staffId" uuid NOT NULL,
    title text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "isRecurring" boolean DEFAULT false NOT NULL,
    "recurringDays" integer[],
    date timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.breaks OWNER TO dashboard;

--
-- Name: businesses; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenantId" uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "customSlug" text,
    "businessType" text,
    description text,
    logo text,
    "coverImage" text,
    email text NOT NULL,
    phone text NOT NULL,
    website text,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    "postalCode" text NOT NULL,
    country text DEFAULT 'US'::text NOT NULL,
    location public.geography,
    timezone text NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    features jsonb DEFAULT '{}'::jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isPremium" boolean DEFAULT false NOT NULL,
    "isBlocked" boolean DEFAULT false NOT NULL,
    "blockedReason" text,
    "blockedAt" timestamp(3) without time zone,
    "enableStaffModule" boolean DEFAULT false NOT NULL,
    "enablePackagesModule" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "categoryId" uuid
);


ALTER TABLE public.businesses OWNER TO dashboard;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    icon text,
    color text,
    "isActive" boolean DEFAULT true NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO dashboard;

--
-- Name: coverage_areas; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.coverage_areas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "businessId" uuid NOT NULL,
    "centerLocation" public.geography NOT NULL,
    "radiusKm" double precision NOT NULL,
    polygon public.geography,
    "baseFee" double precision DEFAULT 0 NOT NULL,
    "perKmRate" double precision DEFAULT 0 NOT NULL,
    "minOrderAmount" double precision,
    "maxDistanceKm" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.coverage_areas OWNER TO dashboard;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenantId" uuid NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    phone text,
    password text,
    "emailVerified" boolean DEFAULT false NOT NULL,
    avatar text,
    address text,
    city text,
    state text,
    "postalCode" text,
    country text,
    location public.geography,
    notes text,
    tags text[],
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "isVip" boolean DEFAULT false NOT NULL,
    source text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastName" text
);


ALTER TABLE public.customers OWNER TO dashboard;

--
-- Name: gallery_items; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.gallery_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "businessId" uuid NOT NULL,
    type text NOT NULL,
    url text NOT NULL,
    title text NOT NULL,
    description text,
    category text,
    "order" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.gallery_items OWNER TO dashboard;

--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.login_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    success boolean NOT NULL,
    "attemptedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "customerId" uuid
);


ALTER TABLE public.login_attempts OWNER TO dashboard;

--
-- Name: memberships; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.memberships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "businessId" uuid NOT NULL,
    role public."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.memberships OWNER TO dashboard;

--
-- Name: notification_logs; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.notification_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenantId" uuid NOT NULL,
    "recipientId" text NOT NULL,
    "recipientType" text NOT NULL,
    type public."NotificationType" NOT NULL,
    subject text,
    content text NOT NULL,
    status text NOT NULL,
    "sentAt" timestamp(3) without time zone,
    "failedAt" timestamp(3) without time zone,
    error text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notification_logs OWNER TO dashboard;

--
-- Name: package_purchases; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.package_purchases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenantId" uuid NOT NULL,
    "businessId" uuid NOT NULL,
    "packageId" uuid NOT NULL,
    "customerId" uuid NOT NULL,
    "purchaseDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiryDate" timestamp(3) without time zone,
    "totalSessions" integer NOT NULL,
    "usedSessions" integer DEFAULT 0 NOT NULL,
    "remainingSessions" integer NOT NULL,
    "pricePaid" double precision NOT NULL,
    "paymentMethod" text,
    "paymentStatus" public."PackagePaymentStatus" DEFAULT 'PENDING'::public."PackagePaymentStatus" NOT NULL,
    status public."PurchaseStatus" DEFAULT 'PENDING'::public."PurchaseStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.package_purchases OWNER TO dashboard;

--
-- Name: package_services; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.package_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "packageId" uuid NOT NULL,
    "serviceId" uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.package_services OWNER TO dashboard;

--
-- Name: packages; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenantId" uuid NOT NULL,
    "businessId" uuid NOT NULL,
    name text NOT NULL,
    description text,
    price double precision NOT NULL,
    "originalPrice" double precision,
    discount double precision,
    duration integer NOT NULL,
    image text,
    "isActive" boolean DEFAULT true NOT NULL,
    "validityDays" integer,
    "maxPurchases" integer,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "sessionCount" integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.packages OWNER TO dashboard;

--
-- Name: password_history; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.password_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "customerId" uuid NOT NULL,
    "passwordHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.password_history OWNER TO dashboard;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "appointmentId" uuid NOT NULL,
    "stripePaymentId" text,
    amount double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    method text,
    "refundAmount" double precision,
    "refundedAt" timestamp(3) without time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payments OWNER TO dashboard;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenantId" uuid NOT NULL,
    "businessId" uuid NOT NULL,
    "customerId" uuid NOT NULL,
    "appointmentId" uuid,
    rating integer NOT NULL,
    comment text,
    response text,
    "respondedAt" timestamp(3) without time zone,
    "isPublished" boolean DEFAULT false NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.reviews OWNER TO dashboard;

--
-- Name: route_etas; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.route_etas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "appointmentId" uuid NOT NULL,
    origin public.geography NOT NULL,
    destination public.geography NOT NULL,
    "distanceKm" double precision NOT NULL,
    "durationMinutes" integer NOT NULL,
    "trafficMultiplier" double precision DEFAULT 1.0 NOT NULL,
    provider text NOT NULL,
    "calculatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.route_etas OWNER TO dashboard;

--
-- Name: service_staff; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.service_staff (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "serviceId" uuid NOT NULL,
    "staffId" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.service_staff OWNER TO dashboard;

--
-- Name: services; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenantId" uuid NOT NULL,
    "businessId" uuid NOT NULL,
    name text NOT NULL,
    description text,
    duration integer NOT NULL,
    "bufferBefore" integer DEFAULT 0 NOT NULL,
    "bufferAfter" integer DEFAULT 0 NOT NULL,
    price double precision NOT NULL,
    "depositAmount" double precision,
    currency text DEFAULT 'USD'::text NOT NULL,
    category text,
    image text,
    "isActive" boolean DEFAULT true NOT NULL,
    "allowOnline" boolean DEFAULT true NOT NULL,
    "allowHomeService" boolean DEFAULT false NOT NULL,
    "maxAdvanceBooking" integer DEFAULT 30 NOT NULL,
    "minAdvanceBooking" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.services OWNER TO dashboard;

--
-- Name: session_usage; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.session_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "purchaseId" uuid NOT NULL,
    "appointmentId" uuid NOT NULL,
    "usedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sessionNumber" integer NOT NULL,
    notes text
);


ALTER TABLE public.session_usage OWNER TO dashboard;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "sessionToken" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "isAdmin" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sessions OWNER TO dashboard;

--
-- Name: staff; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.staff (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "businessId" uuid NOT NULL,
    "userId" uuid,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    avatar text,
    photo text,
    bio text,
    specialties text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "canAcceptBookings" boolean DEFAULT true NOT NULL,
    "commissionRate" double precision,
    rating double precision DEFAULT 0 NOT NULL,
    "totalReviews" integer DEFAULT 0 NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.staff OWNER TO dashboard;

--
-- Name: staff_reviews; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.staff_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "staffId" uuid NOT NULL,
    "customerId" uuid NOT NULL,
    "appointmentId" uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    response text,
    "respondedAt" timestamp(3) without time zone,
    "isPublished" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.staff_reviews OWNER TO dashboard;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    subdomain text NOT NULL,
    email text NOT NULL,
    phone text,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    locale text DEFAULT 'en'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tenants OWNER TO dashboard;

--
-- Name: users; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenantId" uuid NOT NULL,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    "passwordHash" text NOT NULL,
    name text NOT NULL,
    avatar text,
    phone text,
    language text DEFAULT 'en'::text NOT NULL,
    "totpSecret" text,
    "totpEnabled" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO dashboard;

--
-- Name: verification_codes; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.verification_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "customerId" uuid NOT NULL,
    code text NOT NULL,
    type public."VerificationType" NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.verification_codes OWNER TO dashboard;

--
-- Name: waitlist_entries; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.waitlist_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "appointmentId" uuid,
    "businessId" uuid NOT NULL,
    "customerId" uuid NOT NULL,
    "serviceId" uuid NOT NULL,
    "preferredDate" timestamp(3) without time zone NOT NULL,
    "preferredStaffId" uuid,
    flexibility text DEFAULT 'flexible'::text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "notifiedAt" timestamp(3) without time zone,
    "convertedAt" timestamp(3) without time zone,
    "expiredAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.waitlist_entries OWNER TO dashboard;

--
-- Name: working_hours; Type: TABLE; Schema: public; Owner: dashboard
--

CREATE TABLE public.working_hours (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "businessId" uuid NOT NULL,
    "staffId" uuid,
    "dayOfWeek" integer NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.working_hours OWNER TO dashboard;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


--
-- Data for Name: ad_placements; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.ad_placements (id, "tenantId", "businessId", "position", "startDate", "endDate", impressions, clicks, amount, "isPaid", "paidAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: addons; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.addons (id, "serviceId", name, description, price, duration, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: appointment_addons; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.appointment_addons (id, "appointmentId", "addonId", price, "createdAt") FROM stdin;
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.appointments (id, "tenantId", "businessId", "customerId", "serviceId", "staffId", "packageId", "packagePurchaseId", "customerName", "customerPhone", "startTime", "endTime", status, "isHomeService", "serviceAddress", "serviceLocation", "estimatedArrival", "actualArrival", "distanceKm", "travelTimeMinutes", notes, "internalNotes", price, "depositAmount", "totalAmount", "cancellationReason", "cancelledAt", "cancelledBy", "confirmedAt", "completedAt", "noShowAt", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.audit_logs (id, "tenantId", "userId", action, "entityType", "entityId", "oldValues", "newValues", "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: breaks; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.breaks (id, "staffId", title, "startTime", "endTime", "isRecurring", "recurringDays", date, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: businesses; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.businesses (id, "tenantId", name, slug, "customSlug", "businessType", description, logo, "coverImage", email, phone, website, address, city, state, "postalCode", country, location, timezone, currency, settings, features, "isActive", "isPremium", "isBlocked", "blockedReason", "blockedAt", "enableStaffModule", "enablePackagesModule", "createdAt", "updatedAt", "categoryId") FROM stdin;
fbe49050-282e-4359-bc69-edbc2b99c213	c821376e-fad4-4917-9fde-582850c30de8	Test Business	test-business	testbiz	\N	\N	\N	\N	business@example.com	1234567890	\N	123 Main St	New York	NY	10001	US	\N	America/New_York	USD	{}	{}	t	f	f	\N	\N	t	t	2025-09-09 01:36:05.079	2025-09-09 01:36:05.079	\N
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.categories (id, name, slug, description, icon, color, "isActive", "order", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: coverage_areas; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.coverage_areas (id, "businessId", "centerLocation", "radiusKm", polygon, "baseFee", "perKmRate", "minOrderAmount", "maxDistanceKm", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.customers (id, "tenantId", email, name, phone, password, "emailVerified", avatar, address, city, state, "postalCode", country, location, notes, tags, metadata, "isVip", source, "createdAt", "updatedAt", "lastName") FROM stdin;
ab925b22-8001-492b-9de0-dc481a34e902	c821376e-fad4-4917-9fde-582850c30de8	walny.mc@gmail.com	Walny	099400230	$2b$10$m1VXZXagq2lvgPDTZwBxZeKh/g8XZ3TcSE6iMvYlyQDZU1JC8z17.	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	f	DIRECT	2025-09-09 01:22:18.5	2025-09-09 01:22:18.5	Martinez
\.


--
-- Data for Name: gallery_items; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.gallery_items (id, "businessId", type, url, title, description, category, "order", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.login_attempts (id, email, "ipAddress", "userAgent", success, "attemptedAt", "customerId") FROM stdin;
a33c9adb-43c9-48d5-aeef-790bfaab7298	walny.mc@gmail.com	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	t	2025-09-09 01:22:54.123	ab925b22-8001-492b-9de0-dc481a34e902
f73429ba-12cf-45d2-bb0e-e14664366710	walny.mc@gmail.com	::1	curl/8.14.1	t	2025-09-09 01:33:14.77	ab925b22-8001-492b-9de0-dc481a34e902
ee059b6f-e0f2-4aea-b87c-64692f76ad37	walny.mc@gmail.com	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	t	2025-09-09 01:34:07.001	ab925b22-8001-492b-9de0-dc481a34e902
\.


--
-- Data for Name: memberships; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.memberships (id, "userId", "businessId", role, "createdAt", "updatedAt") FROM stdin;
4c893333-c7ed-4988-ab1f-e5c1dfc4815f	091874db-d14d-48b8-b5a6-32453ccab008	fbe49050-282e-4359-bc69-edbc2b99c213	OWNER	2025-09-09 01:36:05.082	2025-09-09 01:36:05.082
\.


--
-- Data for Name: notification_logs; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.notification_logs (id, "tenantId", "recipientId", "recipientType", type, subject, content, status, "sentAt", "failedAt", error, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: package_purchases; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.package_purchases (id, "tenantId", "businessId", "packageId", "customerId", "purchaseDate", "expiryDate", "totalSessions", "usedSessions", "remainingSessions", "pricePaid", "paymentMethod", "paymentStatus", status, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: package_services; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.package_services (id, "packageId", "serviceId", quantity, "createdAt") FROM stdin;
\.


--
-- Data for Name: packages; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.packages (id, "tenantId", "businessId", name, description, price, "originalPrice", discount, duration, image, "isActive", "validityDays", "maxPurchases", "displayOrder", "sessionCount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: password_history; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.password_history (id, "customerId", "passwordHash", "createdAt") FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.payments (id, "appointmentId", "stripePaymentId", amount, currency, status, method, "refundAmount", "refundedAt", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.reviews (id, "tenantId", "businessId", "customerId", "appointmentId", rating, comment, response, "respondedAt", "isPublished", "publishedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: route_etas; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.route_etas (id, "appointmentId", origin, destination, "distanceKm", "durationMinutes", "trafficMultiplier", provider, "calculatedAt", "expiresAt", metadata) FROM stdin;
\.


--
-- Data for Name: service_staff; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.service_staff (id, "serviceId", "staffId", "createdAt") FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.services (id, "tenantId", "businessId", name, description, duration, "bufferBefore", "bufferAfter", price, "depositAmount", currency, category, image, "isActive", "allowOnline", "allowHomeService", "maxAdvanceBooking", "minAdvanceBooking", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: session_usage; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.session_usage (id, "purchaseId", "appointmentId", "usedAt", "sessionNumber", notes) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.sessions (id, "userId", "sessionToken", expires, "ipAddress", "userAgent", "isAdmin", "createdAt") FROM stdin;
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.staff (id, "businessId", "userId", name, email, phone, avatar, photo, bio, specialties, "isActive", "canAcceptBookings", "commissionRate", rating, "totalReviews", "displayOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: staff_reviews; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.staff_reviews (id, "staffId", "customerId", "appointmentId", rating, comment, response, "respondedAt", "isPublished", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.tenants (id, name, subdomain, email, phone, timezone, currency, locale, "isActive", settings, "createdAt", "updatedAt") FROM stdin;
c821376e-fad4-4917-9fde-582850c30de8	Test Tenant	test	test@example.com	1234567890	America/New_York	USD	en-US	t	{}	2025-09-09 00:42:38.414	2025-09-09 00:42:38.414
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.users (id, "tenantId", email, "emailVerified", "passwordHash", name, avatar, phone, language, "totpSecret", "totpEnabled", "isActive", "isAdmin", "lastLoginAt", "createdAt", "updatedAt") FROM stdin;
091874db-d14d-48b8-b5a6-32453ccab008	c821376e-fad4-4917-9fde-582850c30de8	owner@example.com	2025-09-09 01:36:05.071	$2b$10$0qgYAJdca0lbJ/oyp4b1wem5.kP/22dmyVi7Eu9ng40JGEdRTKrbm	Business Owner	\N	\N	en	\N	f	t	f	\N	2025-09-09 01:36:05.073	2025-09-09 01:36:05.073
\.


--
-- Data for Name: verification_codes; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.verification_codes (id, "customerId", code, type, "expiresAt", "usedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: waitlist_entries; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.waitlist_entries (id, "appointmentId", "businessId", "customerId", "serviceId", "preferredDate", "preferredStaffId", flexibility, priority, "notifiedAt", "convertedAt", "expiredAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: working_hours; Type: TABLE DATA; Schema: public; Owner: dashboard
--

COPY public.working_hours (id, "businessId", "staffId", "dayOfWeek", "startTime", "endTime", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ad_placements ad_placements_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.ad_placements
    ADD CONSTRAINT ad_placements_pkey PRIMARY KEY (id);


--
-- Name: addons addons_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.addons
    ADD CONSTRAINT addons_pkey PRIMARY KEY (id);


--
-- Name: appointment_addons appointment_addons_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.appointment_addons
    ADD CONSTRAINT appointment_addons_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: breaks breaks_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.breaks
    ADD CONSTRAINT breaks_pkey PRIMARY KEY (id);


--
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: coverage_areas coverage_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.coverage_areas
    ADD CONSTRAINT coverage_areas_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: gallery_items gallery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.gallery_items
    ADD CONSTRAINT gallery_items_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);


--
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);


--
-- Name: package_purchases package_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.package_purchases
    ADD CONSTRAINT package_purchases_pkey PRIMARY KEY (id);


--
-- Name: package_services package_services_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.package_services
    ADD CONSTRAINT package_services_pkey PRIMARY KEY (id);


--
-- Name: packages packages_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT packages_pkey PRIMARY KEY (id);


--
-- Name: password_history password_history_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.password_history
    ADD CONSTRAINT password_history_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: route_etas route_etas_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.route_etas
    ADD CONSTRAINT route_etas_pkey PRIMARY KEY (id);


--
-- Name: service_staff service_staff_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.service_staff
    ADD CONSTRAINT service_staff_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: session_usage session_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.session_usage
    ADD CONSTRAINT session_usage_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: staff_reviews staff_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.staff_reviews
    ADD CONSTRAINT staff_reviews_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_codes verification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT verification_codes_pkey PRIMARY KEY (id);


--
-- Name: waitlist_entries waitlist_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.waitlist_entries
    ADD CONSTRAINT waitlist_entries_pkey PRIMARY KEY (id);


--
-- Name: working_hours working_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.working_hours
    ADD CONSTRAINT working_hours_pkey PRIMARY KEY (id);


--
-- Name: ad_placements_position_startDate_endDate_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "ad_placements_position_startDate_endDate_idx" ON public.ad_placements USING btree ("position", "startDate", "endDate");


--
-- Name: addons_serviceId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "addons_serviceId_idx" ON public.addons USING btree ("serviceId");


--
-- Name: appointment_addons_appointmentId_addonId_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "appointment_addons_appointmentId_addonId_key" ON public.appointment_addons USING btree ("appointmentId", "addonId");


--
-- Name: appointments_businessId_startTime_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "appointments_businessId_startTime_idx" ON public.appointments USING btree ("businessId", "startTime");


--
-- Name: appointments_customerId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "appointments_customerId_idx" ON public.appointments USING btree ("customerId");


--
-- Name: appointments_staffId_startTime_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "appointments_staffId_startTime_idx" ON public.appointments USING btree ("staffId", "startTime");


--
-- Name: appointments_status_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX appointments_status_idx ON public.appointments USING btree (status);


--
-- Name: audit_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "audit_logs_createdAt_idx" ON public.audit_logs USING btree ("createdAt");


--
-- Name: audit_logs_tenantId_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "audit_logs_tenantId_entityType_entityId_idx" ON public.audit_logs USING btree ("tenantId", "entityType", "entityId");


--
-- Name: breaks_staffId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "breaks_staffId_idx" ON public.breaks USING btree ("staffId");


--
-- Name: businesses_customSlug_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "businesses_customSlug_key" ON public.businesses USING btree ("customSlug");


--
-- Name: businesses_slug_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX businesses_slug_idx ON public.businesses USING btree (slug);


--
-- Name: businesses_tenantId_slug_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "businesses_tenantId_slug_key" ON public.businesses USING btree ("tenantId", slug);


--
-- Name: categories_isActive_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "categories_isActive_idx" ON public.categories USING btree ("isActive");


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: categories_slug_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX categories_slug_idx ON public.categories USING btree (slug);


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: coverage_areas_businessId_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "coverage_areas_businessId_key" ON public.coverage_areas USING btree ("businessId");


--
-- Name: customers_email_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX customers_email_idx ON public.customers USING btree (email);


--
-- Name: customers_tenantId_email_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "customers_tenantId_email_key" ON public.customers USING btree ("tenantId", email);


--
-- Name: gallery_items_businessId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "gallery_items_businessId_idx" ON public.gallery_items USING btree ("businessId");


--
-- Name: login_attempts_customerId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "login_attempts_customerId_idx" ON public.login_attempts USING btree ("customerId");


--
-- Name: login_attempts_email_attemptedAt_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "login_attempts_email_attemptedAt_idx" ON public.login_attempts USING btree (email, "attemptedAt");


--
-- Name: memberships_userId_businessId_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "memberships_userId_businessId_key" ON public.memberships USING btree ("userId", "businessId");


--
-- Name: notification_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "notification_logs_createdAt_idx" ON public.notification_logs USING btree ("createdAt");


--
-- Name: notification_logs_tenantId_recipientId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "notification_logs_tenantId_recipientId_idx" ON public.notification_logs USING btree ("tenantId", "recipientId");


--
-- Name: package_purchases_businessId_customerId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "package_purchases_businessId_customerId_idx" ON public.package_purchases USING btree ("businessId", "customerId");


--
-- Name: package_purchases_customerId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "package_purchases_customerId_idx" ON public.package_purchases USING btree ("customerId");


--
-- Name: package_purchases_status_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX package_purchases_status_idx ON public.package_purchases USING btree (status);


--
-- Name: package_services_packageId_serviceId_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "package_services_packageId_serviceId_key" ON public.package_services USING btree ("packageId", "serviceId");


--
-- Name: packages_businessId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "packages_businessId_idx" ON public.packages USING btree ("businessId");


--
-- Name: password_history_customerId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "password_history_customerId_idx" ON public.password_history USING btree ("customerId");


--
-- Name: payments_appointmentId_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "payments_appointmentId_key" ON public.payments USING btree ("appointmentId");


--
-- Name: payments_stripePaymentId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "payments_stripePaymentId_idx" ON public.payments USING btree ("stripePaymentId");


--
-- Name: payments_stripePaymentId_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "payments_stripePaymentId_key" ON public.payments USING btree ("stripePaymentId");


--
-- Name: reviews_appointmentId_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "reviews_appointmentId_key" ON public.reviews USING btree ("appointmentId");


--
-- Name: reviews_businessId_isPublished_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "reviews_businessId_isPublished_idx" ON public.reviews USING btree ("businessId", "isPublished");


--
-- Name: route_etas_appointmentId_calculatedAt_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "route_etas_appointmentId_calculatedAt_idx" ON public.route_etas USING btree ("appointmentId", "calculatedAt");


--
-- Name: service_staff_serviceId_staffId_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "service_staff_serviceId_staffId_key" ON public.service_staff USING btree ("serviceId", "staffId");


--
-- Name: services_businessId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "services_businessId_idx" ON public.services USING btree ("businessId");


--
-- Name: session_usage_appointmentId_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "session_usage_appointmentId_key" ON public.session_usage USING btree ("appointmentId");


--
-- Name: session_usage_purchaseId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "session_usage_purchaseId_idx" ON public.session_usage USING btree ("purchaseId");


--
-- Name: sessions_sessionToken_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "sessions_sessionToken_idx" ON public.sessions USING btree ("sessionToken");


--
-- Name: sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "sessions_sessionToken_key" ON public.sessions USING btree ("sessionToken");


--
-- Name: sessions_userId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "sessions_userId_idx" ON public.sessions USING btree ("userId");


--
-- Name: staff_businessId_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "staff_businessId_idx" ON public.staff USING btree ("businessId");


--
-- Name: staff_reviews_appointmentId_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "staff_reviews_appointmentId_key" ON public.staff_reviews USING btree ("appointmentId");


--
-- Name: staff_reviews_staffId_isPublished_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "staff_reviews_staffId_isPublished_idx" ON public.staff_reviews USING btree ("staffId", "isPublished");


--
-- Name: staff_userId_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "staff_userId_key" ON public.staff USING btree ("userId");


--
-- Name: tenants_subdomain_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX tenants_subdomain_idx ON public.tenants USING btree (subdomain);


--
-- Name: tenants_subdomain_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX tenants_subdomain_key ON public.tenants USING btree (subdomain);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_tenantId_email_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "users_tenantId_email_key" ON public.users USING btree ("tenantId", email);


--
-- Name: verification_codes_code_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX verification_codes_code_idx ON public.verification_codes USING btree (code);


--
-- Name: verification_codes_customerId_type_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "verification_codes_customerId_type_idx" ON public.verification_codes USING btree ("customerId", type);


--
-- Name: waitlist_entries_appointmentId_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "waitlist_entries_appointmentId_key" ON public.waitlist_entries USING btree ("appointmentId");


--
-- Name: waitlist_entries_businessId_preferredDate_idx; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE INDEX "waitlist_entries_businessId_preferredDate_idx" ON public.waitlist_entries USING btree ("businessId", "preferredDate");


--
-- Name: working_hours_businessId_staffId_dayOfWeek_key; Type: INDEX; Schema: public; Owner: dashboard
--

CREATE UNIQUE INDEX "working_hours_businessId_staffId_dayOfWeek_key" ON public.working_hours USING btree ("businessId", "staffId", "dayOfWeek");


--
-- Name: ad_placements ad_placements_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.ad_placements
    ADD CONSTRAINT "ad_placements_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ad_placements ad_placements_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.ad_placements
    ADD CONSTRAINT "ad_placements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: addons addons_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.addons
    ADD CONSTRAINT "addons_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: appointment_addons appointment_addons_addonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.appointment_addons
    ADD CONSTRAINT "appointment_addons_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES public.addons(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointment_addons appointment_addons_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.appointment_addons
    ADD CONSTRAINT "appointment_addons_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: appointments appointments_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: appointments appointments_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: appointments appointments_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public.packages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointments appointments_packagePurchaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_packagePurchaseId_fkey" FOREIGN KEY ("packagePurchaseId") REFERENCES public.package_purchases(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: appointments appointments_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "appointments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: breaks breaks_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.breaks
    ADD CONSTRAINT "breaks_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: businesses businesses_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT "businesses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: businesses businesses_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT "businesses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: coverage_areas coverage_areas_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.coverage_areas
    ADD CONSTRAINT "coverage_areas_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customers customers_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gallery_items gallery_items_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.gallery_items
    ADD CONSTRAINT "gallery_items_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: login_attempts login_attempts_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT "login_attempts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberships memberships_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT "memberships_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberships memberships_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification_logs notification_logs_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT "notification_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: package_purchases package_purchases_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.package_purchases
    ADD CONSTRAINT "package_purchases_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: package_purchases package_purchases_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.package_purchases
    ADD CONSTRAINT "package_purchases_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: package_purchases package_purchases_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.package_purchases
    ADD CONSTRAINT "package_purchases_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public.packages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: package_purchases package_purchases_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.package_purchases
    ADD CONSTRAINT "package_purchases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: package_services package_services_packageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.package_services
    ADD CONSTRAINT "package_services_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES public.packages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: package_services package_services_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.package_services
    ADD CONSTRAINT "package_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: packages packages_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT "packages_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: packages packages_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT "packages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: password_history password_history_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.password_history
    ADD CONSTRAINT "password_history_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reviews reviews_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: route_etas route_etas_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.route_etas
    ADD CONSTRAINT "route_etas_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_staff service_staff_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.service_staff
    ADD CONSTRAINT "service_staff_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_staff service_staff_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.service_staff
    ADD CONSTRAINT "service_staff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: services services_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "services_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: services services_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT "services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: session_usage session_usage_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.session_usage
    ADD CONSTRAINT "session_usage_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: session_usage session_usage_purchaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.session_usage
    ADD CONSTRAINT "session_usage_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES public.package_purchases(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff staff_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT "staff_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff_reviews staff_reviews_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.staff_reviews
    ADD CONSTRAINT "staff_reviews_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff_reviews staff_reviews_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.staff_reviews
    ADD CONSTRAINT "staff_reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff_reviews staff_reviews_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.staff_reviews
    ADD CONSTRAINT "staff_reviews_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff staff_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT "staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: verification_codes verification_codes_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT "verification_codes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: waitlist_entries waitlist_entries_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.waitlist_entries
    ADD CONSTRAINT "waitlist_entries_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: working_hours working_hours_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.working_hours
    ADD CONSTRAINT "working_hours_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: working_hours working_hours_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dashboard
--

ALTER TABLE ONLY public.working_hours
    ADD CONSTRAINT "working_hours_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public.staff(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: dashboard
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

