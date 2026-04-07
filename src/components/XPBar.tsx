import { useEffect, useRef, useState } from 'react';

interface XPBarProps {
  currentXP: number;
  nextLevelXP: number;
  previousLevelXP: number;
}

export function XPBar({ currentXP, nextLevelXP, previousLevelXP }: XPBarProps) {
  const progress = nextLevelXP > previousLevelXP
    ? ((currentXP - previousLevelXP) / (nextLevelXP - previousLevelXP)) * 100
    : 100;

  const [displayXP, setDisplayXP] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = prevRef.current;
    const end = currentXP;
    const endBar = Math.min(progress, 100);
    const duration = 800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayXP(Math.round(start + (end - start) * ease));
      setBarWidth(endBar * ease);
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    prevRef.current = currentXP;

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [currentXP, progress]);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
        <span className="font-semibold text-foreground">{displayXP.toLocaleString()} XP</span>
        <span>{nextLevelXP.toLocaleString()} XP</span>
      </div>
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full relative"
          style={{ width: `${barWidth}%`, transition: 'none' }}
        >
          {/* Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  );
}
