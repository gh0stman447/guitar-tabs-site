-- Выполнить отдельно в guitar_tabs_dev, затем после проверки — в guitar_tabs.
-- Позволяет создавать Telegram-аккаунты до добавления email.

BEGIN;

ALTER TABLE public.users
  ALTER COLUMN email DROP NOT NULL;

COMMIT;
