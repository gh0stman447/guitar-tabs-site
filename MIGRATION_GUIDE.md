# Миграция с Supabase на VPS (PostgreSQL + файловое хранилище)

Это руководство по миграции проекта guitar-tabs-site с Supabase на российский VPS.

---

## Шаг 1: Установка PostgreSQL на VPS

### Подключись к VPS по SSH:
```bash
ssh root@<твой-IP-москва>
```

### Установи PostgreSQL:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
```

### Настрой базу данных:
```bash
# Зайди под пользователем postgres
sudo -u postgres psql
```

### В PostgreSQL создай базу и пользователя:
```sql
CREATE DATABASE guitar_tabs;
CREATE USER guitar WITH PASSWORD '<придумай-пароль>';
GRANT ALL PRIVILEGES ON DATABASE guitar_tabs TO guitar;
\q
```

### Разреши подключение по паролю:
```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Добавь или измени строку:
```
host    guitar_tabs    guitar    0.0.0.0/0    md5
```

Перезагрузи PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## Шаг 2: Экспорт данных из Supabase

### На локальной машине:
```bash
# Экспорт структуры и данных
pg_dump -h db.<твой-project>.supabase.co -U postgres -d guitar_tabs --no-owner --no-privileges --schema=public --format=plain > supabase_dump.sql
```

### Импорт на VPS:
```bash
# Скопируй файл на VPS
scp supabase_dump.sql root@<твой-IP-москва>:~/

# На VPS импортируй
sudo -u postgres psql -d guitar_tabs < supabase_dump.sql
```

---

## Шаг 3: Настройка файлового хранилища

### Создай директорию для файлов:
```bash
sudo mkdir -p /var/www/guitar-tabs/storage
sudo chown -R $USER:$USER /var/www/guitar-tabs/storage
```

### Скачай файлы из Supabase Storage

Нужно скачать все файлы из бакета `tab-files`. Это можно сделать через:
1. Supabase Dashboard → Storage → скачать файлы вручную
2. Или через API (скрипт ниже)

### Скрипт для скачивания файлов (локально):
```python
# download_supabase_files.py
import os
import requests
from supabase import create_client

SUPABASE_URL = "https://<project>.supabase.co"
SUPABASE_KEY = "<service-role-key>"
OUTPUT_DIR = "./supabase-files"

client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Получить список файлов
buckets = client.storage.list_buckets()
for bucket in buckets:
    if bucket.name == 'tab-files':
        files = client.storage.from_('tab-files').list()
        for file in files:
            # Скачать файл
            response = client.storage.from_('tab-files').download(file.name)

            # Сохранить локально
            os.makedirs(os.path.dirname(f"{OUTPUT_DIR}/{file.name}"), exist_ok=True)
            with open(f"{OUTPUT_DIR}/{file.name}", "wb") as f:
                f.write(response)
```

### Загрузи файлы на VPS:
```bash
# Скопируй файлы на VPS
scp -r supabase-files/* root@<твой-IP-москва>:/var/www/guitar-tabs/storage/
```

---

## Шаг 4: Настройка переменных окружения

### Создай файл `.env.local` в корне проекта:

```bash
# Database (PostgreSQL на VPS)
DB_HOST=<твой-IP-москва>
DB_PORT=5432
DB_NAME=guitar_tabs
DB_USER=guitar
DB_PASSWORD=<пароль-который-придумал>

# Storage (файлы на VPS)
STORAGE_ROOT=/var/www/guitar-tabs/storage
STORAGE_URL=https://olegguitar.com/storage

# YooKassa
YUKASSA_SHOP_ID=<shop-id>
YUKASSA_SECRET_KEY=<secret-key>
YUKASSA_TEST_SHOP_ID=<test-shop-id>
YUKASSA_TEST_SECRET_KEY=<test-secret-key>

# Resend (email)
RESEND_API_KEY=<resend-key>

# MyNalog proxy
NALOG_PROXY_URL=http://157.22.204.114:5000
NALOG_PROXY_TEST_MODE=false

# Site
NEXT_PUBLIC_SITE_URL=https://olegguitar.com
```

---

## Шаг 5: Настройка nginx для раздачи файлов

### Создай конфиг nginx:
```bash
sudo nano /etc/nginx/sites-available/guitar-tabs
```

### Добавь конфигурацию:
```nginx
server {
    listen 80;
    server_name olegguitar.com www.olegguitar.com;

    location /storage/ {
        alias /var/www/guitar-tabs/storage/;
        autoindex off;
        try_files $uri $uri/ =404;

        # Защита от hotlink (опционально)
        valid_referers olegguitar.com;
        if ($invalid_referer) {
            return 403;
        }
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Включи сайт:
```bash
sudo ln -s /etc/nginx/sites-available/guitar-tabs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Шаг 6: Установка зависимостей и запуск

### На VPS:
```bash
# Установи Node.js (если не установлен)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установи зависимости
cd /var/www/guitar-tabs-site
npm install

# Сбилди проект
npm run build

# Запусти через PM2 (или systemd)
npm install -g pm2
pm2 start npm --name "guitar-tabs" -- start
pm2 save
pm2 startup
```

---

## Шаг 7: Проверка

### Проверь что всё работает:
1. Открой сайт — табы должны грузиться
2. Проверь админку — создание/редактирование табов
3. Протестируй покупку (тестовый режим)

### Логи:
```bash
# PM2 логи
pm2 logs guitar-tabs

# Nginx логи
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Переменные окружения (.env.local)

```env
# ===========================================
# DATABASE (PostgreSQL на VPS)
# ===========================================
DB_HOST=<твой-IP-москва>
DB_PORT=5432
DB_NAME=guitar_tabs
DB_USER=guitar
DB_PASSWORD=<пароль>

# ===========================================
# STORAGE (файлы на диске VPS)
# ===========================================
STORAGE_ROOT=/var/www/guitar-tabs/storage
STORAGE_URL=https://olegguitar.com/storage

# ===========================================
# YOOKASSA (платежи)
# ===========================================
YUKASSA_SHOP_ID=<shop-id>
YUKASSA_SECRET_KEY=<secret-key>
YUKASSA_TEST_SHOP_ID=<test-shop-id>
YUKASSA_TEST_SECRET_KEY=<test-secret-key>

# ===========================================
# RESEND (email рассылка)
# ===========================================
RESEND_API_KEY=<resend-key>

# ===========================================
# MYNALOG PROXY (налоговый учёт)
# ===========================================
NALOG_PROXY_URL=http://157.22.204.114:5000
NALOG_PROXY_TEST_MODE=false

# ===========================================
# SITE
# ===========================================
NEXT_PUBLIC_SITE_URL=https://olegguitar.com

# ===========================================
# ADMIN (пароль для админки)
# ===========================================
ADMIN_PASSWORD=<пароль-для-админки>
```

---

## Что изменилось

| Было | Стало |
|------|-------|
| Supabase PostgreSQL | PostgreSQL на VPS |
| Supabase Storage | Файлы на диске (`/var/www/guitar-tabs/storage`) |
| `@supabase/supabase-js` | `pg` (node-postgres) |
| RLS (Row Level Security) | Прямые запросы через API |

---

## Бэкапы

### База данных:
```bash
# Создать дамп
sudo -u postgres pg_dump guitar_tabs > backup_$(date +%Y%m%d).sql

# Сжать
gzip backup_*.sql

# Скопировать на локальную машину
scp root@<твой-IP>:/home/backup_*.sql ./
```

### Файлы:
```bash
# Скопировать файлы
tar -czf storage_backup_$(date +%Y%m%d).tar.gz /var/www/guitar-tabs/storage
```

---

## Если что-то пошло не так

### Ошибка подключения к БД:
```bash
# Проверь что PostgreSQL запущен
sudo systemctl status postgresql

# Проверь логи
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Файлы не грузятся:
```bash
# Проверь права
ls -la /var/www/guitar-tabs/storage

# Проверь nginx
sudo nginx -t
sudo systemctl status nginx
```

### Приложение не запускается:
```bash
# PM2 логи
pm2 logs guitar-tabs --lines 100

# Перезапусти
pm2 restart guitar-tabs
```
