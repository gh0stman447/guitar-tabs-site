'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, ShoppingCart, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { ThemeToggle } from './ThemeToggle';
import { CartDrawer } from './CartDrawer';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsTouch(window.matchMedia('(hover: none)').matches);
  }, []);
  const { count } = useCart();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-background/80 backdrop-blur-md border-b border-border shadow-sm'
            : 'bg-transparent',
          hidden ? '-translate-y-full' : 'translate-y-0',
        )}
      >
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <Link href='/' className='flex items-center gap-1.5 select-none'>
              <div className='flex flex-col leading-none gap-0.5 relative'>
                <div className='absolute inset-0 flex flex-col justify-around pointer-events-none'>
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className='w-full bg-amber-500 dark:bg-amber-400'
                      style={{ height: '1px', opacity: 0.75 - i * 0.08 }}
                    />
                  ))}
                </div>
                <span className='text-[12px] md:text-[12px] italic font-black tracking-[0.2em] uppercase text-foreground relative z-10'>
                  Oleg
                </span>
                <span className='text-[23px] md:text-[28px] font-black tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent relative z-10'>
                  Guitar
                  <span className='absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400/80 via-orange-400/60 to-transparent rounded-full' />
                </span>
              </div>
            </Link>

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

            <div className='flex items-center gap-2'>
              {isAdmin && (
                <div className='hidden md:flex items-center gap-2'>
                  <Link
                    href={`/${locale}/admin/published`}
                    className='text-xs font-medium px-2 py-1 rounded border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors'
                  >
                    Опубликованные
                  </Link>
                  <Link
                    href={`/${locale}/admin/drafts`}
                    className='text-xs font-medium px-2 py-1 rounded border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors'
                  >
                    Черновики
                  </Link>
                  <Link
                    href={`/${locale}/admin`}
                    className='text-xs font-medium px-2 py-1 rounded border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors'
                  >
                    Добавить таб
                  </Link>
                </div>
              )}
              <button
                onClick={switchLocale}
                className='text-xs font-medium px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-amber-500 transition-colors cursor-pointer'
              >
                {locale === 'ru' ? 'EN' : 'RU'}
              </button>
              {isTouch && (
                <button
                  onClick={() => setCartOpen(true)}
                  className='relative flex items-center justify-center w-9 h-9 rounded border border-border text-muted-foreground hover:text-foreground hover:border-amber-500 transition-colors cursor-pointer'
                >
                  <ShoppingCart className='h-4 w-4' />
                  {count > 0 && (
                    <span className='absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none'>
                      {count}
                    </span>
                  )}
                </button>
              )}
              <ThemeToggle />
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <button className='md:hidden flex items-center justify-center w-9 h-9 rounded border border-border text-muted-foreground hover:text-foreground hover:border-amber-500 transition-colors cursor-pointer'>
                    <Menu className='h-4 w-4' />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side='top'
                  showCloseButton={false}
                  aria-describedby={undefined}
                  className='h-auto max-h-screen overflow-y-auto px-6 pb-8 pt-20'
                >
                  <SheetTitle className='sr-only'>Меню</SheetTitle>
                  <button
                    onClick={() => setSheetOpen(false)}
                    className='absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded border border-border text-muted-foreground hover:text-foreground hover:border-amber-500 transition-colors cursor-pointer'
                  >
                    <X className='h-4 w-4' />
                  </button>
                  <div className='max-w-6xl mx-auto flex flex-col gap-6'>
                    <nav className='flex flex-col gap-1'>
                      <p className='text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest px-2 mb-1'>
                        Навигация
                      </p>
                      {navLinks.map((link) => (
                        <button
                          key={link.id}
                          onClick={() => scrollToSection(link.id)}
                          className='w-full text-left text-base font-medium px-2 py-2.5 rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted transition-colors cursor-pointer'
                        >
                          {link.label}
                        </button>
                      ))}
                    </nav>

                    {isAdmin && (
                      <>
                        <div className='h-px bg-border' />
                        <div className='flex flex-col gap-1'>
                          <p className='text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest px-2 mb-1'>
                            Админ
                          </p>
                          <Link
                            href={`/${locale}/admin/published`}
                            onClick={() => setSheetOpen(false)}
                            className='text-base font-medium px-2 py-2.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors'
                          >
                            Опубликованные
                          </Link>
                          <Link
                            href={`/${locale}/admin/drafts`}
                            onClick={() => setSheetOpen(false)}
                            className='text-base font-medium px-2 py-2.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors'
                          >
                            Черновики
                          </Link>
                          <Link
                            href={`/${locale}/admin`}
                            onClick={() => setSheetOpen(false)}
                            className='text-base font-medium px-2 py-2.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors'
                          >
                            + Добавить таб
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} locale={locale} />
    </>
  );
}
