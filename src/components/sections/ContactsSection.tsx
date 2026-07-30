'use client';

import { motion, useAnimation } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useIsTouch } from '@/hooks/useIsTouch';
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
    color: 'text-primary',
    border: 'border-primary/30',
    shadow: 'shadow-primary/20',
  },
];

function ContactCard({
  href,
  Icon,
  label,
  value,
  color,
  border,
  shadow,
  isTouch,
}: {
  href: string;
  Icon: () => React.ReactNode;
  label: string;
  value: string;
  color: string;
  border: string;
  shadow: string;
  isTouch: boolean;
}) {
  const controls = useAnimation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={!isTouch ? { scale: 1.08, rotateY: 10, rotateX: -5 } : undefined}
      onHoverStart={!isTouch ? () => controls.start({ rotate: 360, scale: 1.15 }) : undefined}
      onHoverEnd={!isTouch ? () => controls.start({ rotate: 0, scale: 1 }) : undefined}
      transition={{ duration: 0.4 }}
      className='block cursor-pointer'
      onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
    >
      <Card
        className={`h-full transition-all ${border} ${shadow} ${!isTouch ? 'hover:shadow-lg' : ''}`}
      >
        <CardContent className='flex flex-col items-center justify-center text-center p-6 h-full'>
          <motion.div
            className={`w-12 h-12 rounded-full border-2 ${border} flex items-center justify-center ${color}`}
            animate={controls}
            transition={{ duration: 0.5 }}
          >
            <Icon />
          </motion.div>
          <h3 className='mt-4 text-sm font-medium text-muted-foreground'>{label}</h3>
          <p className='mt-1 text-sm font-semibold text-foreground'>{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ContactsSection() {
  const t = useTranslations('contacts');
  const isTouch = useIsTouch();
  const duration = isTouch ? 0.5 / 1.5 : 0.5;

  return (
    <section id='contacts' className='py-12 sm:py-24 overflow-hidden'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration }}
          className='text-center mb-12'
        >
          <span className='text-primary text-sm font-medium tracking-widest uppercase'>
            {t('badge')}
          </span>
          <h2 className='text-3xl sm:text-4xl font-bold mt-2'>{t('title')}</h2>
          <p className='text-muted-foreground mt-3'>{t('description')}</p>
        </motion.div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto'>
          {contacts.map(({ icon: Icon, label, value, href, color, border, shadow }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration, delay: i * 0.1 }}
            >
              <ContactCard
                href={href}
                Icon={Icon}
                label={label}
                value={value}
                color={color}
                border={border}
                shadow={shadow}
                isTouch={isTouch}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
