import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const FORMATS = ['pdf', 'gp5', 'gpx', 'mp3'] as const;

export async function POST(req: NextRequest) {
  const session = req.cookies.get('admin_session')?.value;
  if (session !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();

  const title_ru = formData.get('title_ru') as string;
  const title_en = formData.get('title_en') as string;
  const description_ru = formData.get('description_ru') as string ?? '';
  const description_en = formData.get('description_en') as string ?? '';
  const difficulty = formData.get('difficulty') as string;
  const price = parseFloat(formData.get('price') as string);
  const youtube_url = formData.get('youtube_url') as string ?? null;
  const photo = formData.get('photo') as File | null;

  if (!title_ru || !title_en || !difficulty || !price) {
    return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 });
  }

  const tabId = randomUUID();
  const folder = tabId;

  // Upload tab files
  const files: Record<string, string> = {};
  for (const fmt of FORMATS) {
    const file = formData.get(fmt) as File | null;
    if (!file || file.size === 0) continue;

    const ext = file.name.split('.').pop() ?? fmt;
    const path = `${folder}/tab.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error } = await supabaseAdmin.storage
      .from('tab-files')
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (error) {
      return NextResponse.json({ error: `Ошибка загрузки ${fmt}: ${error.message}` }, { status: 500 });
    }

    files[fmt] = path;
  }

  if (Object.keys(files).length === 0) {
    return NextResponse.json({ error: 'Загрузите хотя бы один файл таба' }, { status: 400 });
  }

  // Upload photo
  let photo_url: string | null = null;
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

  // Create tab in DB
  const { data, error } = await supabaseAdmin
    .from('guitar-tabs')
    .insert({
      id: tabId,
      title_ru,
      title_en,
      description_ru,
      description_en,
      difficulty,
      price,
      youtube_url: youtube_url || null,
      photo_url,
      files,
      purchase_count: 0,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
