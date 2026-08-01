import { Suspense } from 'react';
import { AccountPageClient } from '@/components/auth/AccountPageClient';

export default function AccountPage() {
  return <main className='flex min-h-screen items-center justify-center px-4 pb-16 pt-32 sm:px-6'><Suspense><AccountPageClient /></Suspense></main>;
}
