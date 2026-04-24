-- Adds tracking_number column to orders table
--   npx wrangler d1 execute axionpad-db --file=migrations/0003_add_tracking.sql --remote

ALTER TABLE orders ADD COLUMN tracking_number TEXT NOT NULL DEFAULT '';
