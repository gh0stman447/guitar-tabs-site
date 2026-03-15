import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TABLE_CUSTOMERS } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');

  if (!email) {
    return new NextResponse('Неверная ссылка', { status: 400 });
  }

  await supabase.from(TABLE_CUSTOMERS).update({ newsletter: false }).eq('email', email);

  return NextResponse.redirect(new URL('/ru/unsubscribe', req.url));
}
