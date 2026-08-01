# Guitar Tabs Site — Project Context

## Описание проекта

Каталог авторских гитарных табов. Платные табы приобретаются через корзину и приходят по email, бесплатные можно сразу скачать в форматах PDF, GP5/GPX или единым ZIP-архивом.

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
| **Payments** | Robokassa |
| **Tax** | Robokassa / Робочеки |

---

## Структура проекта

```
src/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Локализованные маршруты
│   │   ├── page.tsx              # Главная страница
│   │   ├── layout.tsx            # Layout с локалью
│   │   ├── admin/                # Админ-панель
│   │   │   ├── page.tsx          # Главная админ-панели
│   │   │   ├── create-tab/page.tsx
│   │   │   ├── published/page.tsx
│   │   │   ├── drafts/page.tsx
│   │   │   ├── newsletter/page.tsx
│   │   │   └── edit/[id]/page.tsx
│   │   ├── payment/
│   │   ├── tabs/[id]/page.tsx    # Детальная страница таба
│   │   ├── payment/success/page.tsx
│   │   ├── payment/canceled/page.tsx
│   │   ├── unsubscribe/page.tsx
│   │   ├── legal/page.tsx        # Публичная оферта
│   │   └── privacy/page.tsx      # Политика конфиденциальности
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin endpoints
│   │   ├── payment/              # Payment endpoints
│   │   │   ├── create/route.ts
│   │   │   └── webhook/route.ts
│   │   ├── email/webhook/route.ts
│   │   ├── tabs/[id]/preview/route.ts
│   │   ├── tabs/[id]/audio/route.ts
│   │   ├── tabs/[id]/download/route.ts
│   │   ├── files/[tabId]/[format]/route.ts
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
│   │   ├── TabDetails.tsx
│   │   ├── FreeDownloadMenu.tsx
│   │   ├── BuyDialog.tsx
│   │   ├── CheckoutForm.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── FloatingCart.tsx
│   │   ├── TabPreviewDialog.tsx
│   │   └── ThemeTransition.tsx
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
│   ├── navigation.ts             # Локализованные useRouter/usePathname
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
| `tab_downloads` | События скачивания бесплатных табов |
| `users` | Пользовательские аккаунты |
| `user_identities` | Способы входа: email и Telegram |
| `user_sessions` | Серверные пользовательские сессии |
| `user_auth_tokens` | Одноразовые токены подтверждения и сброса пароля |
| `account_merge_attempts` | Одноразовые подтверждения объединения аккаунтов |

Рабочие базы имеют одинаковую схему:
- `guitar_tabs_dev` — разработка;
- `guitar_tabs` — production.

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
characteristics jsonb NOT NULL DEFAULT '{"techniques":[],"tuning":"standard","capo":0}'
```

`price = 0` означает бесплатный таб. Отдельной колонки `is_free` в БД нет.

`characteristics` хранит особенности исполнения:

```json
{
  "techniques": ["barre", "percussion", "harmonics", "tapping"],
  "tuning": "standard | drop_d | nonstandard | custom",
  "customTuning": "D A D G A D",
  "capo": 0
}
```

`customTuning` используется только для строя `custom`. Каподастр принимает значения
от `0` (без каподастра) до `12`.

### Схема `customers`

```sql
id          uuid PRIMARY KEY
created_at  timestamptz NOT NULL
firstname   text NOT NULL
email       text NOT NULL UNIQUE
newsletter  boolean NOT NULL DEFAULT false
user_id     uuid FK → users(id)
```

### Пользовательские аккаунты

- `users` хранит имя, необязательный нормализованный email, параметризованный
  `scrypt`-хеш пароля, дату
  подтверждения email и версию согласия на обработку персональных данных.
- Новые пароли принимают 11–128 символов и требуют минимум одну заглавную и одну
  строчную латинскую букву, цифру и специальный символ. Хеширование использует
  уникальную соль и `scrypt` (`N=131072`, `r=8`, `p=1`); проверка сохраняет
  совместимость с ранее созданными scrypt-хешами без записанных параметров.
- `user_identities` отделяет аккаунт от способа входа; сейчас используется
  `email` и `telegram`. Telegram Login Widget не отдаёт email, поэтому новый
  Telegram-пользователь сразу получает аккаунт с `users.email = NULL`, а адрес
  может добавить и подтвердить позже в настройках.
- `user_sessions` хранит только SHA-256-хеш случайного session token. Исходный
  токен находится в `HttpOnly`, `SameSite=Lax`, `Secure` в production cookie
  `user_session`; срок сессии — 30 дней.
- `user_auth_tokens` содержит хеши одноразовых ссылок `verify_email` (24 часа) и
  `reset_password` (1 час).
- Восстановление доступно и для ещё не подтверждённого аккаунта: переход по
  одноразовой ссылке доказывает владение почтой, поэтому успешная смена пароля
  одновременно устанавливает `email_verified_at` и привязывает покупки.
- После подтверждения email существующая строка `customers` с тем же адресом
  получает `user_id`, поэтому прежние успешные покупки появляются в кабинете.
- После обычной регистрации сессия создаётся сразу. Неподтверждённый пользователь
  может входить в кабинет и покупать табы по прежнему guest-compatible сценарию,
  но история покупок, защищённые материалы и будущие видеоразборы остаются
  закрытыми до подтверждения email. В кабинете постоянно отображается плашка с
  повторной отправкой письма.
- Telegram-вход сразу создаёт сессию и возвращает нового или существующего
  пользователя на главную. Email не блокирует быстрый вход; он требуется для
  привязки покупок, доставки файлов и восстановления доступа.
- Миграции: `docs/sql/add-customer-auth.sql` и
  `docs/sql/allow-telegram-users-without-email.sql`. Исправление ранее созданных
  цепочек объединения находится в `docs/sql/flatten-user-merge-chains.sql`.
  Выполняются отдельно в dev и production; production не изменять без прямого
  указания пользователя.

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

### Схема `tab_downloads`

```sql
id              bigserial PRIMARY KEY
tab_id          uuid NOT NULL FK → guitar-tabs(id) ON DELETE CASCADE
downloaded_at   timestamptz NOT NULL DEFAULT now()
```

Одна строка соответствует одному успешному запросу скачивания. Формат отдельно не хранится.

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
  created_at?: string
  title_ru: string
  title_en: string
  difficulty: string
  price: number
  description_ru?: string
  description_en?: string
  photo_url?: string
  files: TabFiles           // { pdf?, gp5?, gpx?, mp3? }
  purchase_count: number
  download_count?: number   // вычисляется запросом COUNT(tab_downloads)
  youtube_url?: string
  is_published: boolean
  characteristics?: TabCharacteristics
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
| `/api/payment/create` | POST | Создание подписанной POST-формы Robokassa |
| `/api/payment/webhook` | GET, POST | Проверка и обработка ResultURL Robokassa |

### Другие Routes

| Route | Method | Описание |
|-------|--------|----------|
| `/api/tabs/[id]/preview` | GET | PDF превью первой страницы |
| `/api/tabs/[id]/audio` | GET | MP3 аудио из файловой системы |
| `/api/tabs/[id]/download` | GET | ZIP бесплатного таба или отдельный файл через `?format=pdf|gp5|gpx` |
| `/api/files/[tabId]/[format]` | GET | PDF/GP5/GPX из базы (bytea) с Range requests |
| `/api/email/webhook` | POST | События Resend (delivered, opened) |
| `/api/purchases/[id]` | GET | Получение информации о заказе |
| `/api/unsubscribe` | GET | Отписка от рассылки |

### Customer Auth API

| Route | Method | Описание |
|-------|--------|----------|
| `/api/auth/register` | POST | Создание аккаунта и отправка подтверждения email |
| `/api/auth/login` | POST | Вход по email и паролю |
| `/api/auth/logout` | POST | Удаление текущей серверной сессии |
| `/api/auth/me` | GET | Текущий пользователь по защищённой cookie |
| `/api/auth/verify-email` | POST | Одноразовое подтверждение email и создание сессии |
| `/api/auth/resend-verification` | POST | Повторное письмо без раскрытия наличия аккаунта |
| `/api/auth/forgot-password` | POST | Запрос ссылки восстановления без account enumeration |
| `/api/auth/reset-password` | POST | Одноразовая смена пароля и отзыв всех сессий |
| `/api/auth/telegram/start` | GET | Создание одноразового `state` и выдача публичного bot ID для Login Widget |
| `/api/auth/telegram/callback` | GET | Проверка HMAC-подписи и свежести данных Telegram Login Widget |
| `/api/account/email` | POST | Добавление email в Telegram-аккаунт и отправка подтверждения |
| `/api/account/purchases` | GET | Успешные покупки текущего пользователя |
| `/api/account/merge-telegram` | POST | Подтверждённое объединение конфликтующих аккаунтов |

Публичные страницы: `/{locale}/auth`, `/verify-email`, `/forgot-password`,
`/reset-password`, `/account`, `/account/settings`. Личный кабинет содержит
покупки и будущие разборы; подтверждение email, повторное письмо, Telegram и
объединение аккаунтов вынесены в отдельные настройки. Регистрация требует отдельного согласия на
обработку персональных данных; акцепт публичной оферты остаётся на этапе оплаты.
Подписка на новости остаётся отдельным необязательным согласием.
После входа и регистрации пользователь попадает в личный кабинет; при
неподтверждённом email там отображается постоянное напоминание. В хедере
авторизованный пользователь видит отдельную иконку меню личного кабинета.

Telegram использует классический Login Widget. Домен сайта необходимо привязать
к боту командой `/setdomain` в BotFather, а в серверное окружение добавить:

```env
TELEGRAM_BOT_TOKEN=секретный_токен_бота_из_BotFather
NEXT_PUBLIC_TELEGRAM_AUTH_ENABLED=true
```

Bot ID извлекается на сервере из токена и передаётся клиенту отдельно; сам токен
никогда не попадает в браузер. Callback принимает подписанные Telegram поля,
проверяет HMAC-SHA-256 через SHA-256 токена, ограничивает возраст `auth_date`
десятью минутами и дополнительно сверяет одноразовый `state` из HttpOnly cookie.
За reverse proxy последующие редиректы строятся по внешним `X-Forwarded-Host`
и `X-Forwarded-Proto`, а не по внутреннему адресу Next.js.
Login Widget запрашивает `request_access=write`, поэтому на экране Telegram
пользователь отдельно разрешает или запрещает боту писать ему личные сообщения;
поле `allows_write_to_pm` включается в проверяемую HMAC-подпись.

При конфликте Telegram не перепривязывается автоматически. Свежая подписанная
авторизация Telegram подтверждает владение исходным аккаунтом, активная
cookie-сессия — целевым, после
чего пользователь отдельно подтверждает объединение. В транзакции переносятся
Telegram identity и связанные `customers`, исходный аккаунт получает
`merged_into_user_id`, а его email и пароль продолжают вести в основной аккаунт.
При последовательном объединении трёх и более аккаунтов транзакция находит
корневой исходный аккаунт, переносит связанные данные всего кластера и напрямую
переназначает каждый старый профиль на новый корень, не создавая цепочки A → B → C.
Одноразовая HttpOnly cookie выбирает конкретную попытку объединения. Если reverse
proxy не сохранил её, маршрут может использовать только последнюю неиспользованную
попытку текущего авторизованного пользователя, созданную не более 15 минут назад.

---

## Ключевые компоненты

### TabCard (`src/components/shared/TabCard/TabCard.tsx`)
- 3D tilt эффект при ховере (Framer Motion)
- Бейдж сложности с цветовой кодировкой
- Бейджи форматов (PDF, GP5, GPX, MP3)
- Для платных табов: добавление/удаление из корзины, кнопки «Подробнее» и «Купить»
- Для бесплатных табов: кнопки «Подробнее» и выпадающее меню скачивания
- Счётчик покупок для платных и скачиваний для бесплатных
- Цена/метка «Бесплатно» на фоне из граффити-мазков с мягкой подсветкой текста
- Кнопки корзины, «Подробнее» и «Купить» используют мягко-прямоугольную форму
- Отключение анимаций на touch-устройствах

### TabDetails (`src/components/shared/TabDetails.tsx`)
- Детальная страница таба: название, описание, дата добавления, сложность,
  форматы и состав набора
- Форматы отображаются поверх лёгкого blur-градиента внизу медиакарточки:
  GP5/GPX объединены в один пункт `Guitar Pro`, PDF и MP3 показаны отдельными
  круглыми индикаторами с иконками
- Для платных: корзина, покупка и PDF-превью
- Для бесплатных: прямое скачивание без превью
- Счётчик покупок/скачиваний
- У платных табов под действиями отображаются «Надёжная оплата» и
  «Быстрая доставка»
- Описание состава упоминает MP3-версию исполнения только при наличии MP3
- Анимация открытия и обратного закрытия превью для платных табов

### FreeDownloadMenu (`src/components/shared/FreeDownloadMenu.tsx`)
- Показывает только доступные варианты
- Guitar Pro скачивает GPX в приоритете, GP5 используется как fallback
- PDF скачивается отдельно
- ZIP содержит все доступные файлы
- Пункты выпадающего меню используют нейтральный hover в обеих темах
- Во время загрузки активная кнопка показывает loader, а меню скачивания во всех
  остальных карточках временно блокируется
- Файл сначала запрашивается управляемым клиентским запросом, поэтому повторные
  клики не создают несколько параллельных загрузок или окон браузера

### AudioPlayerDialog (`src/components/shared/AudioPlayerDialog.tsx`)
- Аудиоплеер с прогресс-баром и буферизацией
- Кнопки play/pause, перемотка ±10 сек
- Регулировка громкости с кнопкой mute
- Responsive layout: mobile (<640px) space-between, desktop кнопки по центру + громкость справа
- Скрытие album art на touch устройствах в landscape с высотой < 500px
- Yandex Metrika событие 'listen_preview'

### TabPreviewDialog (`src/components/shared/TabPreviewDialog.tsx`)
- PDF.js рендеринг первой страницы
- Auto-scroll анимация
- Кнопка скачивания PDF с circular progress анимацией
- Tooltip'ы с задержкой (через useDelayedRender)

### CheckoutForm (`src/components/shared/CheckoutForm.tsx`)
- Валидация имени, email
- Newsletter opt-in
- Чекбокс соглашения
- Отправка POST-формы и переход на Robokassa
- Для авторизованного пользователя имя и email предварительно заполнены; если
  подтверждённый email совпадает с заказом, покупатель связывается с `user_id`.

### CartDrawer (`src/components/shared/CartDrawer.tsx`)
- Выезжающая панель с товарами
- Отображение оптовой скидки (10% от 2 шт, 15% от 3 шт)
- Подсказка о следующем пороге показывается только когда в каталоге существует
  ещё один опубликованный платный таб
- При максимальном доступном уровне показывается отдельное подтверждение скидки
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

**Провайдер:** Robokassa

### Flow оплаты

1. Пользователь заполняет форму → `/api/payment/create`
2. Сервер создаёт pending purchase в БД
3. Сервер создаёт уникальный `InvId`, состав чека `Receipt` и `SignatureValue`
4. Браузер отправляет подписанную POST-форму на платёжную страницу Robokassa
5. После оплаты Robokassa вызывает ResultURL → `/api/payment/webhook`
6. Сервер:
   - проверяет подпись Паролем №2, сумму, `InvId` и `Shp_purchase_id`;
   - Обновляет статус purchase на `succeeded`
   - Инкрементирует `purchase_count` таба (через прямой SQL)
   - Генерирует ZIP с файлами (JSZip)
   - Отправляет email через Resend

Повторные ResultURL идемпотентны: один заказ не увеличивает `purchase_count`
повторно. `payment_id` в `purchases` хранит `InvId` Robokassa.
`Receipt`, `SuccessUrl2` и `FailUrl2` включаются в подпись в URL-кодированном
виде согласно требованиям платёжного интерфейса.

### Переменные Robokassa

```env
ROBOKASSA_MERCHANT_LOGIN=идентификатор_магазина
ROBOKASSA_PASSWORD_1=тестовый_пароль_1
ROBOKASSA_PASSWORD_2=тестовый_пароль_2
ROBOKASSA_TEST_MODE=true
ROBOKASSA_HASH_ALGORITHM=md5
ROBOKASSA_PAYMENT_OBJECT=service
```

Алгоритм должен совпадать с техническими настройками магазина. До активации
используются тестовые пароли и `ROBOKASSA_TEST_MODE=true`. Для production нужно
установить рабочие пароли и явно задать `ROBOKASSA_TEST_MODE=false`.

В кабинете Robokassa ResultURL должен указывать на
`https://<домен>/api/payment/webhook`; рекомендуемый метод — POST.

### Тестовый режим

- `IsTest=1` передаётся при `ROBOKASSA_TEST_MODE=true`.
- Используются только тестовые Пароль №1 и Пароль №2 из технических настроек.
- Для первичной проверки используется минимальная подпись
  `MerchantLogin:OutSum:InvId:Пароль#1`; заказ в ResultURL определяется по
  сохранённому `InvId`. Фискальный `Receipt` и динамические ReturnURL включаются
  в боевом режиме.
- ResultURL должен быть доступен Robokassa из интернета; для localhost нужен
  HTTPS-туннель или тестирование на dev-стенде.

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

`src/i18n/navigation.ts` экспортирует локализованные `useRouter` и
`usePathname`. Этому router нужно передавать путь без ручного префикса локали:
`router.push('/#contacts')`, а не `router.push('/en#contacts')`, иначе получится
дублирование вида `/en/en`.

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

При создании/редактировании выбирается тип «Платный» или «Бесплатный»:
- платный требует цену больше нуля;
- бесплатный сохраняется с `price = 0`;
- MP3 не предлагается при создании бесплатного таба;
- хотя бы один файл таба обязателен.
- При создании и редактировании задаются особенности исполнения: техники
  (`barre`, `percussion`, `harmonics`, `tapping`), строй и каподастр `0–12`.
- Для строя `custom` обязательно текстовое название собственного варианта.

---

## Email система

- **Провайдер:** Resend
- **From:** `OlegGuitar <noreply@olegguitar.com>`
- **Batch sending** для рассылок
- **Tracking:** opened/delivered статусы через вебхук `/api/email/webhook`
- **Priority:** opened > delivered > sent

---

## Налоговый учёт (РФ)

- **Фискализация:** Robokassa / Робочеки для самозанятого.
- В платёж передаётся `Receipt` с каждой позицией, скидкой и `tax: none`.
- Отдельный вызов MyNalog после оплаты отключён, чтобы не формировать два чека.
- `ROBOKASSA_PAYMENT_OBJECT` задаёт предмет расчёта и по умолчанию равен
  `service`; значение необходимо сверить с настройками магазина и бухгалтерским
  сценарием перед включением боевого режима.

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

### Гибридное хранение

**MP3 файлы** — в файловой системе `public/audio/{tabId}.mp3`
- В `tab_files` хранится только метаданные (filename, content_type) с `data = NULL`
- API `/api/tabs/[id]/audio` отдаёт файл из файловой системы
- Webhook читает MP3 из ФС при генерации ZIP

**PDF, GP5, GPX** — в PostgreSQL `tab_files.data` (bytea)
- API `/api/files/[tabId]/[format]` отдаёт файлы из базы
- Поддержка Range requests для стриминга
- Webhook читает из БД при генерации ZIP

### API endpoints

| Endpoint | Описание |
|----------|----------|
| `/api/tabs/[id]/audio` | GET MP3 из файловой системы |
| `/api/files/[tabId]/[format]` | GET PDF/GP5/GPX из базы (bytea) |
| `/api/tabs/[id]/preview` | GET первая страница PDF для превью |
| `/api/tabs/[id]/download` | GET защищённая загрузка файлов опубликованного бесплатного таба |

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
- Смена темы выполняется через View Transition API с fallback
- Иконки солнца/луны анимируются Framer Motion

---

## Каталог и сортировка

- Поиск выполняется по русскому и английскому названию
- Сортировки (популярность, дата добавления, название, сложность, цена) собраны
  в одно выпадающее меню; повторный выбор активного пункта меняет направление
- При фильтре «Бесплатные» сортировка по цене скрывается
- В том же попапе доступны фильтры по техникам, строю и каподастру. Несколько
  техник можно комбинировать; строй и каподастр выбираются по одному значению
- Характеристики исполнения полностью показываются в детализации таба, но не
  выводятся на компактной карточке каталога
- Фильтр «Бесплатные» и сброс остаются отдельными мягко-прямоугольными кнопками
- Популярность платных определяется `purchase_count`
- Популярность бесплатных определяется `download_count`
- Скидочные пороги рассчитываются только по количеству платных табов

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
| i18n config | `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts` |
| Cart context | `src/context/CartContext.tsx` |
| Cart animation context | `src/context/CartAnimationContext.tsx` |
| Admin context | `src/context/AdminContext.tsx` |
| PreviewBlock context | `src/context/PreviewBlockContext.tsx` |
| Детальная страница | `src/app/[locale]/tabs/[id]/page.tsx` |
| Компонент детализации | `src/components/shared/TabDetails.tsx` |
| Меню бесплатной загрузки | `src/components/shared/FreeDownloadMenu.tsx` |
| API бесплатной загрузки | `src/app/api/tabs/[id]/download/route.ts` |
| Payment webhook (Robokassa ResultURL) | `src/app/api/payment/webhook/route.ts` |
| Payment create (Robokassa form) | `src/app/api/payment/create/route.ts` |
| Admin login | `src/app/api/admin/login/route.ts` |
| Tab upload | `src/app/api/admin/upload-tab/route.ts` |
| Main page | `src/app/[locale]/page.tsx` |
| Admin page | `src/app/[locale]/admin/page.tsx` |
| Audio endpoint | `src/app/api/tabs/[id]/audio/route.ts` |
| Files endpoint | `src/app/api/files/[tabId]/[format]/route.ts` |
| PreviewBlock context | `src/context/PreviewBlockContext.tsx` |
| useOrientation hook | `src/hooks/useOrientation.ts` |
