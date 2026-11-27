import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { downloadFile } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await query(
    'SELECT content_type FROM tab_files WHERE tab_id = $1 AND format = $2',
    [id, 'mp3'],
  );
  if (!result.rows.length) {
    return NextResponse.json({ error: 'No audio' }, { status: 404 });
  }

  let data: Buffer;
  try {
    data = await downloadFile(`${id}/audio.mp3`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const headers: Record<string, string> = {
    'Content-Type': result.rows[0].content_type || 'audio/mpeg',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, no-cache',
  };
  const range = req.headers.get('range');
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const start = match?.[1]
      ? Number(match[1])
      : Math.max(0, data.length - Number(match?.[2]));
    const end = match?.[1] && match[2]
      ? Math.min(Number(match[2]), data.length - 1)
      : data.length - 1;
    if (!match || (!match[1] && !match[2]) ||
        !Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
        start < 0 || start > end || end >= data.length) {
      return new NextResponse(null, {
        status: 416,
        headers: { ...headers, 'Content-Range': `bytes */${data.length}` },
      });
    }
    return new NextResponse(new Uint8Array(data.subarray(start, end + 1)), {
      status: 206,
      headers: {
        ...headers,
        'Content-Length': String(end - start + 1),
        'Content-Range': `bytes ${start}-${end}/${data.length}`,
      },
    });
  }
  return new NextResponse(new Uint8Array(data), {
    headers: { ...headers, 'Content-Length': String(data.length) },
  });
}
