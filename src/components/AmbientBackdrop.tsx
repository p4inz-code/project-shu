import React from 'react';

export interface FloatingBurst {
  id: number;
  x: number;
  y: number;
  label?: string;
}

interface AmbientBackdropProps {
  reducedMotion: boolean;
  bursts: FloatingBurst[];
  activeWorld?: 'moonlight' | 'sunshine';
}

const AMBIENT_MOTES = [
  { id: 1, left: '14%', top: '18%', size: 5 },
  { id: 2, left: '28%', top: '62%', size: 4 },
  { id: 3, left: '68%', top: '24%', size: 6 },
  { id: 4, left: '84%', top: '55%', size: 4 },
  { id: 5, left: '46%', top: '80%', size: 5 },
  { id: 6, left: '90%', top: '15%', size: 4 },
];

const AMBIENT_SAKURA_PETALS = [
  { id: 'petal-1', left: '12%', top: '26%', rotate: -18, delay: '0s' },
  { id: 'petal-2', left: '78%', top: '34%', rotate: 24, delay: '3.2s' },
  { id: 'petal-3', left: '22%', top: '74%', rotate: 14, delay: '6.4s' },
  { id: 'petal-4', left: '86%', top: '70%', rotate: -26, delay: '1.8s' },
];

export const AmbientBackdrop: React.FC<AmbientBackdropProps> = ({
  reducedMotion,
  bursts,
  activeWorld = 'moonlight',
}) => {
  const isSunshine = activeWorld === 'sunshine';

  return (
    <>
      <div className="ambient-grain" aria-hidden="true" />

      <div className="ambient-atmosphere-layer" aria-hidden="true">
        <div className="ambient-moon-glow" />
        <div className="ambient-sun-bloom" />

        {!reducedMotion &&
          AMBIENT_MOTES.map((mote) => (
            <span
              key={mote.id}
              style={{
                position: 'absolute',
                left: mote.left,
                top: mote.top,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
                borderRadius: '50%',
                background: isSunshine
                  ? 'radial-gradient(circle, rgba(227,123,149,0.5) 0%, rgba(243,166,131,0) 75%)'
                  : 'radial-gradient(circle, rgba(230,222,252,0.72) 0%, rgba(159,122,234,0) 75%)',
                boxShadow: isSunshine
                  ? '0 0 10px rgba(243, 166, 131, 0.35)'
                  : '0 0 12px rgba(214, 200, 247, 0.45)',
                opacity: isSunshine ? 0.42 : 0.58,
                transition: 'background 0.6s ease, opacity 0.6s ease',
              }}
            />
          ))}

        {/* Restrained Drifting Sakura Petals Motif */}
        {!reducedMotion &&
          AMBIENT_SAKURA_PETALS.map((petal) => (
            <svg
              key={petal.id}
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
              className="ambient-sakura-petal"
              style={{
                left: petal.left,
                top: petal.top,
                animationDelay: petal.delay,
                transform: `rotate(${petal.rotate}deg)`,
              }}
            >
              <path
                d="M 12 2 C 7 7 6 15 12 22 C 18 15 17 7 12 2 M 12 2 L 12 7"
                fill={
                  isSunshine
                    ? 'rgba(227, 123, 149, 0.22)'
                    : 'rgba(214, 200, 247, 0.16)'
                }
                stroke={
                  isSunshine
                    ? 'rgba(201, 84, 114, 0.48)'
                    : 'rgba(230, 222, 252, 0.42)'
                }
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </svg>
          ))}
      </div>

      {/* Interactive floating heart reactions */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 160,
        }}
      >
        {bursts.map((b) => (
          <div
            key={b.id}
            className="floating-burst-heart"
            style={{
              left: `${b.x}px`,
              top: `${b.y}px`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: isSunshine ? '#25131f' : '#f8f5fc',
              fontSize: '0.88rem',
              fontFamily: 'var(--font-serif)',
              background: isSunshine
                ? 'rgba(255, 250, 246, 0.94)'
                : 'rgba(25, 17, 46, 0.92)',
              border: isSunshine
                ? '1px solid rgba(201, 84, 114, 0.38)'
                : '1px solid rgba(214, 200, 247, 0.45)',
              padding: '0.28rem 0.68rem',
              borderRadius: '999px',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
            }}
          >
            <span aria-hidden="true" style={{ color: '#e06d8b' }}>
              ♥
            </span>
            {b.label && <span>{b.label}</span>}
          </div>
        ))}
      </div>
    </>
  );
};
