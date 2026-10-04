ACAB WCIM PHP API
=================

This folder contains api.php.

Recommended XAMPP placement:
C:\xampp\htdocs\acab-wcim-api\api.php

Recommended browser/API URL:
http://localhost/acab-wcim-api/api.php

Alternative valid placement:
C:\xampp\htdocs\acab-wcim\api\api.php
URL:
http://localhost/acab-wcim/api/api.php

If you keep the api folder from the project, copy its api.php file directly into
C:\xampp\htdocs\acab-wcim-api\ rather than creating another nested api folder.

Make sure Apache and MySQL are running in XAMPP and that the database
acab_wcim has been imported into phpMyAdmin.

For an existing database, apply database/migrations/20261004_quote_customer_confirmation.sql
before deploying the quotation customer-confirmation workflow. It is safe to reapply.

For the customer "Submit changes for review" workflow, apply
database/migrations/20261005_order_edit_approval.sql to acab_wcim using phpMyAdmin's
Import or SQL tab. It creates the order_edit_requests table and is safe to reapply.

For purchasing, apply database/migrations/20261005_purchase_orders.sql before
deploying the supplier and purchase-order workflow. Receiving an ordered PO adds
one stock-in record and updates material inventory in a single database transaction.
