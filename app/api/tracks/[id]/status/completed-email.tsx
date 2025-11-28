import { Track } from '@/lib/generated/prisma/client';

export function CompletedEmail({ track }: { track: Track }) {
  return (
    <div
      style={{
        backgroundColor: '#f0f0f0',
        padding: '20px',
        borderRadius: '10px',
      }}
    >
      <h1 style={{ color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
        As notas da música {track.title} estão disponíveis
      </h1>
      <p style={{ color: '#333', fontSize: '16px' }}>
        Clique no link abaixo para ver as notas
      </p>
      <a
        href={`${process.env.NEXT_PUBLIC_APP_URL}/tracks/${track.id}`}
        style={{ color: '#333', fontSize: '16px', textDecoration: 'underline' }}
      >
        Ver notas
      </a>
    </div>
  );
}
