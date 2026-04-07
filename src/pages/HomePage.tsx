import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { AvatarDisplay } from '@/components/AvatarDisplay';
import { AvatarEditor } from '@/components/AvatarEditor';
import { XPBar } from '@/components/XPBar';
import { LEVEL_NAMES, LEVEL_THRESHOLDS, getLevelFromXP, getXPForNextLevel, getDominantAttribute, type AttributeName } from '@/lib/constants';
import { Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAvatarConfig } from '@/hooks/useAvatarConfig';

export default function HomePage() {
  const { user } = useAuth();
  const [editorOpen, setEditorOpen] = useState(false);
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

  if (!profile || !avatar) return null;

  const level = getLevelFromXP(avatar.total_xp);
  const levelName = LEVEL_NAMES[level];
  const nextLevelXP = getXPForNextLevel(level);
  const currentLevelXP = LEVEL_THRESHOLDS[level];
  const dominant = getDominantAttribute({
    strength: avatar.strength, discipline: avatar.discipline,
    creativity: avatar.creativity, charisma: avatar.charisma,
    flow: avatar.flow, courage: avatar.courage,
    focus: avatar.focus, freedom: avatar.freedom,
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <MobileLayout>
      <div className="px-5 pt-12 pb-24 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Hola, {profile.username}</h1>
          <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        </div>

        {/* Avatar section */}
        <div className="flex flex-col items-center gap-4">
          <AvatarDisplay
            dominantAttribute={dominant}
            level={level}
            username={profile.username}
            avatarUrl={avatarConfig?.avatar_url}
            onClick={() => setEditorOpen(true)}
          />
          <div className="text-center mt-2">
            <p className="text-sm font-medium text-foreground">Nivel {level} — {levelName}</p>
          </div>
          <div className="w-full max-w-[280px]">
            <XPBar currentXP={avatar.total_xp} nextLevelXP={nextLevelXP} previousLevelXP={currentLevelXP} />
          </div>
        </div>

        {/* Streak */}
        {streak && streak.current_streak > 0 && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Flame className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-accent">{streak.current_streak} días seguidos</span>
          </div>
        )}

        {/* Today section */}
        <div>
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
          <div>
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
