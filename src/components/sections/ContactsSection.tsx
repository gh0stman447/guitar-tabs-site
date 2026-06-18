'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Mail } from 'lucide-react';
import { FaVk } from 'react-icons/fa';

const contacts = [
  {
    icon: () => <Send className='h-6 w-6 translate-y-px' />,
    label: 'Telegram',
    value: '@MalyginOleg',
    href: 'https://t.me/MalyginOleg',
    color: 'text-blue-500',
    border: 'border-blue-500/30',
    shadow: 'shadow-blue-500/20',
  },
  {
    icon: () => <FaVk className='h-6 w-6' />,
    label: 'VK',
    value: 'malyginoleg',
    href: 'https://vk.com/malyginoleg',
    color: 'text-indigo-500',
    border: 'border-indigo-500/30',
    shadow: 'shadow-indigo-500/20',
  },
  {
    icon: () => <Mail className='h-6 w-6' />,
    label: 'Email',
    value: 'o_malygin@bk.ru',
    href: 'mailto:o_malygin@bk.ru',
    color: 'text-amber-500',
    border: 'border-amber-500/30',
    shadow: 'shadow-amber-500/20',
  },
];

function ContactCard({
  href,
  Icon,
  label,
  value,
  color,
  border,
}: {
  href: string;
  Icon: () => React.ReactNode;
  label: string;
  value: string;
  color: string;
  border: string;
}) {
  return (
    <div
      className='block cursor-pointer'
      onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
    >
      <Card className={`h-full transition-all ${border}`}>
        <CardContent className='flex flex-col items-center justify-center text-center p-6 h-full'>
          <div
            className={`w-12 h-12 rounded-full border-2 ${border} flex items-center justify-center ${color}`}
          >
            <Icon />
          </div>
          <h3 className='mt-4 text-sm font-medium text-muted-foreground'>{label}</h3>
          <p className='mt-1 text-sm font-semibold text-foreground'>{value}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ContactsSection() {
  const t = useTranslations('contacts');

  return (
    <section id='contacts' className='py-12 sm:py-24 overflow-hidden'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-12'>
          <span className='text-amber-500 text-sm font-medium tracking-widest uppercase'>
            {t('badge')}
          </span>
          <h2 className='text-3xl sm:text-4xl font-bold mt-2'>{t('title')}</h2>
          <p className='text-muted-foreground mt-3'>{t('description')}</p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto'>
          {contacts.map(({ icon: Icon, label, value, href, color, border }) => (
            <ContactCard
              key={label}
              href={href}
              Icon={Icon}
              label={label}
              value={value}
              color={color}
              border={border}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
