USE acab_wcim;

-- Support both the current schema (which already has image_url) and databases
-- created before material images were introduced.
SET @material_image_column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'materials'
    AND COLUMN_NAME IN ('img_url', 'image_url')
);
SET @material_image_column_ddl = IF(
  @material_image_column_exists = 0,
  'ALTER TABLE materials ADD COLUMN image_url VARCHAR(500) NULL AFTER status',
  'SELECT 1'
);
PREPARE material_image_column_stmt FROM @material_image_column_ddl;
EXECUTE material_image_column_stmt;
DEALLOCATE PREPARE material_image_column_stmt;

INSERT INTO categories (id, name, description, status, created_at, updated_at) VALUES
  ('cat-blocks','Hollow Blocks','Concrete hollow block products','active',NOW(),NOW()),
  ('cat-sand','Sand','Construction sand and aggregates','active',NOW(),NOW()),
  ('cat-glass','Glass','Glass products for construction','active',NOW(),NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name), updated_at=NOW();

-- Seed these requested catalog entries without inventing opening stock.
INSERT IGNORE INTO materials (id,sku,name,category,unit,quantity,minimum_stock,status,created_at,updated_at) VALUES
  ('mat-hollow-blocks','BLK-001','Hollow Blocks','Hollow Blocks','Piece',0,0,'Unavailable',NOW(),NOW()),
  ('mat-sand','SND-001','Construction Sand','Sand','Cubic Meter',0,0,'Unavailable',NOW(),NOW()),
  ('mat-glass','GLS-001','Construction Glass','Glass','Sheet',0,0,'Unavailable',NOW(),NOW());
