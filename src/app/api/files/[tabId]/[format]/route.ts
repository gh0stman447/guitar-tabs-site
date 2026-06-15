import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tabId: string; format: string }> }
) {
  const { tabId, format } = await params;

  // Get file data from DB
  const result = await query(
    'SELECT filename, content_type, data FROM tab_files WHERE tab_id = $1 AND format = $2',
    [tabId, format]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const row = result.rows[0];

  // MP3 files are stored in filesystem, not in database
  if (!row.data) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const contentType = row.content_type || 'application/octet-stream';

  // Get file data from database (bytea)
  let fileBuffer: Buffer;
  if (typeof row.data === 'string') {
    const hexString = row.data.replace(/^\\x/, '');
    fileBuffer = Buffer.from(hexString, 'hex');
  } else if (Buffer.isBuffer(row.data)) {
    fileBuffer = row.data;
  } else {
    return NextResponse.json({ error: 'Invalid file data' }, { status: 500 });
  }

  // Handle Range requests for streaming
  const rangeHeader = req.headers.get('range');
  if (rangeHeader) {
    const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : fileBuffer.length - 1;
      const chunkSize = end - start + 1;

      return new NextResponse(fileBuffer.slice(start, end + 1), {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Length': chunkSize.toString(),
          'Content-Range': `bytes ${start}-${end}/${fileBuffer.length}`,
          'Accept-Ranges': 'bytes',
          'Content-Disposition': `inline; filename="${row.filename}"`,
        },
      });
    }
  }

  // Return full file
  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length.toString(),
      'Content-Disposition': `inline; filename="${row.filename}"`,
    },
  });
}
