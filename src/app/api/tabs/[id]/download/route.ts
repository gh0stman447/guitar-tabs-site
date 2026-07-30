import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TABLE_TABS } from '@/lib/constants';
import { downloadFile, listFiles } from '@/lib/storage';
import { query } from '@/lib/db';
import { FORMATS } from '@/types';

async function recordDownload(tabId: string) {
  try {
    await query('INSERT INTO tab_downloads (tab_id) VALUES ($1)', [tabId]);
  } catch (error) {
    console.error('[free-tab-download] Failed to record download:', error);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { data: tab, error } = await supabaseAdmin
    .from(TABLE_TABS)
    .select('id, price, is_published')
    .eq('id', id)
    .single();

  if (error || !tab || !tab.is_published) {
    return NextResponse.json({ error: 'Таб не найден' }, { status: 404 });
  }

  if (Number(tab.price) > 0) {
    return NextResponse.json(
      { error: 'Этот таб доступен только после покупки' },
      { status: 403 },
    );
  }

  const availableFiles = (await listFiles(id)).filter((file) =>
    FORMATS.includes(file.format as (typeof FORMATS)[number]),
  );

  if (availableFiles.length === 0) {
    return NextResponse.json({ error: 'Файлы таба не найдены' }, { status: 404 });
  }

  const requestedFormat = new URL(request.url).searchParams.get('format');
  if (requestedFormat) {
    if (!FORMATS.includes(requestedFormat as (typeof FORMATS)[number])) {
      return NextResponse.json({ error: 'Неизвестный формат файла' }, { status: 400 });
    }

    const requestedFile = availableFiles.find((file) => file.format === requestedFormat);
    if (!requestedFile) {
      return NextResponse.json({ error: 'Файл этого формата не найден' }, { status: 404 });
    }

    const data = await downloadFile(requestedFile.path);
    const contentTypes: Record<(typeof FORMATS)[number], string> = {
      pdf: 'application/pdf',
      gp5: 'application/octet-stream',
      gpx: 'application/octet-stream',
      mp3: 'audio/mpeg',
    };
    const safeFilename = requestedFile.name
      .replace(/[^\x20-\x7E]/g, '_')
      .replace(/["\\]/g, '_');

    await recordDownload(id);

    return new NextResponse(new Blob([new Uint8Array(data)]), {
      headers: {
        'Content-Type': contentTypes[requestedFormat as (typeof FORMATS)[number]],
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  }

  const zip = new JSZip();
  await Promise.all(
    availableFiles.map(async (file) => {
      const data = await downloadFile(file.path);
      zip.file(file.name, data);
    }),
  );

  const archive = await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  await recordDownload(id);

  return new NextResponse(archive, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="guitar-tab-${id}.zip"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
