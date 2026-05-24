'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { inputCls } from '@/components/admin/AdminFormFields';
import { useAdmin } from '@/context/AdminContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const { setIsAdmin } = useAdmin();
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginBlocked, setLoginBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  async function tryAuth() {
    setLoading(true);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setIsAdmin(true);
      router.push(`/${locale}/`);
    } else {
      const data = await res.json();
      const msg = data.error ?? 'Неверный пароль';
      setAuthError(msg);
      if (res.status === 429) setLoginBlocked(true);
    }
    setLoading(false);
  }

  return (
    <div className='min-h-screen bg-secondary/20'>
      <Header />
      <div className='min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 pt-24'>
        <div className='w-full max-w-sm bg-background rounded-2xl border border-border shadow-lg p-8 flex flex-col gap-6'>
          <div className='flex flex-col items-center gap-2'>
            <div className='w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center'>
              <Lock className='h-6 w-6 text-amber-500' />
            </div>
            <h1 className='text-xl font-bold'>Админ-панель</h1>
            <p className='text-sm text-muted-foreground'>Введите пароль для входа</p>
          </div>
          <div className='flex flex-col gap-3'>
            <input
              type='password'
              placeholder='Пароль'
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setAuthError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && !loginBlocked && tryAuth()}
              className={`${inputCls} ${authError !== null ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {authError && <p className='text-sm text-red-500'>{authError}</p>}
            <button
              onClick={tryAuth}
              disabled={loginBlocked || loading}
              className='w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2'
            >
              {loading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Вход...
                </>
              ) : loginBlocked ? (
                'Заблокировано на 15 минут'
              ) : (
                'Войти'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
