/**
 * Скрипт миграции аудиофайлов из PostgreSQL в файловую систему
 *
 * Использование:
 * npx tsx scripts/migrate-audio-to-fs.ts
 */

import { query } from '../src/lib/db';
import fs from 'fs';
import path from 'path';

const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

async function migrate() {
  console.log('🚀 Начало миграции аудиофайлов из БД в ФС...\n');

  // Создаём директорию
  await fs.promises.mkdir(AUDIO_DIR, { recursive: true });
  console.log(`📁 Директория: ${AUDIO_DIR}\n`);

  // Получаем все MP3 файлы из БД
  const result = await query(
    'SELECT tab_id, filename, content_type, data FROM tab_files WHERE format = $1',
    ['mp3']
  );

  console.log(`📊 Найдено файлов в БД: ${result.rows.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const row of result.rows) {
    const { tab_id, filename, data } = row;
    const filePath = path.join(AUDIO_DIR, `${tab_id}.mp3`);

    try {
      // Проверяем, есть ли уже файл
      if (fs.existsSync(filePath)) {
        console.log(`⏭️  Пропущено: ${tab_id} (файл уже существует)`);
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
        console.error(`❌ Неизвестный формат данных для ${tab_id}`);
        errorCount++;
        continue;
      }

      // Сохраняем файл
      await fs.promises.writeFile(filePath, buffer);

      // Обновляем БД - удаляем data, оставляем метаданные
      await query(
        'UPDATE tab_files SET data = NULL WHERE tab_id = $1 AND format = $2',
        [tab_id, 'mp3']
      );

      console.log(`✅ Успешно: ${tab_id} (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);
      successCount++;
    } catch (err) {
      console.error(`❌ Ошибка для ${tab_id}:`, err);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Результаты миграции:');
  console.log(`✅ Успешно: ${successCount}`);
  console.log(`❌ Ошибки: ${errorCount}`);
  console.log('='.repeat(50));

  if (successCount > 0) {
    console.log('\n✨ Миграция завершена!');
    console.log('Теперь нужно обновить код для работы с ФС (уже сделано).');
  }
}

// Запуск
migrate().catch((err) => {
  console.error('💥 Фатальная ошибка:', err);
  process.exit(1);
});
