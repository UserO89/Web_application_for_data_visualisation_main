# Инструкция по установке

## Быстрый старт

### 1. Backend (Laravel)

```bash
cd backend
composer install
# Windows PowerShell:
Copy-Item env.example .env
# Linux/Mac:
# cp env.example .env
php artisan key:generate
```

Настройте `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dataviz
DB_USERNAME=root
DB_PASSWORD=your_password

APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173
```

```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
php artisan serve
```

### 2. Frontend (Vue 3)

```bash
cd frontend
npm install
npm run dev
```

### 3. Создайте базу данных MySQL

```sql
CREATE DATABASE dataviz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Проверка работы

1. Откройте `http://localhost:5173`
2. Зарегистрируйтесь
3. Создайте проект
4. Импортируйте CSV файл

## Структура проекта

- `backend/` - Laravel API
- `frontend/` - Vue 3 приложение

## Возможные проблемы

### CORS ошибки
Убедитесь, что в `backend/config/cors.php` правильно настроен `allowed_origins` и `supports_credentials = true`

### Sanctum не работает
Проверьте, что в `.env` указан `SANCTUM_STATEFUL_DOMAINS=localhost:5173`

### База данных
Убедитесь, что MySQL запущен и база данных создана
