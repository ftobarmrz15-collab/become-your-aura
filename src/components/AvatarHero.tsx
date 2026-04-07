import { useMemo } from 'react';
import { ATTRIBUTE_COLORS, type AttributeName } from '@/lib/constants';

interface AvatarHeroProps {
  avatarUrl?: string | null;
  username: string;
  level: number;
  levelName: string;
  dominantAttribute: AttributeName;
  onClick?: () => void;
}

function getAuraConfig(level: number) {
  if (level >= 31) return { colors: ['hsl(263 70% 58%)', 'hsl(38 92% 50%)', 'hsl(330 81% 60%)', 'hsl(142 71% 45%)'], intensity: 0.6, animated: true, label: 'Multicolor' };
  if (level >= 16) return { colors: ['hsl(38 92% 50%)', 'hsl(45 93% 47%)'], intensity: 0.45, animated: false, label: 'Dorada' };
  if (level >= 6) return { colors: ['hsl(217 91% 60%)', 'hsl(230 70% 55%)'], intensity: 0.3, animated: false, label: 'Azul' };
  return { colors: ['hsl(240 10% 55%)', 'hsl(240 10% 40%)'], intensity: 0.15, animated: false, label: 'Tenue' };
}

export function AvatarHero({ avatarUrl, username, level, levelName, dominantAttribute, onClick }: AvatarHeroProps) {
  const aura = useMemo(() => getAuraConfig(level), [level]);
  const ringColor = ATTRIBUTE_COLORS[dominantAttribute];
  const initials = username ? username.slice(0, 2).toUpperCase() : '??';

  return (
    <div className="relative flex flex-col items-center pt-8 pb-4">
      {/* Aura background glow */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[280px] h-[280px] rounded-full blur-[80px] transition-all duration-1000 ${aura.animated ? 'animate-aura-rotate' : 'animate-aura-pulse'}`}
        style={{
          background: aura.colors.length > 2
            ? `conic-gradient(${aura.colors.join(', ')}, ${aura.colors[0]})`
            : `radial-gradient(circle, ${aura.colors[0]}, ${aura.colors[1] || aura.colors[0]})`,
          opacity: aura.intensity,
        }}
      />

      {/* Avatar container */}
      <div
        className={`relative z-10 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        {/* Outer ring with pulse */}
        <div
          className="w-[140px] h-[140px] rounded-full p-[3px] animate-ring-pulse"
          style={{
            background: `linear-gradient(135deg, ${ringColor}, ${ringColor}80)`,
            boxShadow: `0 0 30px ${ringColor}40, 0 0 60px ${ringColor}20`,
          }}
        >
          <div className="w-full h-full rounded-full bg-card overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-foreground">{initials}</span>
            )}
          </div>
        </div>

        {/* Level badge */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-primary/30">
          Lv.{level}
        </div>

        {/* Edit indicator */}
        {onClick && (
          <div className="absolute -top-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md">
            <span className="text-xs">✏️</span>
          </div>
        )}
      </div>

      {/* Name & level */}
      <div className="relative z-10 text-center mt-5">
        <h2 className="text-lg font-bold text-foreground">{username}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Nivel {level} — {levelName}
          <span className="ml-2 text-[10px] opacity-60">Aura {aura.label}</span>
        </p>
      </div>
    </div>
  );
}
