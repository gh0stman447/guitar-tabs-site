import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdminSession } from '@/lib/admin-auth';
import { FORMATS } from '@/types';
import { TABLE_TABS } from '@/lib/constants';
import { uploadFile } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const authError = requireAdminSession(req);
  if (authError) return authError;

  const formData = await req.formData();

  const title_ru = formData.get('title_ru') as string;
  const title_en = formData.get('title_en') as string;
  const description_ru = (formData.get('description_ru') as string) ?? '';
  const description_en = (formData.get('description_en') as string) ?? '';
  const difficulty = formData.get('difficulty') as string;
  const price = parseFloat(formData.get('price') as string);
  const youtube_url = (formData.get('youtube_url') as string) ?? null;
  const photo = formData.get('photo') as File | null;

  if (!title_ru || !title_en || !difficulty || !price) {
    return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 });
  }

  const tabId = randomUUID();
  const folder = tabId;

  // First, create the tab record in DB (without files)
  const { data: tabData, error: createError } = await supabaseAdmin
    .from(TABLE_TABS)
    .insert({
      id: tabId,
      title_ru,
      title_en,
      description_ru,
      description_en,
      difficulty,
      price,
      youtube_url: youtube_url || null,
      photo_url: null,
      files: {},
      purchase_count: 0,
      is_published: false,
    })
    .select('id')
    .single();

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  // Upload tab files
  const files: Record<string, boolean> = {};
  for (const fmt of FORMATS) {
    const file = formData.get(fmt) as File | null;
    if (!file || file.size === 0) continue;

    if (/[а-яёА-ЯЁ]/.test(file.name)) {
      return NextResponse.json(
        {
          error: `Файл "${file.name}" содержит кириллицу в названии. Переименуйте файл латиницей.`,
        },
        { status: 400 },
      );
    }

    const safeName = file.name.replace(/[^\w.\-\s]/g, '_');
    const path = `${folder}/${safeName}`;
    const buffer = await file.arrayBuffer();

    await uploadFile(path, buffer, file.type);
    files[fmt] = true;
  }

  if (Object.keys(files).length === 0) {
    return NextResponse.json({ error: 'Загрузите хотя бы один файл таба' }, { status: 400 });
  }

  // Upload photo
  let photo_url: string | null = null;
  if (photo && photo.size > 0) {
    const ext = photo.name.split('.').pop() ?? 'jpg';
    const safeName = `cover.${ext}`;
    const path = `${folder}/${safeName}`;
    const buffer = await photo.arrayBuffer();

    await uploadFile(path, buffer, photo.type);
    photo_url = `/api/files/${tabId}/photo`;
  }

  // Update tab with files and photo_url
  const { error: updateError } = await supabaseAdmin
    .from(TABLE_TABS)
    .update({ files, photo_url })
    .eq('id', tabId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ id: tabData.id });
}
