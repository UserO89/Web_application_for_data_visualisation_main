# Setup Guide

This document provides a full local setup flow for the DataViz Studio project.

## Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+ and npm
- MySQL 8+ (recommended)

## 1. Backend Setup (Laravel)

```bash
cd backend
composer install
```

Create `.env` from the example:

- PowerShell:
```powershell
Copy-Item .env.example .env
```

- Bash:
```bash
cp .env.example .env
```

Generate the app key:

```bash
php artisan key:generate
```

Create the database:

```sql
CREATE DATABASE dataviz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Update `backend/.env`:

```env
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dataviz
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173,localhost:8000,127.0.0.1:8000
```

Run migrations and start backend:

```bash
php artisan migrate
php artisan serve
```

## 2. Frontend Setup (Vue 3 + Vite)

```bash
cd frontend
npm install
npm run dev
```

By default, Vite proxies API and Sanctum requests to `http://127.0.0.1:8000`.

If backend runs on another port (for example `8088`), set `VITE_BACKEND_URL` before starting frontend:

- PowerShell:
```powershell
$env:VITE_BACKEND_URL='http://localhost:8088'
npm run dev
```

- Bash:
```bash
VITE_BACKEND_URL=http://localhost:8088 npm run dev
```

## 3. Verify the Setup

1. Open `http://localhost:5173`.
2. Register a user.
3. Create a project.
4. Import a CSV/TXT file or use manual input.

## Project Structure

- `backend/` - Laravel API
- `frontend/` - Vue 3 SPA
- `test-data/` - sample CSV files for validation testing

## Common Issues

### Backend serve issues on Windows

If `php artisan serve` fails in auto-reload mode, run:

```bash
php artisan serve --host=localhost --port=8088 --no-reload
```

If you switch to port `8088`, remember to set `VITE_BACKEND_URL` for frontend.

### CSRF/Sanctum authentication errors (419 or unauthorized)

- Ensure frontend URL and backend URL are correct.
- Verify `SANCTUM_STATEFUL_DOMAINS` in `backend/.env`.
- Confirm backend is reachable at the URL used by Vite proxy.

### CORS errors

Check `backend/config/cors.php`:

- `allowed_origins` should include your frontend origin.
- `supports_credentials` must be `true`.

### Database connection errors

- Make sure MySQL is running.
- Ensure the `dataviz` database exists.
- Verify DB credentials in `backend/.env`.
