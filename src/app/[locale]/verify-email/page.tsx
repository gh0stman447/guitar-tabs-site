import { Suspense } from 'react';
import { VerifyEmailCard } from '@/components/auth/TokenActionCard';

export default function VerifyEmailPage() {
  return <main className='flex min-h-screen items-center justify-center px-4 pt-24'><Suspense><VerifyEmailCard /></Suspense></main>;
}
