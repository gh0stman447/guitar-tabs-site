import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PDFDocument } from 'pdf-lib';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Check if tab exists
  const tabResult = await query('SELECT id FROM "guitar-tabs" WHERE id = $1', [id]);

  if (tabResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Get PDF data from DB
  const result = await query(
    'SELECT filename, content_type, data FROM tab_files WHERE tab_id = $1 AND format = $2',
    [id, 'pdf'],
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'No PDF' }, { status: 404 });
  }

  const row = result.rows[0];

  // Read PDF data from database (bytea)
  let pdfFileBuffer: Buffer;
  if (typeof row.data === 'string') {
    const hexString = row.data.replace(/^\\x/, '');
    pdfFileBuffer = Buffer.from(hexString, 'hex');
  } else if (Buffer.isBuffer(row.data)) {
    pdfFileBuffer = row.data;
  } else {
    return NextResponse.json({ error: 'PDF data not found' }, { status: 404 });
  }

  // Load the PDF and extract only the first page
  const pdfDoc = await PDFDocument.load(pdfFileBuffer);
  const newPdf = await PDFDocument.create();
  const [firstPage] = await newPdf.copyPages(pdfDoc, [0]);
  newPdf.addPage(firstPage);
  const previewPdfBytes = await newPdf.save();

  // Extract base name without extension for preview filename
  const baseName = row.filename.replace(/\.pdf$/i, '');

  // Convert Uint8Array to ArrayBuffer for Blob
  const pdfBuffer = previewPdfBytes.buffer as ArrayBuffer;

  return new NextResponse(new Blob([pdfBuffer], { type: 'application/pdf' }), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${baseName}_preview.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
