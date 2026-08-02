import { redirect } from 'next/navigation';

export default async function AuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ telegram?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const target = new URLSearchParams({ auth: '1' });
  if (query.telegram) target.set('telegram', query.telegram);
  redirect(`${locale === 'en' ? '/en' : '/'}?${target.toString()}`);
}
