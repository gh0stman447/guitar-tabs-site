'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Guitar } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function switchLocale() {
    const next = locale === 'ru' ? 'en' : 'ru';
    const segments = pathname.split('/');
    segments[1] = next;
    router.push(segments.join('/') || '/');
  }

  const navLinks = [
    { href: '#tabs', label: t('tabs') },
    { href: '#about', label: t('about') },
    { href: '#contacts', label: t('contacts') },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-transparent',
      )}
    >
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          <Link href='/' className='flex items-center gap-2 font-semibold text-lg'>
            <Guitar className='h-5 w-5 text-amber-500' />
            <span>OlegGuitar</span>
          </Link>

          <nav className='hidden md:flex items-center gap-6'>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className='text-sm text-muted-foreground hover:text-foreground transition-colors'
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className='flex items-center gap-2'>
            <button
              onClick={switchLocale}
              className='text-xs font-medium px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-amber-500 transition-colors cursor-pointer'
            >
              {locale === 'ru' ? 'EN' : 'RU'}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
