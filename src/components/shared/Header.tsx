'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { CircleUserRound, Guitar, Mail, Menu, ShoppingCart, X, LogOut, Settings, UserRound } from 'lucide-react';
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
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, useTransition } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsTouch } from '@/hooks/useIsTouch';
import { usePathname, useRouter } from '@/i18n/navigation';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { useUserAuth } from '@/context/UserAuthContext';

const CartDrawer = dynamic(
  () => import('./CartDrawer').then((module) => module.CartDrawer),
  { ssr: false },
);

const AuthDialog = dynamic(
  () => import('@/components/auth/AuthDialog').then((module) => module.AuthDialog),
  { ssr: false },
);

const subscribeToHydration = () => () => {};

export function Header() {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [localePending, startLocaleTransition] = useTransition();
  const navigationHideRef = useRef(false);
  const navigationScrollTimerRef = useRef<number | null>(null);
  const { isAdmin, setIsAdmin } = useAdmin();
  const { user, isLoading: isUserLoading, logout: logoutUser } = useUserAuth();

  const scheduleNavigationHideRelease = useCallback((delay: number) => {
    if (navigationScrollTimerRef.current !== null) {
      window.clearTimeout(navigationScrollTimerRef.current);
    }
    navigationScrollTimerRef.current = window.setTimeout(() => {
      navigationHideRef.current = false;
      navigationScrollTimerRef.current = null;
    }, delay);
  }, []);

  function handleLogout() {
    fetch('/api/admin/logout', { method: 'POST' }).then(() => {
      setIsAdmin(false);
      router.push('/');
    });
  }

  const isTouch = useIsTouch();
  const { count } = useCart();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('auth') !== '1') return;
    const frame = window.requestAnimationFrame(() => setAuthOpen(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function handleAuthOpenChange(open: boolean) {
    setAuthOpen(open);
    if (!open) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('auth')) {
        url.searchParams.delete('auth');
        url.searchParams.delete('telegram');
        window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
      }
    }
  }

  function openAuth() {
    setSheetOpen(false);
    setAuthOpen(true);
  }

  useLayoutEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const y = Math.max(window.scrollY, 0);
        const delta = y - lastY;
        setScrolled(y > 10);
        if (navigationHideRef.current) {
          setHidden(true);
          scheduleNavigationHideRelease(180);
        } else if (y <= 40) setHidden(false);
        else if (Math.abs(delta) >= 4) setHidden(delta > 0 && y > 80);
        lastY = y;
        frame = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      if (navigationScrollTimerRef.current !== null) {
        window.clearTimeout(navigationScrollTimerRef.current);
      }
    };
  }, [scheduleNavigationHideRelease]);

  function switchLocale() {
    if (localePending) return;
    const next = locale === 'ru' ? 'en' : 'ru';
    const search = window.location.search;
    const hash = window.location.hash;
    setHidden(false);
    setSheetOpen(false);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    startLocaleTransition(() => {
      router.replace(pathname + search + hash, { locale: next, scroll: false });
    });
  }

  const isAdminRoute = pathname.includes('/admin');

  function scrollToSection(id: string) {
    setSheetOpen(false);
    const element = document.getElementById(id);
    if (element) {
      navigationHideRef.current = true;
      setHidden(true);
      scheduleNavigationHideRelease(1200);
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(`/#${id}`);
    }
  }

  const navLinks = [
    { id: 'tabs', label: t('tabs'), icon: Guitar },
    { id: 'about', label: t('about'), icon: UserRound },
    { id: 'contacts', label: t('contacts'), icon: Mail },
  ];
  const headerButtonClass =
    'rounded-md border-0 bg-transparent text-foreground/70! shadow-none ring-0 transition-colors duration-200 hover:bg-muted/90! hover:text-foreground! dark:text-muted-foreground! dark:hover:bg-muted/80! dark:hover:text-foreground! focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0';

  return (
    <>
      <header
        data-no-particles
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 px-3 sm:px-5 lg:px-6',
          'transform-gpu will-change-transform transition-transform duration-200 ease-out sm:duration-300',
          hidden ? '-translate-y-full' : 'translate-y-0',
        )}
      >
        <div
          className={cn(
            'max-w-7xl mx-auto rounded-[1.75rem] border border-border/60 px-4 max-[420px]:px-2.5 sm:px-6 lg:px-8',
            'bg-background/65 backdrop-blur-2xl backdrop-saturate-150 transition-colors duration-300',
            scrolled && !hidden && 'bg-background/72',
          )}
        >
          <div className='flex items-center justify-between h-16 lg:h-[4.5rem]'>
            <BrandLogo locale={locale} priority />

            <nav className='hidden md:flex items-center gap-6'>
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={cn(
                    headerButtonClass,
                    'px-4 py-1.5 text-sm font-medium cursor-pointer',
                  )}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className='flex items-center gap-2 max-[420px]:gap-1'>
              {isUserLoading ? (
                <span className='hidden h-9 w-9 items-center justify-center text-muted-foreground/45 md:flex' aria-hidden='true'>
                  <CircleUserRound className='h-[1.125rem] w-[1.125rem]' />
                </span>
              ) : user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        aria-label={t('account')}
                        data-tooltip-id='account-menu'
                        data-tooltip-content={t('account')}
                        className={cn(headerButtonClass, 'hidden md:inline-flex')}
                      >
                        <CircleUserRound className='h-[1.125rem] w-[1.125rem]' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-56 rounded-xl border-border/60 bg-background/95 p-1.5 shadow-xl backdrop-blur-xl'>
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/account`} prefetch={false} className='cursor-pointer rounded-lg px-3 py-2.5 focus:bg-muted/80 focus:text-foreground!'>
                          <CircleUserRound className='mr-2 h-4 w-4' />
                          {t('account')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/account/settings`} prefetch={false} className='cursor-pointer rounded-lg px-3 py-2.5 focus:bg-muted/80 focus:text-foreground!'>
                          <Settings className='mr-2 h-4 w-4' />{t('settings')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='cursor-pointer rounded-lg px-3 py-2.5 text-red-500 focus:bg-red-500/10 focus:text-red-500'
                        onClick={() => void logoutUser()}
                      >
                        <LogOut className='mr-2 h-4 w-4' />
                        {t('logout')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button type='button' variant='ghost' onClick={openAuth} className={cn(headerButtonClass, 'hidden gap-2 px-3 md:inline-flex')}>
                  <UserRound className='h-4 w-4' /><span className='hidden lg:inline'>{t('login')}</span>
                </Button>
              )}
              {user && !isUserLoading && !isTouch && (
                <ReactTooltip
                  id='account-menu'
                  place='bottom'
                  opacity={1}
                  delayShow={350}
                  style={{ fontSize: 13 }}
                />
              )}
              {isAdmin && (
                <DropdownMenu open={adminMenuOpen} onOpenChange={setAdminMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <div
                      className={cn(
                        headerButtonClass,
                        'hidden md:flex items-center gap-1 px-3 py-1.5 text-xs font-medium cursor-pointer',
                      )}
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => setAdminMenuOpen(true)}
                    >
                      <Settings className='h-3.5 w-3.5' />
                      Админ
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/admin/published`} prefetch={false} className='cursor-pointer'>
                        Опубликованные
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/admin/drafts`} prefetch={false} className='cursor-pointer'>
                        Черновики
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/admin/create-tab`} prefetch={false} className='cursor-pointer'>
                        Добавить таб
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/admin/newsletter`} prefetch={false} className='cursor-pointer'>
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
              {(isTouch || !hydrated) && (
                <button
                  onClick={() => count > 0 && setCartOpen(true)}
                  disabled={!hydrated || count === 0}
                  aria-busy={!hydrated}
                  aria-label={locale === 'en' ? 'Cart' : 'Корзина'}
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center md:hidden',
                    hydrated && count > 0
                      ? cn(headerButtonClass, 'cursor-pointer')
                      : 'cursor-wait rounded-md border-0 bg-transparent text-muted-foreground/45 ring-0 disabled:cursor-wait',
                  )}
                >
                  <ShoppingCart className='h-4 w-4' />
                  {count > 0 && (
                    <span className='absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-md bg-foreground px-1 text-[10px] font-bold leading-none text-background shadow-sm'>
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
                    disabled={!hydrated || localePending}
                    aria-busy={!hydrated || localePending}
                    aria-label='Переключить язык'
                    className={cn(headerButtonClass, 'text-xs font-semibold')}
                  >
                    {locale === 'ru' ? 'EN' : 'RU'}
                  </Button>
                  <ReactTooltip
                    id='locale-toggle'
                    place='bottom'
                    opacity={1}
                    delayShow={350}
                    style={{ fontSize: 13 }}
                  />
                </>
              )}
              {!isAdminRoute && isTouch && (
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={switchLocale}
                  disabled={!hydrated || localePending}
                  aria-busy={!hydrated || localePending}
                  aria-label='Переключить язык'
                  className={cn(headerButtonClass, 'text-xs font-semibold')}
                >
                  {locale === 'ru' ? 'EN' : 'RU'}
                </Button>
              )}
              <ThemeToggle className={headerButtonClass} />
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <button
                    suppressHydrationWarning
                    disabled={!hydrated}
                    aria-busy={!hydrated}
                    className={cn(
                      headerButtonClass,
                      'md:hidden flex items-center justify-center w-9 h-9 cursor-pointer disabled:cursor-wait disabled:opacity-50',
                    )}
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
                  <SheetTitle className='sr-only'>{t('menu')}</SheetTitle>
                  <button
                    onClick={() => setSheetOpen(false)}
                    className='absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors cursor-pointer'
                  >
                    <X className='h-4 w-4' />
                  </button>
                  <div className='mx-auto flex max-w-md flex-col gap-4'>
                    <nav>
                      <p className='mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60'>
                        {t('navigation')}
                      </p>
                      <div className='flex flex-col gap-1'>
                        {navLinks.map((link) => (
                          <button
                            key={link.id}
                            onClick={() => scrollToSection(link.id)}
                            className='group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground/80 transition-colors hover:bg-muted/75 hover:text-foreground'
                          >
                            <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15'>
                              <link.icon className='h-4 w-4' />
                            </span>
                            {link.label}
                          </button>
                        ))}
                      </div>
                    </nav>

                    <div className='h-px bg-border/70' aria-hidden='true' />

                    <div>
                      <p className='mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60'>
                        {t('userMenu')}
                      </p>
                      <div className='flex flex-col gap-1'>
                      {isUserLoading ? (
                        <span className='flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground/55'>
                          <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-muted'>
                            <UserRound className='h-4 w-4' />
                          </span>
                          {t('login')}
                        </span>
                      ) : (
                        user ? (
                          <Link
                            href={`/${locale}/account`}
                            onClick={() => setSheetOpen(false)}
                            className='flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted/75 hover:text-foreground'
                          >
                            <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                              <UserRound className='h-4 w-4' />
                            </span>
                            {t('account')}
                          </Link>
                        ) : (
                          <button
                            type='button'
                            onClick={openAuth}
                            className='flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground/80 transition-colors hover:bg-muted/75 hover:text-foreground'
                          >
                            <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                              <UserRound className='h-4 w-4' />
                            </span>
                            {t('login')}
                          </button>
                        )
                      )}
                      {user && (
                        <Link
                          href={`/${locale}/account/settings`}
                          onClick={() => setSheetOpen(false)}
                          className='flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted/75 hover:text-foreground'
                        >
                          <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
                            <Settings className='h-4 w-4' />
                          </span>
                          {t('settings')}
                        </Link>
                      )}
                      {user && (
                        <button
                          onClick={() => { void logoutUser(); setSheetOpen(false); }}
                          className='flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10'
                        >
                          <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10'>
                            <LogOut className='h-4 w-4' />
                          </span>
                          {t('logout')}
                        </button>
                      )}
                      </div>
                    </div>

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
                            className='text-base font-medium px-2 py-2.5 rounded-lg text-primary hover:bg-primary/10 transition-colors'
                          >
                            Опубликованные
                          </Link>
                          <Link
                            href={`/${locale}/admin/drafts`}
                            onClick={() => setSheetOpen(false)}
                            className='text-base font-medium px-2 py-2.5 rounded-lg text-primary hover:bg-primary/10 transition-colors'
                          >
                            Черновики
                          </Link>
                          <Link
                            href={`/${locale}/admin/create-tab`}
                            onClick={() => setSheetOpen(false)}
                            className='text-base font-medium px-2 py-2.5 rounded-lg text-primary hover:bg-primary/10 transition-colors'
                          >
                            Добавить таб
                          </Link>
                          <Link
                            href={`/${locale}/admin/newsletter`}
                            onClick={() => setSheetOpen(false)}
                            className='text-base font-medium px-2 py-2.5 rounded-lg text-primary hover:bg-primary/10 transition-colors'
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
      {cartOpen && <CartDrawer open onOpenChange={setCartOpen} locale={locale} />}
      {authOpen && <AuthDialog open onOpenChange={handleAuthOpenChange} />}
    </>
  );
}
