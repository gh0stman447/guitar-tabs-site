'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Music, Menu } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header({ isAdminPanelHeader = false }: { isAdminPanelHeader?: boolean }) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setIsAdmin(document.cookie.includes('admin_session='));
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      setHidden(y > lastY && y > 80);
      lastY = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function switchLocale() {
    const next = locale === 'ru' ? 'en' : 'ru';
    const segments = pathname.split('/');
    segments[1] = next;
    router.push(segments.join('/') || '/');
  }

  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;

  function scrollToSection(id: string) {
    setSheetOpen(false);
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(`/${locale}#${id}`);
    }
  }

  const navLinks = [
    { id: 'tabs', label: t('tabs') },
    { id: 'about', label: t('about') },
    { id: 'contacts', label: t('contacts') },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isAdminPanelHeader || scrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-transparent',
        hidden ? '-translate-y-full' : 'translate-y-0',
      )}
    >
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          <Link href='/' className='flex items-center gap-2 font-semibold text-lg'>
            <Music className='h-5 w-5 text-amber-500' />
            <span>OlegGuitar</span>
          </Link>

          {!isAdminPanelHeader && (
            <nav className='hidden md:flex items-center gap-6'>
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className='text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
                >
                  {link.label}
                </button>
              ))}
            </nav>
          )}

          <div className='flex items-center gap-2'>
            {isAdmin && !isAdminPanelHeader && (
              <Link
                href='/admin'
                className='text-xs font-medium px-2 py-1 rounded border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors'
              >
                + Таб
              </Link>
            )}
            {!isAdminPanelHeader && (
              <button
                onClick={switchLocale}
                className='text-xs font-medium px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-amber-500 transition-colors cursor-pointer'
              >
                {locale === 'ru' ? 'EN' : 'RU'}
              </button>
            )}
            <ThemeToggle />
            {!isAdminPanelHeader && (
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <button className='md:hidden flex items-center justify-center w-9 h-9 rounded border border-border text-muted-foreground hover:text-foreground hover:border-amber-500 transition-colors cursor-pointer'>
                    <Menu className='h-4 w-4' />
                  </button>
                </SheetTrigger>
                <SheetContent side='top' showCloseButton={false} className='h-auto px-4 pb-4 pt-20'>
                  <nav className='max-w-6xl mx-auto flex flex-col'>
                    {navLinks.map((link, i) => (
                      <div key={link.id}>
                        {i > 0 && <div className='h-px bg-border mx-3' />}
                        <button
                          onClick={() => scrollToSection(link.id)}
                          className='w-full text-left text-sm px-3 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors block cursor-pointer'
                        >
                          {link.label}
                        </button>
                      </div>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
