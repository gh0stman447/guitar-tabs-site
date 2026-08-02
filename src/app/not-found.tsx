import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <html lang='ru'>
      <body style={{ margin: 0, background: '#171513', color: '#f5f1ed', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <main style={{ position: 'relative', display: 'grid', minHeight: '100svh', placeItems: 'center', overflow: 'hidden', padding: '24px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 28%, rgba(224, 112, 73, .16), transparent 34rem)' }} />
          <section style={{ position: 'relative', width: 'min(100%, 560px)', overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)', borderRadius: '32px', background: 'rgba(29,27,25,.86)', padding: 'clamp(28px, 6vw, 52px)', textAlign: 'center', boxShadow: '0 28px 90px rgba(0,0,0,.28)', backdropFilter: 'blur(18px)' }}>
            <Image src='/generated/logo_.png' width={76} height={76} alt='OlegGuitar' style={{ width: 76, height: 76, objectFit: 'contain' }} />
            <p style={{ margin: '14px 0 0', color: '#df7954', fontSize: 12, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase' }}>Струна потерялась</p>
            <p style={{ margin: '4px 0 0', background: 'linear-gradient(135deg, #f0ae70, #dc704b)', backgroundClip: 'text', color: 'transparent', fontSize: 'clamp(82px, 24vw, 150px)', fontWeight: 800, letterSpacing: '-.08em', lineHeight: .95 }}>404</p>
            <h1 style={{ margin: '14px 0 0', fontSize: 'clamp(26px, 6vw, 36px)', lineHeight: 1.15 }}>Такой страницы нет</h1>
            <p style={{ margin: '14px auto 0', maxWidth: 420, color: '#aaa39d', fontSize: 15, lineHeight: 1.65 }}>Возможно, ссылка устарела. Вернитесь на главную — там музыка продолжается.</p>
            <Link href='/ru' style={{ display: 'inline-flex', marginTop: 28, borderRadius: 8, background: '#dd704c', padding: '12px 24px', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Вернуться на главную
            </Link>
          </section>
        </main>
      </body>
    </html>
  );
}
