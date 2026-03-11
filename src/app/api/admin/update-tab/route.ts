import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdminSession } from '@/lib/admin-auth';
import { FORMATS } from '@/types';

export async function POST(req: NextRequest) {
  const authError = requireAdminSession(req);
  if (authError) return authError;

  const formData = await req.formData();

  const id = formData.get('id') as string;
  const title_ru = formData.get('title_ru') as string;
  const title_en = formData.get('title_en') as string;
  const description_ru = (formData.get('description_ru') as string) ?? '';
  const description_en = (formData.get('description_en') as string) ?? '';
  const difficulty = formData.get('difficulty') as string;
  const price = parseFloat(formData.get('price') as string);
  const youtube_url = (formData.get('youtube_url') as string) || null;
  const photo = formData.get('photo') as File | null;
  const existingFiles = JSON.parse((formData.get('existing_files') as string) ?? '{}');

  if (!id || !title_ru || !title_en || !difficulty || !price) {
    return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 });
  }

  const folder = id;
  const files: Record<string, string> = { ...existingFiles };

  // Upload new tab files
  for (const fmt of FORMATS) {
    const file = formData.get(fmt) as File | null;
    if (!file || file.size === 0) continue;

    if (/[а-яёА-ЯЁ]/.test(file.name)) {
      return NextResponse.json(
        { error: `Файл "${file.name}" содержит кириллицу. Переименуйте латиницей.` },
        { status: 400 },
      );
    }

    const safeName = file.name.replace(/[^\w.\-\s]/g, '_');
    const path = `${folder}/${safeName}`;
    const buffer = await file.arrayBuffer();

    const { error } = await supabaseAdmin.storage
      .from('tab-files')
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (error) {
      return NextResponse.json(
        { error: `Ошибка загрузки ${fmt}: ${error.message}` },
        { status: 500 },
      );
    }

    files[fmt] = path;
  }

  if (Object.keys(files).length === 0) {
    return NextResponse.json({ error: 'Нужен хотя бы один файл таба' }, { status: 400 });
  }

  // Upload new photo if provided
  let photo_url: string | undefined = undefined;
  if (photo && photo.size > 0) {
    const ext = photo.name.split('.').pop() ?? 'jpg';
    const path = `${folder}/cover.${ext}`;
    const buffer = await photo.arrayBuffer();

    const { error } = await supabaseAdmin.storage
      .from('tab-files')
      .upload(path, buffer, { contentType: photo.type, upsert: true });

    if (!error) {
      const { data } = supabaseAdmin.storage.from('tab-files').getPublicUrl(path);
      photo_url = data.publicUrl;
    }
  }

  const updateData: Record<string, unknown> = {
    title_ru,
    title_en,
    description_ru,
    description_en,
    difficulty,
    price,
    youtube_url,
    files,
  };
  if (photo_url !== undefined) updateData.photo_url = photo_url;

  const { error } = await supabaseAdmin
    .from('guitar-tabs')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
