import { Suspense } from 'react';
import { ResetPasswordCard } from '@/components/auth/TokenActionCard';

export default function ResetPasswordPage() {
  return <main className='flex min-h-screen items-center justify-center px-4 pt-24'><Suspense><ResetPasswordCard /></Suspense></main>;
}
