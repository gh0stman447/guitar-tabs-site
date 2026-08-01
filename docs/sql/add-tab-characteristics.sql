-- Выполнить отдельно в guitar_tabs_dev, затем после проверки — в guitar_tabs.
-- Один JSONB-объект хранит техники, строй и номер лада каподастра.

BEGIN;

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

COMMIT;
