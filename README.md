# DataViz Studio

DataViz Studio is a full-stack web application for dataset import, validation, tabular editing, and fast chart-based exploration.

This repository contains:
- a Laravel 11 backend API (`backend/`)
- a Vue 3 + Vite frontend SPA (`frontend/`)

## Current Functionality

### 1. Public and Navigation
- Landing page with project overview and CTA.
- Shared application header for authenticated pages.
- Navigation links:
  - `Home`
  - `Projects` with a dropdown for quick jump to recent projects
  - `Admin` (visible only for users with `admin` role)
- Profile dropdown with:
  - Projects
  - Profile
  - Logout

### 2. Authentication and Session
- Register and login forms.
- Session-based SPA authentication via Laravel Sanctum + CSRF.
- Logout with session invalidation.
- `me` endpoint to restore user state after refresh.

### 3. User Profile (User CRUD for own account)
- View account info (name, email, registration date).
- Upload avatar (PNG/JPG/WEBP, up to 5 MB).
- Update nickname.
- Change password (current password required).
- Delete own account (current password required).

### 4. Project Management (User scope)
- Create project.
- Read/list own projects.
- Update project title/description.
- Delete project.
- Open project by clicking its card.

### 5. Dataset Input
- Two input modes on project page when dataset is missing:
  - Upload CSV/TXT file
  - Manual table input (add/remove rows and columns, then import as CSV)
- Import options:
  - custom delimiter
  - first row as header toggle
- One active dataset per project (new import replaces previous dataset).

### 6. Data Validation and Auto-Fix
- Automatic validation and normalization during import.
- Validation report with summary and issue list.
- Supported normalization rules:
  - row width normalization (pad/truncate row cells)
  - string trimming and empty marker normalization to `null`
  - numeric normalization (currency symbols, `%`, comma/decimal variants, `k/m/b` suffix)
  - date normalization to `YYYY-MM-DD`
  - invalid numeric/date values replaced with `null`
- Validation report is persisted in `localStorage` per project.
- Modal allows manual correction of validated cells and saving changes back to backend.
- `null` values are visually highlighted in the table.

### 7. Data Workspace and Layout
- Workspace contains 4 panels:
  - Data Table
  - Visualization
  - Statistics
  - Functions
- Panel actions:
  - drag to reposition
  - resize from all four sides
  - swap panels by dragging one panel onto another
- View modes:
  - `Table`
  - `Visualization` (chart + functions)
  - `Statistics`
  - `Workspace`
- Layout presets:
  - `Default`
  - `Table+Chart Full Width`
  - `Analysis Focus`
  - `4-Grid`
- Layout is saved in `localStorage` per project.

### 8. Table, Charts, and Analysis
- Editable data table (Tabulator-based).
- Save edited cells to backend row-by-row.
- Export current table as CSV.
- Chart build types:
  - line
  - bar
  - pie
- Chart features:
  - per-series color picker
  - color palette reset
  - export chart as PNG
  - clear chart
- Auto-calculated statistics per column.
- Rule-based visualization suggestions.

### 9. Admin Panel (Role-based)
- Access restricted to users with `role = admin`.
- Dashboard statistics:
  - total users, projects, datasets, rows
  - new users/projects over last 7 days
  - active sessions in last 24 hours
- User management:
  - search users by name/email
  - edit name/email/role/password
  - delete user
- Project management in admin scope:
  - projects are hidden until a user is selected
  - create, edit, delete selected user's projects
- Safety constraints:
  - admin cannot delete own account from admin panel
  - admin cannot change own role from admin panel
- Admin can manage user and project metadata without opening project internals.

## Tech Stack

### Backend
- PHP 8.2+
- Laravel 11
- Laravel Sanctum (session-based SPA auth)
- League CSV
- MySQL (default in `.env.example`; SQLite is also supported by config)

### Frontend
- Vue 3
- Vue Router 4
- Pinia
- Axios
- Tabulator Tables
- Chart.js
- Vite

## Project Structure

```text
Web_application_for_data_visualisation/
|-- backend/        # Laravel API
|-- frontend/       # Vue SPA
|-- test-data/      # Validation testing CSV samples
|-- QUICKSTART.md
|-- SETUP.md
`-- README.md
```

## Local Setup

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+ and npm
- MySQL 8+ (recommended for default setup)

### 1) Backend Setup

```bash
cd backend
composer install
```

Create `.env` from example:

- PowerShell:
```powershell
Copy-Item .env.example .env
```

- Bash:
```bash
cp .env.example .env
```

Generate app key:

```bash
php artisan key:generate
```

Configure database and frontend URL in `backend/.env` (MySQL default):

```env
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dataviz
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173,127.0.0.1:8000
```

Run migrations:

```bash
php artisan migrate
```

Start backend:

```bash
php artisan serve
```

If your Windows environment has auto-reload/listen issues, use:

```bash
php artisan serve --host=localhost --port=8088 --no-reload
```

### 2) Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

The Vite dev proxy forwards `/api` and `/sanctum` to `http://127.0.0.1:8000` unless `VITE_BACKEND_URL` is set.

### 3) First Run

1. Open `http://localhost:5173`.
2. Register a user.
3. Create a project.
4. Import CSV/TXT or use manual input mode.
5. Build chart, inspect statistics, and review validation report.

## Admin Access

Promote an existing user to admin:

```bash
cd backend
php artisan tinker --execute="App\Models\User::where('email', 'admin@example.com')->update(['role' => 'admin']);"
```

## API Overview

Base path: `/api/v1`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `PATCH /auth/profile`
- `PATCH /auth/password`
- `DELETE /auth/account`
- `POST /auth/avatar`
- `GET /users/{user}/avatar`

### Projects
- `GET /projects`
- `POST /projects`
- `GET /projects/{project}`
- `PATCH /projects/{project}`
- `DELETE /projects/{project}`

### Dataset
- `POST /projects/{project}/import`
- `GET /projects/{project}/rows`
- `PATCH /projects/{project}/rows/{row}`
- `GET /projects/{project}/statistics`
- `GET /projects/{project}/suggest-visualizations`

### Admin (requires `admin` middleware)
- `GET /admin/stats`
- `GET /admin/users`
- `PATCH /admin/users/{user}`
- `DELETE /admin/users/{user}`
- `POST /admin/users/{user}/projects`
- `PATCH /admin/users/{user}/projects/{project}`
- `DELETE /admin/users/{user}/projects/{project}`

## Test Data

Use `test-data/validation_test_dataset.csv` to test validation and auto-fix behavior.

See `test-data/README.md` for details.

## Build and Check

Frontend production build:

```bash
cd frontend
npm run build
```

Backend tests:

```bash
cd backend
php artisan test
```

## Troubleshooting

### `php artisan serve` fails to listen on 127.0.0.1:800x
- Try:
```bash
php artisan serve --host=localhost --port=8088 --no-reload
```
- Ensure `SYSTEMROOT=C:\WINDOWS` exists in `backend/.env` on Windows.

### Login/register fails with CSRF or 419 errors
- Verify frontend and backend URLs.
- Check `SANCTUM_STATEFUL_DOMAINS` in `backend/.env`.
- Make sure backend is reachable at the URL used by Vite proxy.

### CORS or cookie issues
- Confirm `backend/config/cors.php` allows your frontend origin.
- `supports_credentials` must remain `true`.

## License

MIT
