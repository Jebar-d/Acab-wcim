USE acab_wcim;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id VARCHAR(64) PRIMARY KEY,
  po_number VARCHAR(80) NOT NULL UNIQUE,
  supplier_id VARCHAR(64) NOT NULL,
  supplier_name VARCHAR(190) NOT NULL,
  material_id VARCHAR(64) NOT NULL,
  material VARCHAR(190) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  quantity DECIMAL(14,3) NOT NULL,
  unit_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  order_date DATE NOT NULL,
  expected_date DATE NOT NULL,
  received_at DATETIME NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Pending',
  notes TEXT NULL,
  created_by VARCHAR(64) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_purchase_orders_status_date (status, order_date),
  INDEX idx_purchase_orders_supplier (supplier_id)
) ENGINE=InnoDB;
