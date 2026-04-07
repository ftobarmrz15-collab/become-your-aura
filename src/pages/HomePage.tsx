import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { AvatarHero } from '@/components/AvatarHero';
import { AvatarEditor } from '@/components/AvatarEditor';
import { XPBar } from '@/components/XPBar';
import { DisciplinePanel } from '@/components/DisciplinePanel';
import { DailyStats } from '@/components/DailyStats';
import { XPToast } from '@/components/XPToast';
import { LEVEL_NAMES, LEVEL_THRESHOLDS, ATTRIBUTES, getLevelFromXP, getXPForNextLevel, getDominantAttribute, type AttributeName } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAvatarConfig } from '@/hooks/useAvatarConfig';

// Subtle gradient per dominant attribute
const AURA_GRADIENTS: Record<string, string> = {
  strength:   'radial-gradient(ellipse at top, hsla(0,60%,25%,0.18) 0%, transparent 65%)',
  discipline: 'radial-gradient(ellipse at top, hsla(38,60%,25%,0.18) 0%, transparent 65%)',
  creativity: 'radial-gradient(ellipse at top, hsla(271,60%,25%,0.18) 0%, transparent 65%)',
  charisma:   'radial-gradient(ellipse at top, hsla(50,60%,25%,0.18) 0%, transparent 65%)',
  flow:       'radial-gradient(ellipse at top, hsla(142,60%,20%,0.18) 0%, transparent 65%)',
  courage:    'radial-gradient(ellipse at top, hsla(25,60%,25%,0.18) 0%, transparent 65%)',
  focus:      'radial-gradient(ellipse at top, hsla(217,60%,25%,0.18) 0%, transparent 65%)',
  freedom:    'radial-gradient(ellipse at top, hsla(173,60%,20%,0.18) 0%, transparent 65%)',
};

export default function HomePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [xpToast, setXpToast] = useState<{ xp: number; attribute: string } | null>(null);
  const { config: avatarConfig } = useAvatarConfig();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: avatar } = useQuery({
    queryKey: ['avatar', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('avatar_state').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: streak } = useQuery({
    queryKey: ['streak', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('streaks').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: todayActivities } = useQuery({
    queryKey: ['today-activities', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('activities')
        .select('*, activity_types(*)')
        .eq('user_id', user!.id)
        .gte('completed_at', today)
        .order('completed_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: recentActivities } = useQuery({
    queryKey: ['recent-activities', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('activities')
        .select('*, activity_types(*)')
        .eq('user_id', user!.id)
        .order('completed_at', { ascending: false })
        .limit(3);
      return data ?? [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('home-activities')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newActivity = payload.new as any;
          if (newActivity.xp_earned > 0) {
            const deltas = newActivity.attribute_deltas as Record<string, number> | null;
            const topAttr = deltas
              ? Object.entries(deltas).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'XP'
              : 'XP';
            setXpToast({ xp: newActivity.xp_earned, attribute: topAttr });
          }
          queryClient.invalidateQueries({ queryKey: ['avatar', user.id] });
          queryClient.invalidateQueries({ queryKey: ['streak', user.id] });
          queryClient.invalidateQueries({ queryKey: ['today-activities', user.id] });
          queryClient.invalidateQueries({ queryKey: ['recent-activities', user.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  if (!profile || !avatar) return null;

  const level = getLevelFromXP(avatar.total_xp);
  const levelName = LEVEL_NAMES[level];
  const nextLevelXP = getXPForNextLevel(level);
  const currentLevelXP = LEVEL_THRESHOLDS[level];

  const attrs: Record<string, number> = {};
  for (const a of ATTRIBUTES) attrs[a] = (avatar as any)[a] ?? 0;
  const dominant = getDominantAttribute(attrs);

  const xpToday = todayActivities?.reduce((sum: number, a: any) => sum + (a.xp_earned || 0), 0) ?? 0;
  const xpToNextLevel = nextLevelXP - avatar.total_xp;

  const today = new Date();
  const dateStr = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const auraGradient = AURA_GRADIENTS[dominant] ?? AURA_GRADIENTS.strength;

  return (
    <MobileLayout>
      {/* Aura background gradient */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: auraGradient, transition: 'background 1.5s ease' }}
      />

      <div className="relative z-10 pb-24 overflow-y-auto">
        <XPToast
          xp={xpToast?.xp ?? 0}
          attribute={xpToast?.attribute ?? ''}
          visible={!!xpToast}
          onDone={() => setXpToast(null)}
        />

        <div className="px-5 pt-10 pb-2">
          <h1 className="text-xl font-bold text-foreground">Hola, {profile.username}</h1>
          <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        </div>

        <AvatarHero
          avatarConfig={avatarConfig}
          username={profile.username}
          level={level}
          levelName={levelName}
          dominantAttribute={dominant}
          attrs={attrs}
          onClick={() => setEditorOpen(true)}
        />

        <div className="px-5 pb-2">
          <XPBar currentXP={avatar.total_xp} nextLevelXP={nextLevelXP} previousLevelXP={currentLevelXP} />
        </div>

        <div className="px-5 py-3">
          <DailyStats
            xpToday={xpToday}
            currentStreak={streak?.current_streak ?? 0}
            nextMilestone={xpToNextLevel <= 50 ? `¡${xpToNextLevel} XP!` : undefined}
          />
        </div>

        <div className="px-5 py-2">
          <DisciplinePanel attrs={attrs} />
        </div>

        {/* Today's Activities */}
        <div className="px-5 py-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Hoy</h2>
          {todayActivities && todayActivities.length > 0 ? (
            <div className="space-y-2">
              {todayActivities.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                  <span className="text-xl">{a.activity_types?.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{a.activity_types?.name}</p>
                    <p className="text-xs text-muted-foreground">{a.duration_minutes} min</p>
                  </div>
                  <span className="text-sm font-bold text-accent">+{a.xp_earned} XP</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <p className="text-sm text-muted-foreground">Sin actividades hoy</p>
              <p className="text-xs text-muted-foreground mt-1">¡Registra algo para ganar XP!</p>
            </div>
          )}
        </div>

        {/* Recent */}
        {recentActivities && recentActivities.length > 0 && (
          <div className="px-5 py-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recientes</h2>
            <div className="space-y-2">
              {recentActivities.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                  <span className="text-xl">{a.activity_types?.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{a.activity_types?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.completed_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-accent">+{a.xp_earned} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
      <AvatarEditor open={editorOpen} onClose={() => setEditorOpen(false)} />
    </MobileLayout>
  );
}
