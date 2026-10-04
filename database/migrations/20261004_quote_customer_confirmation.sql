-- Safe to apply to an existing database, including one where the column exists.
SET @customer_change_request_exists = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'quotations'
    AND column_name = 'customer_change_request'
);

SET @customer_change_request_sql = IF(
  @customer_change_request_exists = 0,
  'ALTER TABLE quotations ADD COLUMN customer_change_request TEXT NULL AFTER notes',
  'SELECT 1'
);

PREPARE customer_change_request_stmt FROM @customer_change_request_sql;
EXECUTE customer_change_request_stmt;
DEALLOCATE PREPARE customer_change_request_stmt;
