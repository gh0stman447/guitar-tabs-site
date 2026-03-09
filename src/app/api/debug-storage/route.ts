import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  const { data: files, error } = await supabaseAdmin.storage
    .from('tab-files')
    .list('me-you-too');

  return NextResponse.json({ files, error });
}
