'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, ShoppingCart, X, LogOut, Settings } from 'lucide-react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTranslations, useLocale } from 'next-intl';
import { ThemeToggle } from './ThemeToggle';
import { CartDrawer } from './CartDrawer';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsTouch } from '@/hooks/useIsTouch';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const { isAdmin, setIsAdmin } = useAdmin();

  function handleLogout() {
    fetch('/api/admin/logout', { method: 'POST' }).then(() => {
      setIsAdmin(false);
      router.push(`/${locale}`);
    });
  }

  const isTouch = useIsTouch();
  const { count } = useCart();

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
    const search = window.location.search;
    router.push((segments.join('/') || '/') + search);
  }

  const isAdminRoute = pathname.includes('/admin');

  function scrollToSection(id: string) {
    setSheetOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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
        data-no-particles
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
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
                <DropdownMenu open={adminMenuOpen} onOpenChange={setAdminMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <div
                      className='hidden md:flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors cursor-pointer'
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => setAdminMenuOpen(true)}
                    >
                      <Settings className='h-3.5 w-3.5' />
                      Админ
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/admin/published`} className='cursor-pointer'>
                        Опубликованные
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/admin/drafts`} className='cursor-pointer'>
                        Черновики
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/admin/create-tab`} className='cursor-pointer'>
                        Добавить таб
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/admin/newsletter`} className='cursor-pointer'>
                        Рассылка
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className='text-red-500 cursor-pointer'
                    >
                      <LogOut className='h-3.5 w-3.5 mr-2' />
                      Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {isTouch && (
                <button
                  onClick={() => count > 0 && setCartOpen(true)}
                  className={`relative flex items-center justify-center w-9 h-9 rounded border transition-colors ${count > 0 ? 'border-border text-muted-foreground hover:text-foreground hover:border-amber-500 cursor-pointer' : 'border-border text-muted-foreground/30 cursor-not-allowed'}`}
                >
                  <ShoppingCart className='h-4 w-4' />
                  {count > 0 && (
                    <span className='absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none'>
                      {count}
                    </span>
                  )}
                </button>
              )}
              {!isAdminRoute && !isTouch && (
                <>
                  <Button
                    data-tooltip-id='locale-toggle'
                    data-tooltip-content={locale === 'ru' ? 'English' : 'Русский'}
                    variant='ghost'
                    size='icon'
                    onClick={switchLocale}
                    aria-label='Переключить язык'
                    className='text-xs font-semibold text-muted-foreground'
                  >
                    {locale === 'ru' ? 'EN' : 'RU'}
                  </Button>
                  <ReactTooltip id='locale-toggle' place='bottom' opacity={1} delayShow={350} />
                </>
              )}
              {!isAdminRoute && isTouch && (
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={switchLocale}
                  aria-label='Переключить язык'
                  className='text-xs font-semibold text-muted-foreground'
                >
                  {locale === 'ru' ? 'EN' : 'RU'}
                </Button>
              )}
              <ThemeToggle />
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <button
                    suppressHydrationWarning
                    className='md:hidden flex items-center justify-center w-9 h-9 rounded border border-border text-muted-foreground hover:text-foreground hover:border-amber-500 transition-colors cursor-pointer'
                  >
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
                            href={`/${locale}/admin/create-tab`}
                            onClick={() => setSheetOpen(false)}
                            className='text-base font-medium px-2 py-2.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors'
                          >
                            Добавить таб
                          </Link>
                          <Link
                            href={`/${locale}/admin/newsletter`}
                            onClick={() => setSheetOpen(false)}
                            className='text-base font-medium px-2 py-2.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors'
                          >
                            Рассылка
                          </Link>
                          <button
                            onClick={() => {
                              handleLogout();
                              setSheetOpen(false);
                            }}
                            className='w-full text-left text-base font-medium px-2 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2'
                          >
                            <LogOut className='h-4 w-4' />
                            Выйти
                          </button>
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
