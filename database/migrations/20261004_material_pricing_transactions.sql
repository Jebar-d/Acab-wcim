USE acab_wcim;

-- Idempotent upgrade for material pricing, quotation/order snapshots, and
-- delivery receipt fields used by the customer and staff API.
SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='materials' AND column_name='unit_price')=0,
  'ALTER TABLE materials ADD COLUMN unit_price DECIMAL(14,2) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='quotations' AND column_name='total_amount')=0,
  'ALTER TABLE quotations ADD COLUMN total_amount DECIMAL(14,2) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='orders' AND column_name='order_no')=0,
  'ALTER TABLE orders ADD COLUMN order_no VARCHAR(80) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='orders' AND column_name='total_amount')=0,
  'ALTER TABLE orders ADD COLUMN total_amount DECIMAL(14,2) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='orders' AND column_name='order_no' AND non_unique=0)=0,
  'CREATE UNIQUE INDEX uq_orders_order_no ON orders(order_no)',
  'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='delivery_receipts' AND column_name='order_id')=0,
  'ALTER TABLE delivery_receipts ADD COLUMN order_id VARCHAR(64) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='delivery_receipts' AND column_name='delivery_method')=0,
  'ALTER TABLE delivery_receipts ADD COLUMN delivery_method VARCHAR(80) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='delivery_receipts' AND column_name='delivery_address')=0,
  'ALTER TABLE delivery_receipts ADD COLUMN delivery_address TEXT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='delivery_receipts' AND column_name='payment_method')=0,
  'ALTER TABLE delivery_receipts ADD COLUMN payment_method VARCHAR(80) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='delivery_receipts' AND column_name='total_amount')=0,
  'ALTER TABLE delivery_receipts ADD COLUMN total_amount DECIMAL(14,2) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='delivery_receipts' AND index_name='idx_delivery_order_id')=0,
  'CREATE INDEX idx_delivery_order_id ON delivery_receipts(order_id)',
  'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
