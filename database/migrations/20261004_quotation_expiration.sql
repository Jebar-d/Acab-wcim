USE acab_wcim;

-- Run once against an existing database to add quotation validity and
-- cancellation metadata. Fresh installs already receive these in acab_wcim.sql.
ALTER TABLE quotations
  ADD COLUMN expires_at DATETIME NULL AFTER order_id,
  ADD COLUMN cancelled_at DATETIME NULL AFTER expires_at,
  ADD COLUMN cancelled_by VARCHAR(64) NULL AFTER cancelled_at,
  ADD COLUMN cancel_reason TEXT NULL AFTER cancelled_by,
  ADD INDEX idx_quotes_expiry (expires_at);

-- Existing quotations are given the same three day validity window as new
-- requests, based on their original creation date.
UPDATE quotations
SET expires_at = DATE_ADD(created_at, INTERVAL 3 DAY)
WHERE expires_at IS NULL;

CREATE TABLE IF NOT EXISTS order_edit_requests (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  account_id VARCHAR(64) NOT NULL,
  requested_items JSON NOT NULL,
  previous_items JSON NOT NULL,
  previous_order_status VARCHAR(80) NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  requested_at DATETIME NOT NULL,
  reviewed_at DATETIME NULL,
  reviewed_by VARCHAR(64) NULL,
  rejection_reason TEXT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_order_edit_status (status, requested_at)
) ENGINE=InnoDB;
