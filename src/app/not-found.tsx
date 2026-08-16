import Image from 'next/image';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import styles from './not-found.module.scss';

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations('notFound');
  const homeHref = locale === 'en' ? '/en' : '/';

  return (
    <html lang={locale}>
      <body>
        <main className={styles.page}>
          <div aria-hidden='true' className={styles.glow} />
          <section className={styles.card}>
            <Image
              src='/generated/logo_.png'
              width={76}
              height={76}
              alt='OlegGuitar'
              className={styles.logo}
            />
            <p className={styles.eyebrow}>{t('stringBroke')}</p>
            <p className={styles.code}>404</p>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.description}>{t('description')}</p>
            <Link href={homeHref} className={styles.home}>
              {t('home')}
            </Link>
          </section>
        </main>
      </body>
    </html>
  );
}
