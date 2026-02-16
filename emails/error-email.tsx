import { Track } from '@/lib/generated/prisma/client';

export function ErrorEmail({ track }: { track: Track }) {
  return (
    <div
      style={{
        backgroundColor: '#f0f0f0',
        padding: '20px',
        borderRadius: '10px',
      }}
    >
      <h1 style={{ color: '#333', fontSize: '20px', fontWeight: 'bold' }}>
        Houve um erro ao processar a música {track.title}
      </h1>
      <p style={{ color: '#333', fontSize: '16px' }}>
        Nós lamentamos que isso tenha acontecido. Por favor, entre em contato
        com o suporte.
      </p>
    </div>
  );
}
