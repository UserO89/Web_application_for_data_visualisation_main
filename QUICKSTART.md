# Quick Start

Follow these steps to run DataViz Studio locally.

## 1. Backend (Laravel)

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

Create the MySQL database:

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

Run migrations and start the backend:

```bash
php artisan migrate
php artisan serve
```

If `php artisan serve` has auto-reload/listen issues on Windows:

```bash
php artisan serve --host=localhost --port=8088 --no-reload
```

If you run backend on port `8088`, set `VITE_BACKEND_URL` before starting frontend:

- PowerShell:
```powershell
$env:VITE_BACKEND_URL='http://localhost:8088'
npm run dev
```

- Bash:
```bash
VITE_BACKEND_URL=http://localhost:8088 npm run dev
```

## 2. Frontend (Vue 3 + Vite)

```bash
cd frontend
npm install
npm run dev
```

## 3. Open the app

Open `http://localhost:5173`, register a user, and create your first project.

## Admin Access (Optional)

```bash
cd backend
php artisan tinker --execute="App\Models\User::where('email', 'admin@example.com')->update(['role' => 'admin']);"
```
