import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang='ru'>
      <body
        style={{
          margin: 0,
          backgroundColor: 'var(--background, #09090b)',
          fontFamily: 'sans-serif',
        }}
      >
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Big 404 */}
            <div style={{ position: 'relative', marginBottom: '2rem' }}>
              <p
                style={{
                  fontSize: 'clamp(120px, 25vw, 200px)',
                  fontWeight: 900,
                  lineHeight: 1,
                  margin: 0,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.05em',
                  userSelect: 'none',
                }}
              >
                404
              </p>
              {/* Guitar strings decoration */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.15 }}>
                {[12, 26, 40, 54, 68, 82].map((top) => (
                  <div
                    key={top}
                    style={{
                      position: 'absolute',
                      top: `${top}%`,
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)',
                    }}
                  />
                ))}
              </div>
            </div>

            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#fafafa',
                margin: '0 0 0.75rem',
              }}
            >
              Страница не найдена
            </h1>

            <p
              style={{
                color: '#71717a',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                margin: '0 0 2rem',
              }}
            >
              Такой страницы не существует — возможно, ссылка устарела или была удалена.
            </p>

            <Link href='/ru' className='not-found-btn'>
              Вернуться на главную
            </Link>
            <style>{`
              .not-found-btn {
                display: inline-block;
                background-color: #f59e0b;
                color: #fff;
                padding: 0.625rem 2rem;
                border-radius: 9999px;
                font-weight: 600;
                font-size: 0.9rem;
                text-decoration: none;
                transition: background-color 0.2s;
              }
              .not-found-btn:hover { background-color: #d97706; }
            `}</style>
          </div>
        </main>
      </body>
    </html>
  );
}
