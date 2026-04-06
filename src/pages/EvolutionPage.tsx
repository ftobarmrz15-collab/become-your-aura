import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { AvatarCircle } from '@/components/AvatarCircle';
import { XPBar } from '@/components/XPBar';
import { AttributeBar } from '@/components/AttributeBar';
import { LEVEL_NAMES, LEVEL_THRESHOLDS, ATTRIBUTES, ATTRIBUTE_LABELS, ATTRIBUTE_COLORS, getLevelFromXP, getXPForNextLevel, getDominantAttribute, type AttributeName } from '@/lib/constants';

export default function EvolutionPage() {
  const { user } = useAuth();

  const { data: avatar } = useQuery({
    queryKey: ['avatar', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('avatar_state').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  if (!avatar || !profile) return null;

  const level = getLevelFromXP(avatar.total_xp);
  const nextLevelXP = getXPForNextLevel(level);
  const currentLevelXP = LEVEL_THRESHOLDS[level];
  const attrs: Record<string, number> = {};
  for (const a of ATTRIBUTES) attrs[a] = (avatar as any)[a] ?? 0;
  const dominant = getDominantAttribute(attrs);
  const progress = nextLevelXP > currentLevelXP
    ? Math.round(((avatar.total_xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)
    : 100;

  return (
    <MobileLayout>
      <div className="px-5 pt-12 pb-24 space-y-6">
        <h1 className="text-xl font-bold text-foreground">Evolución</h1>

        <div className="flex flex-col items-center gap-4">
          <AvatarCircle size={140} dominantAttribute={dominant} level={level} username={profile.username} />
          <p className="text-sm font-medium text-foreground mt-2">
            Nivel {level} — {LEVEL_NAMES[level]}
          </p>
          <div className="w-full max-w-[280px]">
            <XPBar currentXP={avatar.total_xp} nextLevelXP={nextLevelXP} previousLevelXP={currentLevelXP} />
          </div>
        </div>

        {/* Attributes */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Tus atributos</h2>
          <div className="space-y-3">
            {ATTRIBUTES.map(attr => (
              <AttributeBar key={attr} attribute={attr} value={attrs[attr]} />
            ))}
          </div>
        </div>

        {/* Next level */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <h2 className="text-sm font-semibold text-foreground mb-2">Próximo nivel</h2>
          <p className="text-xs text-muted-foreground">
            Necesitas {nextLevelXP - avatar.total_xp} XP más para alcanzar el nivel {Math.min(level + 1, 20)}
          </p>
          <p className="text-xs text-accent mt-1">{progress}% completado</p>
        </div>

        {/* Dominant attribute */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <h2 className="text-sm font-semibold text-foreground mb-2">Atributo dominante</h2>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ATTRIBUTE_COLORS[dominant] }} />
            <span className="text-sm font-medium" style={{ color: ATTRIBUTE_COLORS[dominant] }}>
              {ATTRIBUTE_LABELS[dominant]}
            </span>
            <span className="text-sm text-muted-foreground">— {attrs[dominant]} pts</span>
          </div>
        </div>
      </div>
      <BottomNav />
    </MobileLayout>
  );
}
