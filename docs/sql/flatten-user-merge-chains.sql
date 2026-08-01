-- Выполнить отдельно в guitar_tabs_dev, затем после проверки — в guitar_tabs.
-- Распрямляет существующие цепочки объединённых аккаунтов A -> B -> C в A -> C, B -> C.

BEGIN;

CREATE TEMP TABLE resolved_user_roots ON COMMIT DROP AS
WITH RECURSIVE chains AS (
  SELECT
    id AS origin_id,
    id AS current_id,
    merged_into_user_id AS next_id,
    ARRAY[id] AS visited
  FROM public.users

  UNION ALL

  SELECT
    chain.origin_id,
    parent.id,
    parent.merged_into_user_id,
    chain.visited || parent.id
  FROM chains chain
  JOIN public.users parent ON parent.id = chain.next_id
  WHERE NOT parent.id = ANY(chain.visited)
)
SELECT origin_id, current_id AS root_id
FROM chains
WHERE next_id IS NULL;

UPDATE public.customers customer
SET user_id = root.root_id
FROM resolved_user_roots root
WHERE customer.user_id = root.origin_id
  AND root.origin_id <> root.root_id;

DELETE FROM public.user_sessions session
USING resolved_user_roots root
WHERE session.user_id = root.origin_id
  AND root.origin_id <> root.root_id;

UPDATE public.users account
SET merged_into_user_id = root.root_id,
    updated_at = now()
FROM resolved_user_roots root
WHERE account.id = root.origin_id
  AND root.origin_id <> root.root_id
  AND account.merged_into_user_id IS DISTINCT FROM root.root_id;

COMMIT;
