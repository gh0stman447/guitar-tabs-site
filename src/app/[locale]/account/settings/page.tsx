import { Suspense } from 'react';
import { AccountSettingsClient } from '@/components/auth/AccountSettingsClient';

export default function AccountSettingsPage() {
  return <main className='flex min-h-screen items-center justify-center px-4 pb-16 pt-32 sm:px-6'><Suspense><AccountSettingsClient /></Suspense></main>;
}
