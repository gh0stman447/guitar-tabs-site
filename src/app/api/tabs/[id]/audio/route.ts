import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { query } from '@/lib/db';
import { Readable } from 'stream';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rangeHeader = req.headers.get('range');
  const reqId = Math.random().toString(36).slice(2, 8);
  const log = (msg: string, ...args: unknown[]) => {
    console.log(`[Audio ${reqId}] ${msg}`, ...args);
  };

  log('Request started', { range: rangeHeader ?? 'none' });

  // Получаем метаданные из БД (путь к файлу)
  const tMeta = Date.now();
  const metaResult = await query(
    'SELECT filename, content_type FROM tab_files WHERE tab_id = $1 AND format = $2',
    [id, 'mp3'],
  );
  log(`SQL metadata took ${Date.now() - tMeta}ms`);

  if (metaResult.rows.length === 0) {
    return NextResponse.json({ error: 'No audio' }, { status: 404 });
  }

  const row = metaResult.rows[0];
  const contentType = row.content_type || 'audio/mpeg';

  // MP3 file is stored in audio directory
  const filePath = path.join(process.cwd(), 'public', 'audio', `${id}.mp3`);

  // Проверяем существование файла
  if (!fs.existsSync(filePath)) {
    console.error(`[Audio ${reqId}] File not found:`, filePath);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Получаем размер файла
  const stat = await fs.promises.stat(filePath);
  const fileSize = stat.size;

  // Обработка Range запроса
  if (rangeHeader) {
    const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (!rangeMatch) {
      return new NextResponse('Invalid Range', { status: 416 });
    }

    const start = parseInt(rangeMatch[1], 10);
    const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      return new NextResponse('Range Not Satisfiable', {
        status: 416,
        headers: { 'Content-Range': `bytes */${fileSize}` },
      });
    }

    const chunkSize = end - start + 1;
    log(`Range: ${start}-${end} (${(chunkSize / 1024).toFixed(2)}KB)`);

    // Создаём стрим для части файла
    const stream = fs.createReadStream(filePath, { start, end });

    return new NextResponse(Readable.from(stream) as any, {
      status: 206,
      headers: {
        'Content-Type': contentType,
        'Content-Length': chunkSize.toString(),
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  }

  // Без Range — отдаём весь файл стримом
  log(`Sending full file: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
  const stream = fs.createReadStream(filePath);

  return new NextResponse(Readable.from(stream) as any, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': fileSize.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
