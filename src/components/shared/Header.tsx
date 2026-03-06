'use client';

import Link from 'next/link';
import { Guitar } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const navLinks = [
  { href: '#tabs', label: 'Табы' },
  { href: '#about', label: 'Обо мне' },
  { href: '#contacts', label: 'Контакты' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
