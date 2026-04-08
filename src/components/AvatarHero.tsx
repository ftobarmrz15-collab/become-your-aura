import { useMemo } from 'react';
import { ATTRIBUTE_COLORS, type AttributeName } from '@/lib/constants';
import AvatarSVG from '@/components/AvatarSVG';
import PetSVG from '@/components/PetSVG';
import { getPetProfile } from '@/lib/pet-evolution';

interface AvatarHeroProps {
  avatarConfig?: any | null;
  username: string;
  level: number;
  levelName: string;
  dominantAttribute: AttributeName;
  attrs: Record<string, number>;
  totalXP?: number;
  lastActivityDate?: string | null;
  onClick?: () => void;
}

function getAuraConfig(level: number) {
  if (level >= 31) return { colors: ['hsl(263 70% 58%)', 'hsl(38 92% 50%)', 'hsl(330 81% 60%)', 'hsl(142 71% 45%)'], intensity: 0.65, animated: true, label: 'Multicolor' };
  if (level >= 16) return { colors: ['hsl(38 92% 50%)', 'hsl(45 93% 47%)'], intensity: 0.5,  animated: false, label: 'Dorada' };
  if (level >= 6)  return { colors: ['hsl(217 91% 60%)', 'hsl(230 70% 55%)'], intensity: 0.35, animated: false, label: 'Azul' };
  return { colors: ['hsl(240 10% 55%)', 'hsl(240 10% 40%)'], intensity: 0.18, animated: false, label: 'Tenue' };
}

export function AvatarHero({ avatarConfig, username, level, levelName, dominantAttribute, attrs, totalXP = 0, lastActivityDate, onClick }: AvatarHeroProps) {
  const aura = useMemo(() => getAuraConfig(level), [level]);
  const ringColor = ATTRIBUTE_COLORS[dominantAttribute];
  const pet = getPetProfile(attrs, totalXP, lastActivityDate);

  return (
    <div className="relative flex flex-col items-center pt-6 pb-4">
      {/* Aura glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full blur-[90px] pointer-events-none"
        style={{
          background: aura.colors.length > 2
            ? `conic-gradient(${aura.colors.join(', ')}, ${aura.colors[0]})`
            : `radial-gradient(circle, ${aura.colors[0]}, ${aura.colors[1] || aura.colors[0]})`,
          opacity: aura.intensity,
          animation: aura.animated ? 'spin 8s linear infinite' : 'pulse 3s ease-in-out infinite',
        }}
      />

      {/* Avatar + Pet */}
      <div className="relative z-10 flex items-end gap-2">

        {/* Pet — izquierda */}
        <div className="mb-4 opacity-90">
          <PetSVG pet={pet} size={72} animate />
        </div>

        {/* Avatar principal */}
        <div
          className={`relative ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
          onClick={onClick}
        >
          <div className="rounded-[28px] p-[3px]"
            style={{ background: `linear-gradient(135deg, ${ringColor}, transparent 50%, ${ringColor})` }}>
            <div className="bg-card/80 backdrop-blur-sm rounded-[26px] p-2">
              {avatarConfig ? (
                <AvatarSVG config={avatarConfig} attributes={attrs} size={175} showAura />
              ) : (
                <div className="w-[175px] h-[220px] flex items-center justify-center">
                  <span className="text-5xl font-black text-foreground">{username.slice(0,2).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Level badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-black px-5 py-1.5 rounded-full shadow-lg shadow-primary/40 whitespace-nowrap">
            Lv.{level} · {levelName}
          </div>

          {/* Edit button */}
          {onClick && (
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center shadow-md">
              <span className="text-sm">✏️</span>
            </div>
          )}
        </div>

        {/* Aura indicator — derecha */}
        <div className="mb-4 flex flex-col items-center gap-1">
          <div className="w-2 rounded-full"
            style={{ height: 60, background: `linear-gradient(to top, transparent, ${ringColor})`, opacity: 0.7 }} />
          <span className="text-[9px] text-muted-foreground" style={{ writingMode: 'vertical-rl' }}>
            {aura.label}
          </span>
        </div>
      </div>

      {/* Nombre y mascota */}
      <div className="relative z-10 text-center mt-6">
        <h2 className="text-xl font-black text-foreground tracking-tight">{username}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {pet.stage > 0 ? `${pet.name} · ` : ''}Aura {aura.label}
        </p>
      </div>
    </div>
  );
}
