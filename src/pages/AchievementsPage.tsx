import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ACHIEVEMENTS, getUnlockedAchievements, CATEGORY_LABELS, type AchievementStats } from '@/lib/achievements';
import { ATTRIBUTES } from '@/lib/constants';

export default function AchievementsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['achievement-stats', user?.id],
    queryFn: async () => {
      const [avatarRes, streakRes, actRes, followersRes, duelsRes] = await Promise.all([
        supabase.from('avatar_state').select('*').eq('user_id', user!.id).single(),
        supabase.from('streaks').select('*').eq('user_id', user!.id).single(),
        supabase.from('activities').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', user!.id),
        supabase.from('duels').select('winner_id').or(`challenger_id.eq.${user!.id},challenged_id.eq.${user!.id}`).eq('status', 'finished'),
      ]);
      const av = avatarRes.data;
      const duelsWon = (duelsRes.data ?? []).filter((d: any) => d.winner_id === user!.id).length;
      return {
        totalActivities: actRes.count ?? 0,
        currentStreak: streakRes.data?.current_streak ?? 0,
        maxStreak: streakRes.data?.max_streak ?? 0,
        totalXP: av?.total_xp ?? 0,
        followers: followersRes.count ?? 0,
        following: 0,
        duelsWon,
        strengthXP: av?.strength ?? 0,
        disciplineXP: av?.discipline ?? 0,
        creativityXP: av?.creativity ?? 0,
        charismaXP: av?.charisma ?? 0,
        flowXP: av?.flow ?? 0,
        courageXP: av?.courage ?? 0,
        focusXP: av?.focus ?? 0,
        freedomXP: av?.freedom ?? 0,
      } as AchievementStats;
    },
    enabled: !!user,
  });

  const unlocked = stats ? getUnlockedAchievements(stats) : [];
  const unlockedIds = new Set(unlocked.map(a => a.id));
  const categories = [...new Set(ACHIEVEMENTS.map(a => a.category))];

  return (
    <MobileLayout>
      <div className="pb-24 overflow-y-auto">
        <div className="flex items-center gap-3 px-5 pt-10 pb-4">
          <button onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Logros</h1>
            <p className="text-xs text-muted-foreground">{unlocked.length}/{ACHIEVEMENTS.length} desbloqueados</p>
          </div>
        </div>

        <div className="px-5 mb-5">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }} />
          </div>
        </div>

        {isLoading && <div className="text-center py-12 text-muted-foreground text-sm animate-pulse">Cargando logros...</div>}

        {!isLoading && categories.map(cat => {
          const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
          return (
            <div key={cat} className="px-5 mb-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="space-y-2">
                {catAchievements.map(a => {
                  const isUnlocked = unlockedIds.has(a.id);
                  return (
                    <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isUnlocked ? 'bg-card border-primary/30' : 'bg-card/40 border-border opacity-50'
                    }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                        isUnlocked ? 'bg-primary/10' : 'bg-secondary'
                      }`}>
                        {isUnlocked ? a.emoji : <Lock className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {a.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                      </div>
                      <span className={`text-xs font-bold whitespace-nowrap ${isUnlocked ? 'text-accent' : 'text-muted-foreground'}`}>
                        +{a.xpReward} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <BottomNav />
    </MobileLayout>
  );
}
