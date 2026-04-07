import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { AvatarDisplay } from '@/components/AvatarDisplay';
import { AvatarEditor } from '@/components/AvatarEditor';
import { getLevelFromXP, getDominantAttribute, LEVEL_NAMES, ATTRIBUTES, type AttributeName } from '@/lib/constants';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAvatarConfig } from '@/hooks/useAvatarConfig';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
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
      const { data } = await supabase
        .from('activities')
        .select('*, activity_types(name, emoji)')
        .eq('user_id', user!.id)
        .gte('completed_at', monthStart);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorite-types', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_favorites')
        .select('activity_type_id, activity_types(name, emoji)')
        .eq('user_id', user!.id);
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

  const stats = [
    { label: 'Actividades', value: totalActivities ?? 0 },
    { label: 'Racha actual', value: streak?.current_streak ?? 0 },
    { label: 'Racha máx', value: streak?.max_streak ?? 0 },
    { label: 'XP total', value: avatar.total_xp },
  ];

  return (
    <MobileLayout>
      <div className="px-5 pt-12 pb-24 space-y-6">
        <h1 className="text-xl font-bold text-foreground">Perfil</h1>

        <div className="flex flex-col items-center gap-3">
          <AvatarDisplay
            size={100}
            dominantAttribute={dominant}
            level={level}
            username={profile.username}
            avatarUrl={avatarConfig?.avatar_url}
            onClick={() => setEditorOpen(true)}
          />
          <p className="text-lg font-semibold text-foreground">{profile.username}</p>
          <p className="text-sm text-muted-foreground">Nivel {level} — {LEVEL_NAMES[level]}</p>
        </div>

        {/* Monthly goal */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Meta mensual</p>
              {editingGoal ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={goalValue}
                    onChange={(e) => setGoalValue(e.target.value)}
                    className="w-20 h-8 px-2 rounded-md bg-secondary text-foreground text-sm focus:outline-none"
                    min={1}
                  />
                  <button onClick={saveGoal} className="text-xs text-primary font-semibold">Guardar</button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {monthActivities?.length ?? 0} / {profile.monthly_goal ?? 20} actividades
                </p>
              )}
            </div>
            {!editingGoal && (
              <button
                onClick={() => { setEditingGoal(true); setGoalValue(String(profile.monthly_goal ?? 20)); }}
                className="text-xs text-primary"
              >
                Editar
              </button>
            )}
          </div>
          <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all"
              style={{ width: `${Math.min(((monthActivities?.length ?? 0) / (profile.monthly_goal ?? 20)) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(s => (
            <div key={s.label} className="p-3 rounded-xl bg-card border border-border text-center">
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Favorites */}
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

        {/* This month */}
        {mostFrequent && (
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm font-semibold text-foreground">Este mes</p>
            <p className="text-xs text-muted-foreground mt-1">
              {monthActivities?.length} actividades · Más frecuente: {mostFrequent.emoji} {mostFrequent.name} ({mostFrequent.count}x)
            </p>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-lg border border-border text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Cerrar sesión</span>
        </button>
      </div>
      <BottomNav />
      <AvatarEditor open={editorOpen} onClose={() => setEditorOpen(false)} />
    </MobileLayout>
  );
}
