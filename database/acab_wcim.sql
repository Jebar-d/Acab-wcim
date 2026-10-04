-- ACAB WCIM MySQL database for XAMPP/phpMyAdmin
-- MySQL 8.0+
CREATE DATABASE IF NOT EXISTS acab_wcim CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE acab_wcim;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','staff','admin') NOT NULL DEFAULT 'user',
  employee_id VARCHAR(64) NULL UNIQUE,
  status ENUM('active','pending','rejected') NOT NULL DEFAULT 'active',
  phone VARCHAR(50) NULL,
  avatar_url VARCHAR(500) NULL,
  notification_email TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  reviewed_by VARCHAR(160) NULL,
  reviewed_at DATETIME NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_users_role_status (role, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_expiry (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS addresses (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  label VARCHAR(80) NOT NULL DEFAULT 'Primary',
  recipient_name VARCHAR(160) NOT NULL,
  phone VARCHAR(50) NULL,
  line1 VARCHAR(255) NOT NULL,
  line2 VARCHAR(255) NULL,
  barangay VARCHAR(120) NULL,
  city VARCHAR(120) NULL,
  province VARCHAR(120) NULL,
  postal_code VARCHAR(20) NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_addresses_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(64) PRIMARY KEY,
  account_id VARCHAR(64) NULL,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(50) NULL,
  company VARCHAR(190) NULL,
  address VARCHAR(500) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_clients_account (account_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS materials (
  id VARCHAR(64) PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(190) NOT NULL,
  category VARCHAR(160) NOT NULL,
  unit VARCHAR(80) NOT NULL,
  quantity DECIMAL(14,3) NOT NULL DEFAULT 0,
  minimum_stock DECIMAL(14,3) NOT NULL DEFAULT 0,
  status ENUM('Available','Limited','Unavailable') NOT NULL DEFAULT 'Available',
  image_url VARCHAR(500) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_material_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  contact VARCHAR(160) NULL,
  phone VARCHAR(50) NULL,
  email VARCHAR(190) NULL,
  address VARCHAR(500) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inquiries (
  id VARCHAR(64) PRIMARY KEY,
  account_id VARCHAR(64) NULL,
  project VARCHAR(190) NOT NULL,
  project_type VARCHAR(120) NOT NULL,
  location VARCHAR(255) NOT NULL,
  materials TEXT NOT NULL,
  quantity VARCHAR(255) NOT NULL,
  timeline VARCHAR(255) NOT NULL,
  notes TEXT NULL,
  customer_change_request TEXT NULL,
  status VARCHAR(80) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_inquiries_account (account_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quotations (
  id VARCHAR(64) PRIMARY KEY,
  inquiry_id VARCHAR(64) NULL,
  client_id VARCHAR(64) NULL,
  account_id VARCHAR(64) NULL,
  customer_name VARCHAR(160) NULL,
  customer_email VARCHAR(160) NULL,
  customer_phone VARCHAR(80) NULL,
  project_name VARCHAR(190) NOT NULL,
  project_type VARCHAR(120) NOT NULL,
  location VARCHAR(255) NOT NULL,
  materials TEXT NOT NULL,
  quantity VARCHAR(255) NOT NULL,
  timeline VARCHAR(255) NOT NULL,
  notes TEXT NULL,
  status VARCHAR(80) NOT NULL DEFAULT 'pending',
  inventory_status VARCHAR(30) NULL,
  checklist_status VARCHAR(80) NULL,
  confirmed_at DATETIME NULL,
  confirmation_sent_at DATETIME NULL,
  customer_confirmed_at DATETIME NULL,
  order_id VARCHAR(64) NULL,
  expires_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  cancelled_by VARCHAR(64) NULL,
  cancel_reason TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_quotes_account_status (account_id, status),
  INDEX idx_quotes_expiry (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  quotation_id VARCHAR(64) NULL,
  inquiry_id VARCHAR(64) NULL,
  client_id VARCHAR(64) NULL,
  account_id VARCHAR(64) NULL,
  project_name VARCHAR(190) NOT NULL,
  client_name VARCHAR(160) NOT NULL,
  materials TEXT NOT NULL,
  quantity VARCHAR(255) NOT NULL,
  status VARCHAR(80) NOT NULL DEFAULT 'Pending',
  delivery_method VARCHAR(80) NULL,
  delivery_address_id VARCHAR(64) NULL,
  payment_method VARCHAR(80) NULL,
  notes TEXT NULL,
  confirmed_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_orders_account_status (account_id, status)
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NULL,
  account_id VARCHAR(64) NULL,
  actor_user_id VARCHAR(64) NULL,
  actor_role VARCHAR(20) NULL,
  type VARCHAR(80) NOT NULL,
  status VARCHAR(80) NOT NULL,
  title VARCHAR(190) NOT NULL,
  message TEXT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_transactions_order (order_id),
  INDEX idx_transactions_account (account_id),
  INDEX idx_transactions_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS delivery_receipts (
  id VARCHAR(64) PRIMARY KEY,
  dr_number VARCHAR(80) NOT NULL UNIQUE,
  order_number VARCHAR(64) NOT NULL,
  client VARCHAR(160) NOT NULL,
  items TEXT NOT NULL,
  sku VARCHAR(100) NOT NULL DEFAULT '',
  quantity DECIMAL(14,3) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  released_by VARCHAR(160) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Draft',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_delivery_order (order_number)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock_in (
  id VARCHAR(64) PRIMARY KEY,
  stock_in_id VARCHAR(80) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  material VARCHAR(190) NOT NULL,
  quantity DECIMAL(14,3) NOT NULL,
  supplier VARCHAR(190) NOT NULL,
  received_by VARCHAR(160) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Confirmed',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock_out (
  id VARCHAR(64) PRIMARY KEY,
  stock_out_id VARCHAR(80) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  material VARCHAR(190) NOT NULL,
  quantity DECIMAL(14,3) NOT NULL,
  order_ref VARCHAR(80) NOT NULL,
  destination VARCHAR(190) NOT NULL,
  warehouse_staff VARCHAR(160) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Draft',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS checklists (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  status VARCHAR(80) NOT NULL DEFAULT 'Checklist Pending',
  items_json JSON NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS checklist_items (
  id VARCHAR(64) PRIMARY KEY,
  checklist_id VARCHAR(64) NOT NULL,
  label VARCHAR(255) NOT NULL,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ledger_entries (
  id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(80) NOT NULL,
  reference VARCHAR(100) NULL,
  description TEXT NOT NULL,
  amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  date_value DATE NULL,
  party VARCHAR(190) NULL,
  project VARCHAR(190) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Posted',
  debit DECIMAL(14,2) NOT NULL DEFAULT 0,
  credit DECIMAL(14,2) NOT NULL DEFAULT 0,
  balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  source VARCHAR(80) NULL,
  source_id VARCHAR(64) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  audience VARCHAR(20) NOT NULL,
  account_id VARCHAR(64) NULL,
  title VARCHAR(190) NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  read_at DATETIME NULL,
  href VARCHAR(500) NULL,
  FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_account (account_id, read_at),
  INDEX idx_notifications_audience (audience, read_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_user_id VARCHAR(64) NULL,
  entity VARCHAR(80) NOT NULL,
  entity_id VARCHAR(64) NULL,
  action VARCHAR(40) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

-- Seed default administrative accounts for initial XAMPP setup.
-- Change these passwords after first login.
INSERT INTO users (id, name, email, password_hash, role, employee_id, status, created_at, updated_at)
VALUES
('acct-admin-001','System Administrator','admin@acabwcim.local','$2y$12$9xKydfS5qtxHInY0yjxwy.EZAzdB7f5WCNjRdUI9zDWkuXTXGkeMi','admin','ADM-0001','active',NOW(),NOW()),
('acct-staff-001','Warehouse Staff','staff@acabwcim.local','$2y$12$gsr19VmL0VSPv8nBeUJwpOjmsD34UE.2z7SwRwGltg.DrIwmrkkC.','staff','EMP-1001','active',NOW(),NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), employee_id=VALUES(employee_id), status='active', updated_at=NOW();

-- Seed only core inventory categories/materials; accounts are created by registration.
INSERT INTO categories (id, name, description, status, created_at, updated_at)
VALUES
('cat-cement','Cement','Cement and binder products','active',NOW(),NOW()),
('cat-steel','Steel Bars','Reinforcement and structural steel','active',NOW(),NOW()),
('cat-lumber','Lumber','Structural and finish timber','active',NOW(),NOW()),
('cat-blocks','Hollow Blocks','Concrete hollow block products','active',NOW(),NOW()),
('cat-sand','Sand','Construction sand and aggregates','active',NOW(),NOW()),
('cat-glass','Glass','Glass products for construction','active',NOW(),NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name), updated_at=NOW();

INSERT INTO materials (id, sku, name, category, unit, quantity, minimum_stock, status, created_at, updated_at)
VALUES
('mat-portland-cement','CEM-001','Portland Cement','Cement','Bag',120,30,'Available',NOW(),NOW()),
('mat-structural-steel','STL-001','Structural Steel Bars','Steel Bars','Piece',42,20,'Limited',NOW(),NOW()),
('mat-lumber','LMB-001','Structural Lumber','Lumber','Piece',68,25,'Available',NOW(),NOW()),
('mat-hollow-blocks','BLK-001','Hollow Blocks','Hollow Blocks','Piece',0,0,'Unavailable',NOW(),NOW()),
('mat-sand','SND-001','Construction Sand','Sand','Cubic Meter',0,0,'Unavailable',NOW(),NOW()),
('mat-glass','GLS-001','Construction Glass','Glass','Sheet',0,0,'Unavailable',NOW(),NOW())
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity), minimum_stock=VALUES(minimum_stock), updated_at=NOW();

