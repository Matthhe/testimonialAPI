# Testimonial Management API

REST API сервис для управления видео-отзывами (testimonials) с полным жизненным циклом, шарингом и аналитикой.  
Разработан в рамках тестового задания.

---

## Технологический стек

| Категория | Инструменты |
|-----------|--------------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **База данных** | MongoDB + Mongoose ODM |
| **Аутентификация** | JWT (jsonwebtoken) + bcrypt |
| **Безопасность** | Helmet, CORS, Rate Limiting |
| **Тестирование** | Jest, Supertest, mongodb-memory-server |
| **Модули** | CommonJS (`require` / `module.exports`) |

---

## Быстрый старт

```bash
# 1. Клонировать репозиторий
git clone https://github.com/Matthhe/testimonialAPI
cd testimonial-api

# 2. Установить зависимости
npm install

# 3. Настроить переменные окружения
# Создать файл .env на основе .env.example

# 4. Запустить сервер
npm run dev   # режим разработки с nodemon
npm start     # production-режим
```

Сервер будет доступен на `http://localhost:3000`.

---

## Переменные окружения

| Переменная | Описание | Пример |
|------------|----------|--------|
| `PORT` | Порт сервера | `3000` |
| `MONGODB_URI` | Строка подключения к MongoDB | `mongodb://127.0.0.1:27017/testimonials_db` |
| `JWT_SECRET` | Секретный ключ для подписи JWT | `placeholder` |
| `JWT_EXPIRY` | Время жизни токена | `7d` |

---

## Архитектурные решения

- **403 Forbidden для чужих данных** – строгая проверка владельца отзыва. Чужой отзыв вызывает `403`, не раскрывая факт его существования.
- **Мягкое удаление (Soft Delete)** – отзывы не удаляются физически, а помечаются `isDeleted: true` с сохранением даты.
- **Атомарный автоинкремент userId** – защита от race condition через `findOneAndUpdate` с `$inc`.
- **Защита от Mass Assignment** – `PUT` обновляет только белый список полей, игнорируя системные.
- **Конечный автомат статусов** – переходы строго валидируются по матрице `VALID_TRANSITIONS`.
- **Аналитика через Aggregation Pipeline** – `$facet` за один проход собирает total, byStatus и averageRating.
- **Upsert настроек** – `findOneAndUpdate` с `upsert: true` для атомарного создания/обновления.
- **Уникальные каналы при шаринге** – новые каналы добавляются без дублирования.
- **Централизованная обработка ошибок** – `asyncHandler` + `sendSuccess/sendError` во всех контроллерах.

---

## Бонусные задачи

| Бонус | Описание |
|-------|----------|
| **Rate Limiting** | Ограничение 5 запросов в минуту на auth-эндпоинты (express-rate-limit) |
| **Поиск и фильтрация** | `GET /api/testimonials/search` – текстовый поиск, фильтры по рейтингу и датам |
| **Массовые операции** | `POST /api/testimonials/bulk/status` – смена статуса нескольких отзывов с валидацией переходов |
| **Экспорт в CSV** | `GET /api/testimonials/export` – выгрузка отзывов в `.csv` с фильтрацией |

---

## API Эндпоинты

### Аутентификация (публичные)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `POST` | `/api/auth/register` | Регистрация нового пользователя |
| `POST` | `/api/auth/login` | Вход и получение JWT |

### Отзывы (требуют JWT)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `POST` | `/api/testimonials` | Создать новый отзыв |
| `GET` | `/api/testimonials` | Список отзывов с пагинацией и фильтром `status` |
| `GET` | `/api/testimonials/search` | Поиск: текстовый поиск, фильтры `minRating`, `maxRating`, `createdAfter`, `createdBefore` |
| `GET` | `/api/testimonials/export` | Экспорт CSV: выгрузка с фильтрами `status`, `startDate`, `endDate` |
| `GET` | `/api/testimonials/:testimonialId` | Получить отзыв по ID |
| `PUT` | `/api/testimonials/:testimonialId` | Обновить отзыв |
| `PATCH` | `/api/testimonials/:testimonialId/status` | Изменить статус (валидация переходов) |
| `DELETE` | `/api/testimonials/:testimonialId` | Мягкое удаление |
| `POST` | `/api/testimonials/:testimonialId/share` | Поделиться (каналы, авто-переход в `shared`) |
| `POST` | `/api/testimonials/bulk/status` | Массовая смена статуса |

### Настройки и Аналитика (требуют JWT)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/api/testimonials/settings` | Получить настройки (`null` если нет) |
| `POST` | `/api/testimonials/settings` | Создать/обновить настройки |
| `GET` | `/api/testimonials/analytics` | Аналитика с фильтрами `startDate`, `endDate` |

---

## Примеры запросов

### Регистрация
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "securepassword",
  "businessName": "My Store"
}
```
**Ответ `201`:**
```json
{
  "code": 201,
  "status": "success",
  "message": "Registration successful",
  "data": {
    "userId": 1,
    "email": "test@example.com",
    "businessName": "My Store",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Создание отзыва
```http
POST /api/testimonials
Authorization: Bearer <токен>
Content-Type: application/json

{
  "customerName": "Alice",
  "rating": 5,
  "text": "Excellent service!"
}
```
**Ответ `201`:**
```json
{
  "code": 201,
  "status": "success",
  "message": "Testimonial created successfully.",
  "data": {
    "testimonialId": "a1b2c3d4-...",
    "userId": 1,
    "customerName": "Alice",
    "rating": 5,
    "text": "Excellent service!",
    "status": "draft"
  }
}
```

### Поиск отзывов
```http
GET /api/testimonials/search?search=Alice&minRating=4&createdAfter=2026-01-01
Authorization: Bearer <токен>
```

### Массовое обновление статуса
```http
POST /api/testimonials/bulk/status
Authorization: Bearer <токен>
Content-Type: application/json

{
  "testimonialIds": ["id1", "id2", "id3"],
  "status": "completed"
}
```
**Ответ `200`:**
```json
{
  "code": 200,
  "status": "success",
  "message": "Bulk status update completed",
  "data": {
    "updated": 2,
    "failed": 1,
    "errors": [
      { "testimonialId": "id3", "message": "Cannot transition from draft to completed" }
    ]
  }
}
```

### Экспорт CSV
```http
GET /api/testimonials/export?status=shared&startDate=2026-01-01
Authorization: Bearer <токен>
```
Вернёт файл `testimonials.csv`.

### Аналитика
```http
GET /api/testimonials/analytics?startDate=2026-01-01&endDate=2026-12-31
Authorization: Bearer <токен>
```
**Ответ `200`:**
```json
{
  "code": 200,
  "status": "success",
  "message": "Data retrieved successfully",
  "data": {
    "overview": {
      "total": 50,
      "byStatus": { "draft": 5, "recording": 3, "processing": 2, "completed": 25, "shared": 15 },
      "averageRating": 4.2
    },
    "period": {
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-12-31T23:59:59.999Z"
    }
  }
}
```

---

## Тестирование

```bash
npm test
```
Запускает 16 интеграционных тестов (Jest + Supertest + in-memory MongoDB).  
Покрытие: аутентификация, CRUD отзывов, валидация переходов, шаринг, аналитика, права доступа.

---

**Время выполнения:** 2 недели
