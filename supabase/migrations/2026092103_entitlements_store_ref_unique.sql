-- One store receipt entitles ONE account.
--
-- ⛔ THE HOLE. `entitlements` is unique on (user_id, product) and on nothing
-- else, so the same Apple transaction id / Google purchase token can be
-- validated by any number of app accounts, each getting its own row and its
-- own paid access. One subscription, unlimited members. `validate-purchase`
-- never checks whether the receipt it just verified is already bound to
-- somebody else — verifying a receipt proves the PURCHASE is real, not that
-- the caller is the person who made it.
--
-- The refund path makes the shape of it clear: store-notifications revokes by
-- `.in('store_ref', [token])`, which would mark every one of those accounts
-- refunded together. The column is already treated as though it identified a
-- single purchase; nothing enforced it.
--
-- ⛔ WHY THE INDEX IS PARTIAL, AND WHY A PLAIN UNIQUE INDEX WOULD BREAK
-- ACCESS CODES: store_ref is not only a receipt id. `redeem_access_code`
-- writes the CODE ITSELF into store_ref with source = 'access_code', and a
-- code is redeemed by many people by design. A blanket UNIQUE (store_ref)
-- would let the first redemption through and reject every one after it. So
-- this is scoped to the two store sources, which are the only ones where the
-- value is a per-purchase identifier.
--
-- Verified against production 2026-09-21 before applying:
--   • entitlements holds 3 rows, ALL source='admin_grant' with store_ref NULL
--   • so there is no purchase data yet, nothing to migrate, and no existing
--     duplicate that could make this index fail to build
--   • the source CHECK constraint allows exactly
--     app_store / play_store / admin_grant / institutional / access_code
--
-- This is the database-level guarantee. `validate-purchase` also refuses the
-- second account explicitly, so the customer gets a clear message instead of
-- a constraint violation — but the index is what makes it true regardless of
-- which code path writes the row.

CREATE UNIQUE INDEX IF NOT EXISTS entitlements_store_ref_unique
  ON public.entitlements (store_ref)
  WHERE store_ref IS NOT NULL AND source IN ('app_store', 'play_store');

COMMENT ON INDEX public.entitlements_store_ref_unique IS
  'One store receipt entitles one account. Partial on purpose: access codes '
  'also live in store_ref (source=access_code) and are redeemed many times.';
