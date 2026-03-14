import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdminSession } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const authError = requireAdminSession(req);
  if (authError) return authError;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Only allow deleting drafts
  const { data: tab, error: fetchError } = await supabaseAdmin
    .from('guitar-tabs')
    .select('is_published, files, photo_url')
    .eq('id', id)
    .single();

  if (fetchError || !tab) return NextResponse.json({ error: 'Tab not found' }, { status: 404 });
  if (tab.is_published)
    return NextResponse.json({ error: 'Cannot delete published tab' }, { status: 403 });

  // Delete entire folder from storage by listing all files in it
  const { data: storageFiles } = await supabaseAdmin.storage.from('tab-files').list(id);
  console.log(`Deleting tab ${id}, found ${storageFiles?.length ?? 0} files in storage`);
  console.log(storageFiles);
  if (storageFiles && storageFiles.length > 0) {
    const paths = storageFiles.map((f) => `${id}/${f.name}`);
    await supabaseAdmin.storage.from('tab-files').remove(paths);
  }

  const { error } = await supabaseAdmin.from('guitar-tabs').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
