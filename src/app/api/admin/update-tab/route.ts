import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdminSession } from '@/lib/admin-auth';
import { FORMATS } from '@/types';
import { TABLE_TABS } from '@/lib/constants';
import { deleteFile, uploadFile } from '@/lib/storage';
import { query } from '@/lib/db';

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
  const existingFiles: Record<string, boolean> = JSON.parse((formData.get('existing_files') as string) ?? '{}');
  const formatsToDelete: string[] = JSON.parse((formData.get('formats_to_delete') as string) ?? '[]');
  const deletePhoto = formData.get('delete_photo') === 'true';

  if (!id || !title_ru || !title_en || !difficulty || !price) {
    return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 });
  }

  const folder = id;
  const files: Record<string, boolean> = { ...existingFiles };

  // Delete removed formats from storage and tab_files
  for (const fmt of formatsToDelete) {
    const filePath = `${folder}/${fmt}`;
    await deleteFile(filePath);
    delete files[fmt];
  }

  // Upload new files
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

    await uploadFile(path, buffer, file.type);
    files[fmt] = true;
  }

  if (Object.keys(files).length === 0) {
    return NextResponse.json({ error: 'Нужен хотя бы один файл таба' }, { status: 400 });
  }

  // Handle photo deletion
  if (deletePhoto) {
    // Delete the photo file from storage (format: 'photo')
    await query('DELETE FROM tab_files WHERE tab_id = $1 AND format = $2', [id, 'photo']);
  }

  // Upload new photo if provided
  let photo_url: string | null | undefined = undefined;
  if (photo && photo.size > 0) {
    const ext = photo.name.split('.').pop() ?? 'jpg';
    const safeName = `cover.${ext}`;
    const path = `${folder}/${safeName}`;
    const buffer = await photo.arrayBuffer();

    await uploadFile(path, buffer, photo.type);
    photo_url = `/api/files/${id}/photo?t=${Date.now()}`;
  } else if (deletePhoto) {
    photo_url = null;
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

  const { error } = await supabaseAdmin.from(TABLE_TABS).update(updateData).eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
