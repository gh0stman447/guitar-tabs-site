'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Mail } from 'lucide-react';

const contacts = [
  {
    icon: Send,
    label: "Telegram",
    value: "@MalyginOleg",
    href: "https://t.me/MalyginOleg",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.701 18.771H12.57c.282 0 .437-.162.437-.162s.159-.186.151-.697c-.012-.959.43-1.1.43-1.1s.421-.043 1.001.93c.679 1.09 1.492 2.286 1.492 2.286s.427.651 1.13.651h2.8c.826 0 .991-.454.991-.454s.175-.488-.697-1.567c-1.862-2.267-1.975-2.1.664-5.712.978-1.307 1.37-2.091 1.248-2.406-.118-.304-.832-.225-.832-.225l-3.149.02s-.232-.033-.405.075c-.17.107-.28.357-.28.357s-.37 1.028-.863 1.903c-1.042 1.827-1.459 1.925-1.63 1.814-.397-.264-.298-1.058-.298-1.624 0-1.764.262-2.499-.513-2.687-.258-.063-.447-.105-1.105-.111-.846-.009-1.562.002-1.966.206-.27.132-.477.426-.35.443.156.02.512.098.701.359.243.334.234 1.082.234 1.082s.14 2.075-.327 2.332c-.32.177-.758-.184-1.7-1.838C8.57 10.829 8.2 10 8.2 10s-.07-.175-.196-.268c-.151-.113-.364-.149-.364-.149H4.5s-.342.01-.467.16c-.113.135-.009.413-.009.413S6.262 15 8.274 17.1c1.845 1.927 3.942 1.8 3.942 1.8z"/>
      </svg>
    ),
    label: "VK",
    value: "dnbspiritual",
    href: "https://vk.com/dnbspiritual",
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
  },
  {
    icon: Mail,
    label: "Email",
    value: "o_malygin@bk.ru",
    href: "mailto:o_malygin@bk.ru",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/20",
  },
]

export function ContactsSection() {
  const t = useTranslations('contacts');

  return (
    <section id="contacts" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-amber-500 text-sm font-medium tracking-widest uppercase">
            {t('badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2">{t('title')}</h2>
          <p className="text-muted-foreground mt-3">{t('description')}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          {contacts.map(({ icon: Icon, label, value, href, color, bg }, i) => (
            <motion.a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="border-border hover:border-amber-300 dark:hover:border-amber-700 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center ${color}`}>
                    <Icon />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{value}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
