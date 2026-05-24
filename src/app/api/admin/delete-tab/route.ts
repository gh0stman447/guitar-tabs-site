import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdminSession } from '@/lib/admin-auth';
import { TABLE_TABS } from '@/lib/constants';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const authError = requireAdminSession(req);
  if (authError) return authError;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Only allow deleting drafts
  const { data: tab, error: fetchError } = await supabaseAdmin
    .from(TABLE_TABS)
    .select('is_published, files, photo_url')
    .eq('id', id)
    .single();

  if (fetchError || !tab) return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
  if (tab.is_published)
    return NextResponse.json({ error: 'Cannot delete published tab' }, { status: 403 });

  // Delete files from tab_files table (storage handles cleanup automatically)
  await query('DELETE FROM tab_files WHERE tab_id = $1', [id]);

  const { error } = await supabaseAdmin.from(TABLE_TABS).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
