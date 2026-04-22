-- Run after 0001_orders.sql:
--   npx wrangler d1 execute axionpad-db --file=migrations/0002_reviews.sql --remote

CREATE TABLE IF NOT EXISTS reviews (
  id            TEXT    PRIMARY KEY,
  product_id    TEXT    NOT NULL,                         -- product slug (e.g. "axion-pad-pro")
  customer_name TEXT    NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT    NOT NULL DEFAULT '',
  verified      INTEGER NOT NULL DEFAULT 0,               -- 1 = confirmed purchaser
  created_at    INTEGER NOT NULL                          -- Unix timestamp
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews (product_id, created_at DESC);
