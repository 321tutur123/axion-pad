-- Adds stripe_event_id for webhook idempotency (prevents double-processing on Stripe retries)
--   npx wrangler d1 execute axionpad-db --file=migrations/0004_idempotency.sql --remote

ALTER TABLE orders ADD COLUMN stripe_event_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_event_id ON orders (stripe_event_id) WHERE stripe_event_id IS NOT NULL;
