import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdminSession } from '@/lib/admin-auth';
import { TABLE_TABS } from '@/lib/constants';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  const authError = requireAdminSession(req);
  if (authError) return authError;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Проверка: есть ли у таба PDF файл
  const { data: tab } = await supabaseAdmin
    .from(TABLE_TABS)
    .select('files')
    .eq('id', id)
    .single();

  if (!tab?.files?.pdf) {
    return NextResponse.json({ error: 'Для публикации необходим PDF файл' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from(TABLE_TABS)
    .update({ is_published: true })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag('published-tabs', 'max');
  return NextResponse.json({ ok: true });
}
