# ACAB WCIM — XAMPP / MySQL / PHP setup

The project now uses MySQL through a small PHP API instead of browser storage for application data.

## 1. Import the database

1. Start **Apache** and **MySQL** in XAMPP.
2. Open `http://localhost/phpmyadmin`.
3. Import `database/acab_wcim.sql`.
4. The script creates the `acab_wcim` database and its tables.

## 2. Put the PHP API in XAMPP

Copy the project's `api` folder to:

`C:\xampp\htdocs\acab-wcim\api`

That makes the API available at:

`http://localhost/acab-wcim/api/api.php`

The included PHP file uses the normal XAMPP MySQL defaults:

- host: `127.0.0.1`
- database: `acab_wcim`
- user: `root`
- password: empty

Change those constants in `api/api.php` when the XAMPP MySQL account uses a password.

## Default accounts

The SQL import now creates these active accounts for initial testing:

- **Admin** — `admin@acabwcim.local` / `Admin@12345`
- **Staff** — `staff@acabwcim.local` / `Staff@12345`

Change these passwords after first login.

## 3. Configure Next.js

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost/acab-wcim/api/api.php
```

For a frontend running on `127.0.0.1:3000`, the PHP API also permits that origin.

## 4. Start the project

In the Next.js project:

```bash
npm install
npm run dev
```

The normal flow is:

`Next.js browser UI → PHP API → MySQL`

Theme preference storage is intentionally still local to the browser because it is a UI preference rather than application/business data.

## Included database areas

Users/authentication, sessions, profile addresses, clients, materials/inventory, categories, suppliers, inquiries, quotations, orders, order transactions, delivery receipts, stock-in, stock-out, checklists, ledgers, notifications, and audit logs are represented in MySQL.

## Transaction flow

Customer request → staff quotation review → customer confirmation → order transaction → staff/admin status updates → warehouse stock-out → delivery receipt → customer notification.

Delete actions for staff/admin records use confirmation dialogs in the UI, while the PHP API records the deletion in `audit_logs` and creates an admin/staff notification.
