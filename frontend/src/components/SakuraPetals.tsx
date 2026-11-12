import { useMemo } from 'react';

interface Petal {
  id: number;
  left: string;
  width: string;
  height: string;
  duration: string;
  delay: string;
  rotate: string;
}

export default function SakuraPetals() {
  const petals = useMemo<Petal[]>(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left:     `${Math.random() * 100}vw`,
      width:    `${Math.random() * 12 + 8}px`,
      height:   `${Math.random() * 14 + 10}px`,
      duration: `${Math.random() * 6 + 7}s`,
      delay:    `${Math.random() * 8}s`,
      rotate:   `${Math.random() * 360}deg`,
    }));
  }, []);

  return (
    <div className="sakura-container" aria-hidden="true">
      {petals.map((p) => (
        <div
          key={p.id}
          className="sakura-petal"
          style={{
            left:              p.left,
            width:             p.width,
            height:            p.height,
            animationDuration: p.duration,
            animationDelay:    p.delay,
            '--rotate':        p.rotate,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
