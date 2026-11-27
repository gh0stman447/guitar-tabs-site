-- Только для НОВОЙ ПУСТОЙ базы Onreza. Не выполняет миграцию существующей production.
-- Dev SQL: docker/postgres/001-base.sql и миграции в docs/sql (см. compose.yaml).
BEGIN;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') THEN
    RAISE EXCEPTION 'Bootstrap requires an empty public schema';
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE public."guitar-tabs" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  title_ru text NOT NULL,
  title_en text NOT NULL,
  difficulty text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  description_ru text,
  description_en text,
  photo_url text,
  files jsonb NOT NULL DEFAULT '{}',
  purchase_count integer NOT NULL DEFAULT 0,
  youtube_url text,
  is_published boolean NOT NULL DEFAULT false
);
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  firstname text NOT NULL,
  email text NOT NULL UNIQUE,
  newsletter boolean NOT NULL DEFAULT false
);
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  customer_id uuid REFERENCES public.customers(id),
  tab_id uuid REFERENCES public."guitar-tabs"(id),
  tab_ids jsonb,
  amount integer NOT NULL,
  payment_id text,
  status text NOT NULL DEFAULT 'pending',
  resend_email_id text,
  email_status text,
  receipt_url text,
  delivered_at timestamptz,
  opened_at timestamptz
);
CREATE TABLE public.tab_files (
  id serial PRIMARY KEY,
  tab_id uuid NOT NULL REFERENCES public."guitar-tabs"(id) ON DELETE CASCADE,
  format varchar(10) NOT NULL,
  filename text NOT NULL,
  content_type varchar(100),
  data bytea,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tab_id, format)
);
CREATE TABLE public.tab_downloads (
  id bigserial PRIMARY KEY,
  tab_id uuid NOT NULL REFERENCES public."guitar-tabs"(id) ON DELETE CASCADE,
  downloaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tab_downloads_tab_id_idx ON public.tab_downloads(tab_id);
CREATE TABLE public.newsletter_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  resend_email_id text,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  delivered_at timestamptz,
  opened_at timestamptz
);

ALTER TABLE public."guitar-tabs"
ADD COLUMN IF NOT EXISTS characteristics jsonb NOT NULL
DEFAULT '{"techniques":[],"tuning":"standard","capo":0}'::jsonb;

ALTER TABLE public."guitar-tabs"
DROP CONSTRAINT IF EXISTS guitar_tabs_characteristics_check;

ALTER TABLE public."guitar-tabs"
ADD CONSTRAINT guitar_tabs_characteristics_check CHECK (
  jsonb_typeof(characteristics) = 'object'
  AND jsonb_typeof(characteristics->'techniques') = 'array'
  AND characteristics->>'tuning' IN ('standard', 'drop_d', 'nonstandard', 'custom')
  AND (characteristics->>'capo')::integer BETWEEN 0 AND 12
  AND (
    characteristics->>'tuning' <> 'custom'
    OR nullif(btrim(characteristics->>'customTuning'), '') IS NOT NULL
  )
);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  password_hash text,
  email_verified_at timestamptz,
  personal_data_consent_at timestamptz NOT NULL,
  personal_data_consent_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  merged_into_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
  ON public.users (lower(email))
  WHERE merged_into_user_id IS NULL;

CREATE TABLE IF NOT EXISTS public.user_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('email', 'telegram')),
  provider_user_id text NOT NULL,
  provider_username text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id),
  UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx
  ON public.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx
  ON public.user_sessions (expires_at);

CREATE TABLE IF NOT EXISTS public.user_auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_auth_tokens_lookup_idx
  ON public.user_auth_tokens (purpose, token_hash)
  WHERE used_at IS NULL;

CREATE TABLE IF NOT EXISTS public.account_merge_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  target_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (target_user_id <> source_user_id)
);

CREATE INDEX IF NOT EXISTS account_merge_attempts_lookup_idx
  ON public.account_merge_attempts (token_hash)
  WHERE used_at IS NULL;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS customers_user_id_idx
  ON public.customers (user_id);

ALTER TABLE public.users
  ALTER COLUMN email DROP NOT NULL;
COMMIT;
