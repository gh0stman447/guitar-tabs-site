# Guitar Tabs Site — Project Context

## Описание проекта

Интернет-магазин цифровок (табов) для гитары. Пользователи могут приобрести табы в форматах PDF, GP5, GPX с сопроводительными аудиофайлами.

**Ссылка на проект:** `/Users/olegmalygin/Documents/Proga/myProjects/guitar-tabs-site`

---

## Стек технологий

| Категория | Технологии |
|-----------|------------|
| **Framework** | Next.js 16.1.6 (App Router) |
| **React** | 19.2.3 |
| **Language** | TypeScript ^5 |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui (Radix UI) |
| **Animation** | Framer Motion 12.35.0 |
| **Icons** | Lucide React, React Icons |
| **Database** | Supabase (PostgreSQL) |
| **i18n** | next-intl 4.8.3 |
| **Theme** | next-themes |
| **Email** | Resend |
| **Payments** | YooKassa |
| **Tax** | MyNalog proxy (157.22.204.114:5000) |

---

## Структура проекта

```
src/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Локализованные маршруты
│   │   ├── page.tsx              # Главная страница
│   │   ├── layout.tsx            # Layout с локалью
│   │   ├── admin/                # Админ-панель
│   │   │   ├── page.tsx          # Создание таба
│   │   │   ├── published/page.tsx
│   │   │   ├── drafts/page.tsx
│   │   │   ├── newsletter/page.tsx
│   │   │   └── edit/[id]/page.tsx
│   │   ├── payment/success/page.tsx
│   │   ├── unsubscribe/page.tsx
│   │   ├── legal/page.tsx        # Публичная оферта
│   │   └── privacy/page.tsx      # Политика конфиденциальности
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin endpoints
│   │   ├── payment/              # Payment endpoints
│   │   ├── email/                # Email webhook
│   │   └── tabs/[id]/preview/    # PDF preview
│   ├── globals.css
│   ├── layout.tsx                # Root layout
│   ├── middleware.ts             # i18n middleware
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── admin/                    # Admin form components
│   ├── sections/                 # Page sections
│   │   ├── HeroSection.tsx
│   │   ├── TabsSection.tsx
│   │   ├── BestsellerSection.tsx
│   │   ├── AboutSection.tsx
│   │   └── ContactsSection.tsx
│   ├── shared/                   # Shared components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── TabCard/
│   │   ├── BuyDialog.tsx
│   │   ├── CheckoutForm.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── FloatingCart.tsx
│   │   └── TabPreviewDialog.tsx
│   └── ui/                       # shadcn/ui components
├── context/
│   ├── CartContext.tsx
│   ├── CartAnimationContext.tsx
│   └── AdminContext.tsx
├── hooks/
│   └── useIsTouch.ts
├── i18n/
│   ├── request.ts
│   └── routing.ts
├── lib/
│   ├── supabase.ts               # Client Supabase
│   ├── supabase-admin.ts         # Admin Supabase
│   ├── admin-auth.ts             # Admin auth logic
│   ├── constants.ts
│   ├── notes.ts
│   └── utils.ts
└── types/
    └── index.ts

messages/                         # i18n translations
├── ru.json
└── en.json

nalog-proxy/                      # Russian tax receipt proxy
```

---

## База данных (Supabase)

**ORM не используется** — прямые запросы через Supabase клиент

### Таблицы

| Таблица | Описание |
|---------|----------|
| `guitar-tabs` | Табы (продукты) |
| `customers` | Данные клиентов |
| `purchases` | История покупок |

### Storage

- **Bucket:** `tab-files`

### Schema Tab (`src/types/index.ts`)

```typescript
interface Tab {
  id: string
  title_ru: string
  title_en: string
  difficulty: string        // "1/10" to "10/10"
  price: number
  description_ru: string
  description_en: string
  photo_url: string
  files: TabFiles           // { pdf?, gp5?, gpx?, mp3? }
  purchase_count: number
  youtube_url?: string
  is_published: boolean
}
```

### Константы (`src/lib/constants.ts`)

```typescript
export const TABLE_TABS = 'guitar-tabs';
export const TABLE_CUSTOMERS = 'customers';
export const TABLE_PURCHASES = 'purchases';
export const BUCKET_TAB_FILES = 'tab-files';

// Скидки
export const DISCOUNT_TIER_1_MIN = 2;   // 10% off
export const DISCOUNT_TIER_1_RATE = 0.10;
export const DISCOUNT_TIER_2_MIN = 3;   // 15% off
export const DISCOUNT_TIER_2_RATE = 0.15;
```

---

## API Routes

### Admin API

| Route | Method | Описание |
|-------|--------|----------|
| `/api/admin/login` | POST | Аутентификация, rate-limited (5 попыток, 15 мин блок) |
| `/api/admin/me` | GET | Проверка сессии админа |
| `/api/admin/upload-tab` | POST | Создание нового таба (FormData) |
| `/api/admin/update-tab` | POST | Обновление существующего таба |
| `/api/admin/publish-tab` | POST | is_published=true |
| `/api/admin/unpublish-tab` | POST | is_published=false |
| `/api/admin/delete-tab` | POST | Удаление draft + файлов |
| `/api/admin/newsletter` | POST | Рассылка через Resend |

### Payment API

| Route | Method | Описание |
|-------|--------|----------|
| `/api/payment/create` | POST | Создание платежа YooKassa |
| `/api/payment/webhook` | POST | Обработка вебхуков YooKassa |

### Другие Routes

| Route | Method | Описание |
|-------|--------|----------|
| `/api/tabs/[id]/preview` | GET | PDF превью |
| `/api/email/webhook` | POST | События Resend |
| `/api/unsubscribe` | GET | Отписка от рассылки |

---

## Ключевые компоненты

### TabCard (`src/components/shared/TabCard/TabCard.tsx`)
- 3D tilt эффект при ховере (Framer Motion)
- Бейдж сложности с цветовой кодировкой
- Бейджи форматов (PDF, GP5, GPX, MP3)
- Добавление/удаление из корзины
- Превью диалог

### CheckoutForm (`src/components/shared/CheckoutForm.tsx`)
- Валидация имени, email
- Newsletter opt-in
- Чекбокс соглашения
- Редирект на YooKassa

### CartDrawer (`src/components/shared/CartDrawer.tsx`)
- Выезжающая панель с товарами
- Отображение оптовой скидки
- Интегрированная форма заказа

### TabPreviewDialog (`src/components/shared/TabPreviewDialog.tsx`)
- PDF.js рендеринг
- Auto-scroll анимация
- Превью первой страницы

---

## Аутентификация админа

**Файл:** `src/lib/admin-auth.ts`

- Простая парольная аутентификация (без аккаунтов)
- Cookie-сессия (`admin_session`)
- In-memory хранилище сессий (Set)
- Rate limiting: 5 попыток, 15-минутная блокировка
- IP-трекинг

```typescript
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000;
```

---

## Платежная система

**Провайдер:** YooKassa

### Flow оплаты

1. Пользователь заполняет форму → `/api/payment/create`
2. Сервер создаёт pending purchase в БД
3. Вызов API YooKassa → получение `confirmation_url`
4. Редирект пользователя на YooKassa
5. После оплаты → вебхук → `/api/payment/webhook`
6. Сервер:
   - Верифицирует платёж
   - Обновляет статус purchase на `succeeded`
   - Инкрементирует `purchase_count` таба
   - Создаёт чек через MyNalog proxy
   - Генерирует ZIP с файлами
   - Отправляет email через Resend

### Тестовый режим

Отдельное хранилище корзины (`guitar-tabs-cart-test`) для тестирования админом.

---

## Интернационализация (i18n)

**Библиотека:** next-intl

**Локали:** `ru` (default), `en`

**Routing (`src/i18n/routing.ts`):**
```typescript
export const routing = defineRouting({
  locales: ['ru', 'en'],
  defaultLocale: 'ru',
  localePrefix: 'as-needed',
});
```

**Файлы переводов:**
- `messages/ru.json`
- `messages/en.json`

**Namespace'ы:** `nav`, `hero`, `about`, `tabs`, `bestseller`, `contacts`, `footer`, `legal`

---

## Админ-панель

**Маршрут:** `/[locale]/admin/*`

### Функционал

1. **Создание таба** — форма с двуязычными полями, загрузка файлов (PDF, GP5, GPX, MP3), обложка
2. **Published** — список опубликованных, редактирование/снятие с публикации
3. **Drafts** — список черновиков, редактирование/публикация/удаление, тест корзины
4. **Редактирование** — обновление существующего таба, синхронизация файлов
5. **Рассылка** — массовая email-рассылка подписчикам через Resend

---

## Email система

- **Провайдер:** Resend
- **From:** `OlegGuitar <noreply@olegguitar.com>`
- **Batch sending** для рассылок
- **Tracking:** opened/delivered статусы через вебхук

---

## Налоговый учёт (РФ)

- **Proxy сервер:** `http://157.22.204.114:5000` (MyNalog)
- **Генерация чеков:** автоматически после оплаты
- **Тестовый режим:** настраивается через `NALOG_PROXY_TEST_MODE`

---

## SEO

- Schema.org разметка (Product, ItemList, WebSite)
- Динамическая генерация sitemap
- Open Graph + Twitter Card метаданные
- Alternates для языков

---

## Доступность (Accessibility)

- Детекция touch-устройств (`useIsTouch` hook)
- Отключённые анимации на touch
- Поддержка клавиатурной навигации

---

## Система тем

- **Провайдер:** next-themes
- **По умолчанию:** Dark mode
- **Хранение:** localStorage

---

## Анимация корзины

- Эффект полёта частиц при добавлении
- Framer Motion + React Portal
- Траектория по дуге

---

## Команды для разработки

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```

---

## Важные файлы

| Назначение | Путь |
|------------|------|
| Database client | `src/lib/supabase.ts` |
| Admin DB client | `src/lib/supabase-admin.ts` |
| Types | `src/types/index.ts` |
| Constants | `src/lib/constants.ts` |
| Admin auth | `src/lib/admin-auth.ts` |
| i18n config | `src/i18n/routing.ts`, `src/i18n/request.ts` |
| Cart context | `src/context/CartContext.tsx` |
| Admin context | `src/context/AdminContext.tsx` |
| Payment webhook | `src/app/api/payment/webhook/route.ts` |
| Payment create | `src/app/api/payment/create/route.ts` |
| Admin login | `src/app/api/admin/login/route.ts` |
| Tab upload | `src/app/api/admin/upload-tab/route.ts` |
| Main page | `src/app/[locale]/page.tsx` |
| Admin page | `src/app/[locale]/admin/page.tsx` |
