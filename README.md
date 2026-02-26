# Data Visualization Application

Веб-приложение для визуализации данных с возможностью импорта CSV файлов, анализа и создания графиков.

## Структура проекта

```
data-viz-app/
├── backend/          # Laravel API
├── frontend/         # Vue 3 + Vite
└── README.md
```

## Технологии

### Backend
- **Laravel 10** - PHP фреймворк
- **Laravel Sanctum** - Аутентификация для SPA
- **League CSV** - Парсинг CSV файлов
- **Carbon** - Работа с датами
- **Laravel Storage** - Хранение файлов
- **MySQL** - База данных

### Frontend
- **Vue 3** - JavaScript фреймворк
- **Vite** - Сборщик
- **Pinia** - State management
- **Vue Router** - Роутинг
- **Axios** - HTTP клиент
- **Tabulator** - Таблицы данных
- **ECharts** - Графики и визуализации

## Установка

### Требования
- PHP >= 8.1
- Composer
- Node.js >= 16
- MySQL >= 5.7

### Backend

1. Перейдите в папку backend:
```bash
cd backend
```

2. Установите зависимости:
```bash
composer install
```

3. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

4. Сгенерируйте ключ приложения:
```bash
php artisan key:generate
```

5. Настройте базу данных в `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dataviz
DB_USERNAME=root
DB_PASSWORD=your_password
```

6. Опубликуйте конфигурацию Sanctum:
```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

7. Запустите миграции:
```bash
php artisan migrate
```

8. Запустите сервер разработки:
```bash
php artisan serve
```

Backend будет доступен на `http://localhost:8000`

### Frontend

1. Перейдите в папку frontend:
```bash
cd frontend
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите сервер разработки:
```bash
npm run dev
```

Frontend будет доступен на `http://localhost:5173`

## Использование

1. Откройте `http://localhost:5173` в браузере
2. Зарегистрируйтесь или войдите в систему
3. Создайте новый проект
4. Импортируйте CSV файл
5. Просматривайте данные в таблице, статистику и создавайте визуализации

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Регистрация
- `POST /api/v1/auth/login` - Вход
- `POST /api/v1/auth/logout` - Выход
- `GET /api/v1/auth/me` - Текущий пользователь

### Projects
- `GET /api/v1/projects` - Список проектов
- `POST /api/v1/projects` - Создать проект
- `GET /api/v1/projects/{id}` - Получить проект
- `DELETE /api/v1/projects/{id}` - Удалить проект

### Dataset
- `POST /api/v1/projects/{id}/import` - Импорт CSV
- `GET /api/v1/projects/{id}/rows` - Получить строки данных
- `PATCH /api/v1/projects/{id}/rows/{rowId}` - Обновить строку
- `GET /api/v1/projects/{id}/statistics` - Статистика
- `GET /api/v1/projects/{id}/suggest-visualizations` - Предложения визуализаций

## Структура базы данных

- **users** - Пользователи
- **projects** - Проекты
- **datasets** - Наборы данных
- **dataset_columns** - Колонки наборов данных
- **dataset_rows** - Строки наборов данных
- **charts** - Сохраненные графики

## Дополнительные возможности

Проект готов к расширению:
- Docker контейнеризация
- TypeScript для frontend
- Дополнительные типы графиков
- Экспорт данных
- Совместная работа над проектами
- И многое другое

## Лицензия

MIT
