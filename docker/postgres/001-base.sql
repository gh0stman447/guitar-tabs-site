-- Bootstrap only for a NEW local guitar_tabs_dev database, not a production migration.
BEGIN;
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
  UNIQUE (tab_id, format)1
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
COMMIT;
