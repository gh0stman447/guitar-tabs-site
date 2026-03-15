'use client';

import { motion } from 'framer-motion';
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
    bg: 'bg-blue-50 dark:bg-blue-950/20',
  },
  {
    icon: () => <FaVk className='h-6 w-6' />,
    label: 'VK',
    value: 'dnbspiritual',
    href: 'https://vk.com/dnbspiritual',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
  },
  {
    icon: () => <Mail className='h-6 w-6' />,
    label: 'Email',
    value: 'o_malygin@bk.ru',
    href: 'mailto:o_malygin@bk.ru',
    color: 'text-amber-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
  },
];

export function ContactsSection() {
  const t = useTranslations('contacts');

  return (
    <section id='contacts' className='py-24'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className='text-center mb-12'
        >
          <span className='text-amber-500 text-sm font-medium tracking-widest uppercase'>
            {t('badge')}
          </span>
          <h2 className='text-3xl sm:text-4xl font-bold mt-2'>{t('title')}</h2>
          <p className='text-muted-foreground mt-3'>{t('description')}</p>
        </motion.div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto'>
          {contacts.map(({ icon: Icon, label, value, href, color, bg }, i) => (
            <motion.a
              key={label}
              href={href}
              target='_blank'
              rel='noopener noreferrer'
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className='border-border hover:border-amber-300 dark:hover:border-amber-700 transition-colors cursor-pointer h-full'>
                <CardContent className='p-6 flex flex-col items-center text-center gap-3'>
                  <div
                    className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center ${color}`}
                  >
                    <Icon />
                  </div>
                  <div>
                    <div className='font-semibold text-sm'>{label}</div>
                    <div className='text-xs text-muted-foreground mt-1'>{value}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
