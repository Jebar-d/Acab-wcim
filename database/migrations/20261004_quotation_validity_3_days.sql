USE acab_wcim;

-- Bring previously created quotations onto the three-day validity policy.
UPDATE quotations
SET expires_at = DATE_ADD(created_at, INTERVAL 3 DAY);
