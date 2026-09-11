# Expense & Prorated Budget Tracker (PHP 8.3 Edition)

A complete, self-contained PHP 8.3 application with SQLite database persistence, RESTful API backend, and modern responsive dashboard.

## 🚀 Quick Web Hosting Deployment (cPanel / Shared Hosting / VPS)

### Option A: Hosting at Domain Root (e.g., https://myexpenses.com)
1. Upload all files from this folder directly into your hosting web root:
   - cPanel / Shared Hosting: `public_html/`
   - Linux VPS: `/var/www/html/`
2. Ensure write permissions on the `data/` folder and `data/budget.sqlite`:
   ```bash
   chmod 775 data
   chmod 664 data/budget.sqlite
   ```
3. That's it! Visit `https://myexpenses.com/` in your browser.

### Option B: Hosting in a Subfolder (e.g., https://mywebsite.com/expenses/)
1. Create a folder in `public_html` named `expenses` (or any name).
2. Upload all files into `public_html/expenses/`.
3. Set permissions (`chmod 775 data` and `chmod 664 data/budget.sqlite`).
4. That's it! The application automatically detects the subfolder path and routes API calls transparently.

---

## 🔒 Security Features Built-In
- **Protected Database**: `.htaccess` at the root and inside `data/` denies all direct HTTP downloads of `budget.sqlite` (`403 Forbidden`).
- **SQL Injection Prevention**: 100% PDO prepared statements with strict typing.
- **SQLite WAL Mode**: Enabled with 5-second busy timeout for concurrent read/write transactions.
- **Admin Password**: Set via `data/.secret_reset_password.key` or environment variable `RESET_PASSWORD`.

## ⚙️ Requirements
- **PHP**: 8.1, 8.2, or 8.3
- **PHP Extensions**: `pdo_sqlite`, `json`, `mbstring`
- **Web Server**: Apache with `mod_rewrite` enabled (or Nginx)

---

## 📦 Legacy JavaScript / Node.js Version
The legacy TypeScript, Vite, and Node.js Express version of this project has been archived in the [`js_version/`](./js_version/) directory with its own documentation, Dockerfile, and configs.