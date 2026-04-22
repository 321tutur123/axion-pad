-- Run once against your D1 database:
--   npx wrangler d1 execute axionpad-db --file=migrations/0001_orders.sql --remote

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT     PRIMARY KEY,  -- Stripe checkout session ID (cs_...)
  order_number     TEXT     NOT NULL,     -- AXN-... from session metadata
  status           TEXT     NOT NULL DEFAULT 'pending',
  payment_status   TEXT     NOT NULL DEFAULT 'unpaid',
  customer_email   TEXT     NOT NULL,
  customer_name    TEXT,
  amount_total     INTEGER  NOT NULL,     -- cents, shipping included
  currency         TEXT     NOT NULL DEFAULT 'EUR',
  shipping_name    TEXT,
  shipping_address TEXT,                  -- JSON: {line1, city, postal_code, country, …}
  items            TEXT     NOT NULL DEFAULT '[]', -- JSON array of {name, quantity, unit_price, subtotal}
  created_at       INTEGER  NOT NULL      -- Unix timestamp from Stripe
);
