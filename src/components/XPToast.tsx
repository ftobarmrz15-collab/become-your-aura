import { useEffect, useState } from 'react';

interface XPToastProps {
  xp: number;
  attribute: string;
  visible: boolean;
  onDone: () => void;
}

export function XPToast({ xp, attribute, visible, onDone }: XPToastProps) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDone, 2500);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-xp-float">
      <div className="px-4 py-2 rounded-full bg-accent/90 text-accent-foreground text-sm font-bold shadow-lg shadow-accent/30 backdrop-blur-sm">
        +{xp} XP ⚡ {attribute}
      </div>
    </div>
  );
}
