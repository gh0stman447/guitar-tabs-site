/**
 * Скрипт миграции всех файлов из PostgreSQL в файловую систему
 *
 * Использование:
 * npx tsx scripts/migrate-all-files-to-fs.ts
 */

import { query } from '../src/lib/db';
import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'public', 'files');
const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

async function migrate() {
  console.log('🚀 Начало миграции всех файлов из БД в ФС...\n');

  // Создаём директорию
  await fs.promises.mkdir(STORAGE_DIR, { recursive: true });
  await fs.promises.mkdir(AUDIO_DIR, { recursive: true });
  console.log(`📁 Директория файлов: ${STORAGE_DIR}`);
  console.log(`📁 Директория аудио: ${AUDIO_DIR}\n`);

  // Получаем все файлы из БД
  const result = await query(
    'SELECT tab_id, format, filename, content_type, data FROM tab_files WHERE data IS NOT NULL',
    []
  );

  console.log(`📊 Найдено файлов в БД: ${result.rows.length}\n`);

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  for (const row of result.rows) {
    const { tab_id, format, filename, data } = row;

    // Определяем путь для файла
    let filePath: string;
    if (format === 'mp3') {
      filePath = path.join(AUDIO_DIR, `${tab_id}.mp3`);
    } else {
      const tabDir = path.join(STORAGE_DIR, tab_id);
      await fs.promises.mkdir(tabDir, { recursive: true });
      filePath = path.join(tabDir, filename);
    }

    try {
      // Проверяем, есть ли уже файл
      if (fs.existsSync(filePath)) {
        console.log(`⏭️  Пропущено: ${tab_id}/${format} (файл уже существует)`);
        skipCount++;
        continue;
      }

      // Конвертируем данные в буфер
      let buffer: Buffer;
      if (typeof data === 'string') {
        // Hex string from PostgreSQL
        const hexString = data.replace(/^\\\\x/, '').replace(/^\\x/, '');
        buffer = Buffer.from(hexString, 'hex');
      } else if (Buffer.isBuffer(data)) {
        buffer = data;
      } else {
        console.error(`❌ Неизвестный формат данных для ${tab_id}/${format}`);
        errorCount++;
        continue;
      }

      // Сохраняем файл
      await fs.promises.writeFile(filePath, buffer);

      // Обновляем БД - удаляем data, оставляем метаданные
      await query(
        'UPDATE tab_files SET data = NULL WHERE tab_id = $1 AND format = $2',
        [tab_id, format]
      );

      console.log(`✅ Успешно: ${tab_id}/${format} (${(buffer.length / 1024).toFixed(2)}KB)`);
      successCount++;
    } catch (err) {
      console.error(`❌ Ошибка для ${tab_id}/${format}:`, err);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Результаты миграции:');
  console.log(`✅ Успешно: ${successCount}`);
  console.log(`⏭️  Пропущено: ${skipCount}`);
  console.log(`❌ Ошибки: ${errorCount}`);
  console.log('='.repeat(50));

  if (successCount > 0) {
    console.log('\n✨ Миграция завершена!');
    console.log('Теперь файлы хранятся в ФС, а в БД только метаданные.');
  }
}

// Запуск
migrate().catch((err) => {
  console.error('💥 Фатальная ошибка:', err);
  process.exit(1);
});
