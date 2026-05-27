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
| **Database** | PostgreSQL (прямые запросы, ORM не используется) |
| **DB Layer** | Custom `src/lib/db.ts` с Supabase-like API |
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
│   │   ├── payment-stub/page.tsx # Тестовая оплата (localhost)
│   │   ├── payment/success/page.tsx
│   │   ├── payment/canceled/page.tsx
│   │   ├── unsubscribe/page.tsx
│   │   ├── legal/page.tsx        # Публичная оферта
│   │   └── privacy/page.tsx      # Политика конфиденциальности
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin endpoints
│   │   ├── payment/              # Payment endpoints
│   │   │   ├── create/route.ts
│   │   │   ├── webhook/route.ts
│   │   │   └── simulate/route.ts # Тестовая симуляция оплаты
│   │   ├── email/webhook/route.ts
│   │   ├── tabs/[id]/preview/route.ts
│   │   └── purchases/[id]/route.ts
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
│   ├── AdminContext.tsx
│   └── PreviewBlockContext.tsx    # Блокировка превью + flip анимация
├── hooks/
│   ├── useIsTouch.ts
│   ├── useDelayedRender.ts
│   └── useOrientation.ts
├── i18n/
│   ├── request.ts
│   └── routing.ts
├── lib/
│   ├── db.ts                     # PostgreSQL connection layer
│   ├── supabase.ts               # Client DB wrapper
│   ├── supabase-admin.ts         # Admin DB wrapper
│   ├── admin-auth.ts             # JWT admin auth
│   ├── constants.ts              # DB table names, discounts
│   ├── notes.ts
│   └── utils.ts
└── types/
    └── index.ts

messages/                         # i18n translations
├── ru.json
└── en.json
```

---

## База данных (PostgreSQL)

**ORM не используется** — кастомный слой `src/lib/db.ts` с Supabase-like API

### Таблицы

| Таблица | Описание |
|---------|----------|
| `guitar-tabs` | Табы (продукты) |
| `customers` | Данные клиентов |
| `purchases` | История покупок |
| `tab_files` | Файлы табов (bytea хранение) |

### Схема `purchases`

```sql
id              uuid PRIMARY KEY
created_at      timestamptz NOT NULL
customer_id     uuid FK → customers(id)
tab_id          uuid FK → guitar-tabs(id)
amount          integer NOT NULL
payment_id      text
status          text NOT NULL DEFAULT 'pending'  -- pending | succeeded | canceled
tab_ids         jsonb                            -- массив UUID ["...", "..."]
resend_email_id text
email_status    text                             -- sent | delivered | opened
receipt_url     text
```

### Схема `guitar-tabs`

```sql
id              uuid PRIMARY KEY
created_at      timestamptz NOT NULL
title_ru        text NOT NULL
title_en        text NOT NULL
difficulty      text NOT NULL          -- "1/10" to "10/10"
price           integer NOT NULL
description_ru  text
description_en  text
photo_url       text
files           jsonb                  -- { pdf?: true, gp5?: true, gpx?: true, mp3?: true }
purchase_count  integer NOT NULL DEFAULT 0
youtube_url     text
is_published    boolean NOT NULL DEFAULT false
```

### Схема `customers`

```sql
id          uuid PRIMARY KEY
created_at  timestamptz NOT NULL
firstname   text NOT NULL
email       text NOT NULL UNIQUE
newsletter  boolean NOT NULL DEFAULT false
```

### Схема `tab_files`

```sql
id            integer PRIMARY KEY
tab_id        uuid FK → guitar-tabs(id)
format        varchar(10) NOT NULL   -- pdf, gp5, gpx, mp3
filename      text NOT NULL
content_type  varchar(100)
data          bytea NOT NULL         -- бинарные данные файла
created_at    timestamp DEFAULT CURRENT_TIMESTAMP
```

### Константы (`src/lib/constants.ts`)

```typescript
export const TABLE_TABS = 'guitar-tabs';
export const TABLE_CUSTOMERS = 'customers';
export const TABLE_PURCHASES = 'purchases';
export const TABLE_TAB_FILES = 'tab_files';

// Скидки
export const DISCOUNT_TIER_1_MIN = 2;   // 10% off
export const DISCOUNT_TIER_1_RATE = 0.10;
export const DISCOUNT_TIER_2_MIN = 3;   // 15% off
export const DISCOUNT_TIER_2_RATE = 0.15;
```

### Типы (`src/types/index.ts`)

```typescript
interface Tab {
  id: string
  title_ru: string
  title_en: string
  difficulty: string
  price: number
  description_ru?: string
  description_en?: string
  photo_url?: string
  files: TabFiles           // { pdf?, gp5?, gpx?, mp3? }
  purchase_count: number
  youtube_url?: string
  is_published: boolean
}

interface Customer {
  id: string
  created_at: string
  firstname: string
  email: string
  newsletter: boolean
}

interface Purchase {
  id: string
  created_at: string
  customer_id: string
  tab_id: string | null
  tab_ids: string[] | null
  amount: number
  payment_id: string | null
  status: string             // pending | succeeded | canceled
  resend_email_id: string | null
  email_status: string | null
  receipt_url: string | null
}
```

---

## API Routes

### Admin API

| Route | Method | Описание |
|-------|--------|----------|
| `/api/admin/login` | POST | Аутентификация, rate-limited (5 попыток, 15 мин блок) |
| `/api/admin/me` | GET | Проверка JWT сессии админа |
| `/api/admin/logout` | POST | Выход (очистка cookie) |
| `/api/admin/upload-tab` | POST | Создание нового таба (FormData) |
| `/api/admin/update-tab` | POST | Обновление существующего таба |
| `/api/admin/publish-tab` | POST | is_published=true |
| `/api/admin/unpublish-tab` | POST | is_published=false |
| `/api/admin/delete-tab` | POST | Удаление draft + файлов из tab_files |
| `/api/admin/newsletter` | POST | Рассылка через Resend |
| `/api/admin/tabs` | GET | Список всех табов |

### Payment API

| Route | Method | Описание |
|-------|--------|----------|
| `/api/payment/create` | POST | Создание платежа YooKassa |
| `/api/payment/webhook` | POST | Обработка вебхуков YooKassa |
| `/api/payment/simulate` | POST | Тестовая симуляция оплаты (localhost) |

### Другие Routes

| Route | Method | Описание |
|-------|--------|----------|
| `/api/tabs/[id]/preview` | GET | PDF превью первой страницы |
| `/api/email/webhook` | POST | События Resend (delivered, opened) |
| `/api/purchases/[id]` | GET | Получение информации о заказе |
| `/api/unsubscribe` | GET | Отписка от рассылки |

---

## Ключевые компоненты

### TabCard (`src/components/shared/TabCard/TabCard.tsx`)
- 3D tilt эффект при ховере (Framer Motion)
- Бейдж сложности с цветовой кодировкой
- Бейджи форматов (PDF, GP5, GPX, MP3)
- Добавление/удаление из корзины
- Flip-анимация при превью (полёт в центр экрана с переворотом)
- Отключение анимаций на touch-устройствах
- Превью диалог

### TabPreviewDialog (`src/components/shared/TabPreviewDialog.tsx`)
- PDF.js рендеринг первой страницы
- Auto-scroll анимация
- Кнопка скачивания PDF с circular progress анимацией
- Tooltip'ы с задержкой (через useDelayedRender)

### CheckoutForm (`src/components/shared/CheckoutForm.tsx`)
- Валидация имени, email
- Newsletter opt-in
- Чекбокс соглашения
- Редирект на YooKassa

### CartDrawer (`src/components/shared/CartDrawer.tsx`)
- Выезжающая панель с товарами
- Отображение оптовой скидки (10% от 2 шт, 15% от 3 шт)
- Интегрированная форма заказа
- Tooltip'ы с задержкой (через useDelayedRender)


## Аутентификация админа

**Файл:** `src/lib/admin-auth.ts`

- Парольная аутентификация (без аккаунтов)
- **JWT-like токены** с HMAC-SHA256 подписью
- Cookie-сессия (`admin_session`)
- **Stateless** — токен хранится в cookie, валидация по подписи
- Rate limiting: 5 попыток, 15-минутная блокировка
- IP-трекинг

```typescript
// Токен: payload.base64 + '.' + HMAC signature
function signToken(data: { exp: number }): string {
  const secret = process.env.ADMIN_PASSWORD || 'default-secret';
  const payload = Buffer.from(JSON.stringify(data)).toString('base64');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${payload}.${signature}`;
}
```

### AdminContext (`src/context/AdminContext.tsx`)
- Проверка сессии при загрузке
- `isLoading` состояние во время проверки

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
   - Инкрементирует `purchase_count` таба (через прямой SQL)
   - Создаёт чек через MyNalog proxy
   - Генерирует ZIP с файлами (JSZip)
   - Отправляет email через Resend

### Тестовый режим (localhost)

- Страница `/payment-stub` с кнопкой "Подтвердить оплату"
- Endpoint `/api/payment/simulate` симулирует успешную оплату
- Обновляет статус, increment purchase_count, отправляет email

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
- **Tracking:** opened/delivered статусы через вебхук `/api/email/webhook`
- **Priority:** opened > delivered > sent

---

## Налоговый учёт (РФ)

- **Proxy сервер:** `http://157.22.204.114:5000` (MyNalog)
- **Генерация чеков:** автоматически после оплаты
- **Тестовый режим:** настраивается через `NALOG_PROXY_TEST_MODE`

---

## DB Layer (`src/lib/db.ts`)

Кастомный PostgreSQL слой с Supabase-like API:

```typescript
import { db, query } from '@/lib/db';

// Select
const { data } = await db.from('guitar-tabs').select('id, title_ru').eq('is_published', true);

// Update
await db.from('guitar-tabs').update({ purchase_count: 10 }).eq('id', tabId);

// Insert
await db.from('customers').insert({ firstname, email, newsletter }).select('id').single();

// Direct SQL
await query('UPDATE "guitar-tabs" SET "purchase_count" = "purchase_count" + 1 WHERE "id" = $1', [tabId]);
```

**Особенности:**
- Автоматическое кавычивание колонок с `_` и `-`
- Поддержка транзакций через `transaction()`
- Retry logic при ошибках подключения

---

## Хранение файлов

Файлы хранятся в таблице `tab_files` как `bytea`:

- При загрузке файла → конвертация в Buffer → сохранение в `data`
- При скачивании → чтение из `data` → генерация ZIP (JSZip)
- Форматы: PDF, GP5, GPX, MP3

---

## SEO

- Schema.org разметка (Product, ItemList, WebSite)
- Динамическая генерация sitemap
- Open Graph + Twitter Card метаданные
- Alternates для языков

---

## Доступность (Accessibility)

- Детекция touch-устройств (`useIsTouch` hook)
- Отключённые анимации на touch (flip, cart fly, justAdded glow)
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

## PreviewBlockContext

**Файл:** `src/context/PreviewBlockContext.tsx`

Контекст для управления состоянием flip-анимации карточек.

```typescript
interface PreviewBlockContextValue {
  isPreviewBlocking: boolean;      // Активна ли анимация превью
  flippingTabId: string | null;    // ID карточки, которая флиппится
  startPreviewBlock: (tabId: string) => void;
  endPreviewBlock: () => void;
}
```

**Использование:**
- При клике на превью вызывается `startPreviewBlock(tab.id)`
- Устанавливается `zIndex: 100` для активной карточки в `TabsSection`/`BestsellerSection`
- У остальных карточек `zIndex: 1` и `pointerEvents: 'none'`
- Это решает проблему перекрытия карточек во время flip-анимации

---

## Хуки

### useDelayedRender (`src/hooks/useDelayedRender.ts`)

Отложенный рендер компонентов после срабатывания триггера. Используется для tooltip'ов в диалогах/шторках.

```typescript
const tooltipsReady = useDelayedRender(0, open);
// Рендерит tooltip только после открытия (tooltipsReady && <Tooltip />)
```

**Параметры:**
- `delay` (default: 50) — задержка в мс перед рендером
- `trigger` (default: true) — триггер для начала отсчёта

**Особенности:**
- Использует `queueMicrotask` для избежания ESLint предупреждений
- Автоматически очищает таймер при размонтировании или смене trigger

### useOrientation (`src/hooks/useOrientation.ts`)

Хук для определения ориентации устройства (landscape/portrait).

```typescript
const isLandscape = useOrientation();
```

**Особенности:**
- Использует `window.screen.orientation` API (с fallback)
- Слушает события `resize` и `orientationchange`
- Возвращает `true` для landscape ориентации

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
| DB layer | `src/lib/db.ts` |
| DB client | `src/lib/supabase.ts` |
| Admin DB client | `src/lib/supabase-admin.ts` |
| Types | `src/types/index.ts` |
| Constants | `src/lib/constants.ts` |
| Admin auth | `src/lib/admin-auth.ts` |
| i18n config | `src/i18n/routing.ts`, `src/i18n/request.ts` |
| Cart context | `src/context/CartContext.tsx` |
| Cart animation context | `src/context/CartAnimationContext.tsx` |
| Admin context | `src/context/AdminContext.tsx` |
| PreviewBlock context | `src/context/PreviewBlockContext.tsx` |
| Payment webhook | `src/app/api/payment/webhook/route.ts` |
| Payment simulate | `src/app/api/payment/simulate/route.ts` |
| Payment create | `src/app/api/payment/create/route.ts` |
| Admin login | `src/app/api/admin/login/route.ts` |
| Tab upload | `src/app/api/admin/upload-tab/route.ts` |
| Main page | `src/app/[locale]/page.tsx` |
| Admin page | `src/app/[locale]/admin/page.tsx` |
| Payment stub | `src/app/[locale]/payment-stub/page.tsx` |
| PreviewBlock context | `src/context/PreviewBlockContext.tsx` |
| useOrientation hook | `src/hooks/useOrientation.ts` |
