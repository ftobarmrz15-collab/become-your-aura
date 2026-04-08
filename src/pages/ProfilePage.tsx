import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import AvatarSVG from '@/components/AvatarSVG';
import { AvatarEditor } from '@/components/AvatarEditor';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';
import { ShareCard } from '@/components/ShareCard';
import { getLevelFromXP, getDominantAttribute, LEVEL_NAMES, ATTRIBUTES, type AttributeName } from '@/lib/constants';
import { LogOut, Trophy, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAvatarConfig } from '@/hooks/useAvatarConfig';
import { useNavigate } from 'react-router-dom';
import { ACHIEVEMENTS, getUnlockedAchievements, type AchievementStats } from '@/lib/achievements';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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

  const { data: totalActivities } = useQuery({
    queryKey: ['total-activities', user?.id],
    queryFn: async () => {
      const { count } = await supabase.from('activities').select('*', { count: 'exact', head: true }).eq('user_id', user!.id);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: monthActivities } = useQuery({
    queryKey: ['month-activities', user?.id],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data } = await supabase.from('activities').select('*, activity_types(name, emoji)').eq('user_id', user!.id).gte('completed_at', monthStart);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: heatmapActivities } = useQuery({
    queryKey: ['heatmap-activities', user?.id],
    queryFn: async () => {
      const d90 = new Date();
      d90.setDate(d90.getDate() - 84);
      const { data } = await supabase.from('activities').select('completed_at').eq('user_id', user!.id).gte('completed_at', d90.toISOString());
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: followersCount } = useQuery({
    queryKey: ['followers-count', user?.id],
    queryFn: async () => {
      const { count } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', user!.id);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: duelsWon } = useQuery({
    queryKey: ['duels-won', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('duels').select('winner_id').or(`challenger_id.eq.${user!.id},challenged_id.eq.${user!.id}`).eq('status', 'finished');
      return (data ?? []).filter((d: any) => d.winner_id === user!.id).length;
    },
    enabled: !!user,
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorite-types', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('user_favorites').select('activity_type_id, activity_types(name, emoji)').eq('user_id', user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalValue, setGoalValue] = useState('');

  if (!profile || !avatar) return null;

  const level = getLevelFromXP(avatar.total_xp);
  const attrs: Record<string, number> = {};
  for (const a of ATTRIBUTES) attrs[a] = (avatar as any)[a] ?? 0;
  const dominant = getDominantAttribute(attrs);

  const achievementStats: AchievementStats = {
    totalActivities: totalActivities ?? 0,
    currentStreak: streak?.current_streak ?? 0,
    maxStreak: streak?.max_streak ?? 0,
    totalXP: avatar.total_xp,
    followers: followersCount ?? 0,
    following: 0,
    duelsWon: duelsWon ?? 0,
    strengthXP: attrs.strength ?? 0,
    disciplineXP: attrs.discipline ?? 0,
    creativityXP: attrs.creativity ?? 0,
    charismaXP: attrs.charisma ?? 0,
    flowXP: attrs.flow ?? 0,
    courageXP: attrs.courage ?? 0,
    focusXP: attrs.focus ?? 0,
    freedomXP: attrs.freedom ?? 0,
  };
  const unlocked = getUnlockedAchievements(achievementStats);

  const activityCounts: Record<string, { count: number; name: string; emoji: string }> = {};
  monthActivities?.forEach((a: any) => {
    const name = a.activity_types?.name ?? 'Unknown';
    if (!activityCounts[name]) activityCounts[name] = { count: 0, name, emoji: a.activity_types?.emoji ?? '❓' };
    activityCounts[name].count++;
  });
  const mostFrequent = Object.values(activityCounts).sort((a, b) => b.count - a.count)[0];

  const saveGoal = async () => {
    const val = parseInt(goalValue);
    if (isNaN(val) || val < 1) return;
    await supabase.from('users').update({ monthly_goal: val }).eq('user_id', user!.id);
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    setEditingGoal(false);
    toast.success('Meta actualizada');
  };

  const fullAvatarConfig = {
    skin_tone: avatarConfig?.skin_tone ?? 'medium',
    hair_style: avatarConfig?.hair_style ?? 'short',
    hair_color: avatarConfig?.hair_color ?? 'black',
    outfit: avatarConfig?.outfit ?? 'casual',
    facial_hair: avatarConfig?.facial_hair ?? 'none',
    eye_color: avatarConfig?.eye_color ?? 'brown',
    face_shape: avatarConfig?.face_shape ?? 'oval',
    eye_shape: avatarConfig?.eye_shape ?? 'almond',
    nose: avatarConfig?.nose ?? 'straight',
    mouth: avatarConfig?.mouth ?? 'neutral',
    gender: (avatarConfig as any)?.gender ?? 'neutral',
    eyebrows: (avatarConfig as any)?.eyebrows ?? 'normal',
  };

  const stats = [
    { label: 'Actividades', value: totalActivities ?? 0 },
    { label: streak?.current_streak >= 7 ? 'Racha 🔥' : 'Racha', value: `${streak?.current_streak ?? 0} días` },
    { label: 'Racha máx', value: streak?.max_streak ?? 0 },
    { label: 'XP total', value: avatar.total_xp.toLocaleString() },
  ];

  return (
    <MobileLayout>
      <div className="px-5 pt-12 pb-24 space-y-6">
        <h1 className="text-xl font-bold text-foreground">Perfil</h1>

        <div className="flex flex-col items-center gap-3">
          <div className="cursor-pointer" onClick={() => setEditorOpen(true)}>
            <div className="bg-card rounded-2xl border border-border p-2 hover:border-primary/50 transition-colors">
              <AvatarSVG config={fullAvatarConfig} attributes={attrs} size={110} showAura />
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground">{profile.username}</p>
          <p className="text-sm text-muted-foreground">Nivel {level} — {LEVEL_NAMES[level]}</p>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)} className="gap-1.5 text-xs">
              ✏️ Editar avatar
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/duels')} className="gap-1.5 text-xs">
              <Swords className="w-3 h-3" /> Duelos
            </Button>
          </div>
          <ShareCard username={profile.username} level={level} totalXP={avatar.total_xp} dominant={dominant} attrs={attrs} avatarConfig={fullAvatarConfig} />
        </div>

        {/* Logros */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <p className="text-sm font-semibold text-foreground">Logros</p>
            </div>
            <button onClick={() => navigate('/achievements')} className="text-xs text-primary font-semibold">Ver todos →</button>
          </div>
          {unlocked.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aún no tienes logros. ¡Registra actividades!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {unlocked.slice(0, 6).map(a => (
                <div key={a.id} title={a.name} className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                  {a.emoji}
                </div>
              ))}
              {unlocked.length > 6 && (
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                  +{unlocked.length - 6}
                </div>
              )}
            </div>
          )}
          <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{unlocked.length}/{ACHIEVEMENTS.length} desbloqueados</p>
        </div>

        {/* Meta mensual */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Meta mensual</p>
              {editingGoal ? (
                <div className="flex items-center gap-2 mt-1">
                  <input type="number" value={goalValue} onChange={e => setGoalValue(e.target.value)}
                    className="w-20 h-8 px-2 rounded-md bg-secondary text-foreground text-sm focus:outline-none" min={1} />
                  <button onClick={saveGoal} className="text-xs text-primary font-semibold">Guardar</button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">{monthActivities?.length ?? 0} / {profile.monthly_goal ?? 20} actividades</p>
              )}
            </div>
            {!editingGoal && (
              <button onClick={() => { setEditingGoal(true); setGoalValue(String(profile.monthly_goal ?? 20)); }} className="text-xs text-primary">Editar</button>
            )}
          </div>
          <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(((monthActivities?.length ?? 0) / (profile.monthly_goal ?? 20)) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stats.map(s => (
            <div key={s.label} className="p-3 rounded-xl bg-card border border-border text-center">
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
            </div>
          ))}
        </div>

        <ActivityHeatmap activities={heatmapActivities ?? []} />

        {favorites && favorites.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Actividades favoritas</h2>
            <div className="flex flex-wrap gap-2">
              {favorites.map((f: any) => (
                <span key={f.activity_type_id} className="px-3 py-1.5 rounded-full bg-card border border-border text-sm text-foreground">
                  {f.activity_types?.emoji} {f.activity_types?.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {mostFrequent && (
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm font-semibold text-foreground">Este mes</p>
            <p className="text-xs text-muted-foreground mt-1">
              {monthActivities?.length} actividades · Más frecuente: {mostFrequent.emoji} {mostFrequent.name} ({mostFrequent.count}x)
            </p>
          </div>
        )}

        <button onClick={signOut}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-lg border border-border text-muted-foreground hover:text-destructive transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Cerrar sesión</span>
        </button>
      </div>
      <BottomNav />
      <AvatarEditor open={editorOpen} onClose={() => setEditorOpen(false)} />
    </MobileLayout>
  );
}
