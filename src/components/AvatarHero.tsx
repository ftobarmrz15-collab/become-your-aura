import { useMemo } from 'react';
import { ATTRIBUTE_COLORS, type AttributeName } from '@/lib/constants';
import AvatarSVG from '@/components/AvatarSVG';

interface AvatarHeroProps {
  avatarConfig?: {
    skin_tone: string;
    hair_style: string;
    hair_color: string;
    outfit: string;
    facial_hair: string;
    eye_color: string;
  } | null;
  username: string;
  level: number;
  levelName: string;
  dominantAttribute: AttributeName;
  attrs: Record<string, number>;
  onClick?: () => void;
}

function getAuraConfig(level: number) {
  if (level >= 31) return { colors: ['hsl(263 70% 58%)', 'hsl(38 92% 50%)', 'hsl(330 81% 60%)', 'hsl(142 71% 45%)'], intensity: 0.6, animated: true, label: 'Multicolor' };
  if (level >= 16) return { colors: ['hsl(38 92% 50%)', 'hsl(45 93% 47%)'], intensity: 0.45, animated: false, label: 'Dorada' };
  if (level >= 6) return { colors: ['hsl(217 91% 60%)', 'hsl(230 70% 55%)'], intensity: 0.3, animated: false, label: 'Azul' };
  return { colors: ['hsl(240 10% 55%)', 'hsl(240 10% 40%)'], intensity: 0.15, animated: false, label: 'Tenue' };
}

export function AvatarHero({ avatarConfig, username, level, levelName, dominantAttribute, attrs, onClick }: AvatarHeroProps) {
  const aura = useMemo(() => getAuraConfig(level), [level]);
  const ringColor = ATTRIBUTE_COLORS[dominantAttribute];

  return (
    <div className="relative flex flex-col items-center pt-4 pb-2">
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

      {/* Avatar SVG container */}
      <div
        className={`relative z-10 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div
          className="rounded-2xl p-1 animate-ring-pulse"
          style={{
            background: `linear-gradient(135deg, ${ringColor}40, transparent, ${ringColor}40)`,
          }}
        >
          {avatarConfig ? (
            <AvatarSVG config={avatarConfig} attributes={attrs} size={160} />
          ) : (
            <div className="w-[160px] h-[200px] flex items-center justify-center">
              <span className="text-4xl font-bold text-foreground">
                {username ? username.slice(0, 2).toUpperCase() : '??'}
              </span>
            </div>
          )}
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
