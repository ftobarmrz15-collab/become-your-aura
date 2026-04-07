import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400);
    const t2 = setTimeout(() => setPhase('out'), 1600);
    const t3 = setTimeout(() => onDone(), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-4"
      style={{
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.5s ease-out' : 'opacity 0.4s ease-in',
      }}
    >
      {/* Aura rings */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full border border-primary/10"
          style={{
            width: 140, height: 140,
            opacity: phase === 'hold' ? 1 : 0,
            transform: phase === 'hold' ? 'scale(1)' : 'scale(0.7)',
            transition: 'all 0.6s ease-out',
          }}
        />
        <div
          className="absolute rounded-full border border-primary/20"
          style={{
            width: 108, height: 108,
            opacity: phase === 'hold' ? 1 : 0,
            transform: phase === 'hold' ? 'scale(1)' : 'scale(0.7)',
            transition: 'all 0.5s ease-out 0.1s',
          }}
        />
        <div
          className="absolute rounded-full bg-primary/10"
          style={{
            width: 80, height: 80,
            opacity: phase === 'hold' ? 1 : 0,
            transform: phase === 'hold' ? 'scale(1)' : 'scale(0.7)',
            transition: 'all 0.4s ease-out 0.15s',
          }}
        />
        {/* Logo */}
        <div
          style={{
            opacity: phase === 'in' ? 0 : 1,
            transform: phase === 'in' ? 'scale(0.6)' : 'scale(1)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <span className="text-3xl font-black text-foreground tracking-widest">AURA</span>
        </div>
      </div>

      <p
        className="text-xs text-muted-foreground tracking-widest uppercase"
        style={{
          opacity: phase === 'hold' ? 1 : 0,
          transition: 'opacity 0.4s ease-out 0.3s',
        }}
      >
        Become your best self
      </p>
    </div>
  );
}
