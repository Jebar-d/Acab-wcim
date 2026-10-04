USE acab_wcim;

-- Preserve the current item snapshot and each customer edit request so staff
-- decisions remain auditable without replacing the original order record.
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
