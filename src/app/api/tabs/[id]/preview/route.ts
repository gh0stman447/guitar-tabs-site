import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { TABLE_TABS, BUCKET_TAB_FILES } from '@/lib/constants';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: tab, error } = await supabaseAdmin
    .from(TABLE_TABS)
    .select('files, is_published')
    .eq('id', id)
    .single();

  if (error || !tab) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!tab.is_published) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  const files = tab.files as Record<string, string>;
  const pdfPath = files?.pdf;

  if (!pdfPath) {
    return NextResponse.json({ error: 'No PDF' }, { status: 404 });
  }

  const { data, error: dlError } = await supabaseAdmin.storage
    .from(BUCKET_TAB_FILES)
    .download(pdfPath);

  if (dlError || !data) {
    return NextResponse.json({ error: 'Failed to load PDF' }, { status: 500 });
  }

  const buffer = await data.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': buffer.byteLength.toString(),
      'Cache-Control': 'no-store',
    },
  });
}
