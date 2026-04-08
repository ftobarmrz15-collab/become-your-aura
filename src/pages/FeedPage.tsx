import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { Heart, Swords, Users, Compass, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import AvatarSVG from '@/components/AvatarSVG';
import { getLevelFromXP, ATTRIBUTES } from '@/lib/constants';
import { toast } from 'sonner';

type FeedTab = 'following' | 'groups' | 'explore';

async function enrichActivities(activities: any[], userId: string) {
  if (!activities || activities.length === 0) return [];
  return Promise.all(activities.map(async (a: any) => {
    const [profileRes, avatarRes, avatarCfgRes, likesRes, uploadsRes] = await Promise.all([
      supabase.from('users').select('username').eq('user_id', a.user_id).single(),
      supabase.from('avatar_state').select('*').eq('user_id', a.user_id).single(),
      supabase.from('avatar_config').select('*').eq('user_id', a.user_id).single(),
      supabase.from('activity_likes').select('user_id').eq('activity_id', a.id),
      supabase.from('uploads').select('*').eq('activity_id', a.id),
    ]);
    return {
      ...a,
      user_profile: profileRes.data,
      user_avatar_state: avatarRes.data,
      user_avatar_config: avatarCfgRes.data,
      likes: likesRes.data ?? [],
      uploads: uploadsRes.data ?? [],
    };
  }));
}

function ActivityCard({ activity, currentUserId }: { activity: any; currentUserId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const liked = activity.likes?.some((l: any) => l.user_id === currentUserId);
  const likeCount = activity.likes?.length ?? 0;
  const isOwnPost = activity.user_id === currentUserId;

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('activity-uploads').getPublicUrl(path);
    return data.publicUrl;
  };

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (liked) {
        await supabase.from('activity_likes').delete().eq('activity_id', activity.id).eq('user_id', currentUserId);
      } else {
        await supabase.from('activity_likes').insert({ activity_id: activity.id, user_id: currentUserId });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const challengeMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('duels').insert({
        challenger_id: currentUserId,
        challenged_id: activity.user_id,
        discipline: activity.activity_type?.name ?? 'General',
        duration: 'week',
        status: 'pending',
      });
    },
    onSuccess: () => toast.success(`¡Reto enviado a ${activity.user_profile?.username}! ⚔️`),
    onError: () => toast.error('Error enviando el reto'),
  });

  const avatarCfg = activity.user_avatar_config;
  const attrs: Record<string, number> = {};
  for (const a of ATTRIBUTES) attrs[a] = activity.user_avatar_state?.[a] ?? 0;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button className="flex items-center gap-3 p-3 w-full text-left hover:bg-secondary/30 transition-colors"
        onClick={() => navigate(`/profile/${activity.user_id}`)}>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex-shrink-0">
          {avatarCfg ? (
            <AvatarSVG config={avatarCfg} attributes={attrs} size={40} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs font-bold text-muted-foreground">
                {activity.user_profile?.username?.slice(0,2).toUpperCase() ?? '??'}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{activity.user_profile?.username ?? 'Usuario'}</p>
          <p className="text-[10px] text-muted-foreground">
            Lv.{getLevelFromXP(activity.user_avatar_state?.total_xp ?? 0)} ·{' '}
            {formatDistanceToNow(new Date(activity.completed_at), { addSuffix: true, locale: es })}
          </p>
        </div>
        <span className="text-xl">{activity.activity_type?.emoji}</span>
      </button>

      {activity.uploads?.length > 0 && (
        <div className="w-full aspect-square bg-secondary overflow-hidden">
          {activity.uploads[0].media_type === 'photo' ? (
            <img src={getPublicUrl(activity.uploads[0].storage_path)} alt="" className="w-full h-full object-cover" />
          ) : (
            <video src={getPublicUrl(activity.uploads[0].storage_path)} className="w-full h-full object-cover" controls />
          )}
        </div>
      )}

      <div className="px-3 pt-2 pb-1">
        <p className="text-sm font-semibold text-foreground">
          {activity.activity_type?.emoji} {activity.activity_type?.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {activity.duration_minutes} min · <span className="text-accent font-semibold">+{activity.xp_earned} XP</span>
        </p>
        {activity.note && <p className="text-xs text-muted-foreground mt-1 italic">"{activity.note}"</p>}
      </div>

      <div className="flex items-center gap-4 px-3 py-2 border-t border-border/50">
        <button onClick={() => likeMutation.mutate()}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-red-500 transition-colors">
          <Heart className={`w-5 h-5 transition-all ${liked ? 'fill-red-500 text-red-500 scale-110' : ''}`} />
          {likeCount > 0 && <span className="text-xs font-medium">{likeCount}</span>}
        </button>
        {!isOwnPost && (
          <button onClick={() => challengeMutation.mutate()}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-orange-500 transition-colors ml-auto">
            <Swords className="w-5 h-5" />
            <span className="text-xs font-medium">Retar</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<FeedTab>('following');

  const { data: feedActivities, isLoading } = useQuery({
    queryKey: ['feed', user?.id, tab],
    queryFn: async () => {
      let userIds: string[] = [];

      if (tab === 'following') {
        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user!.id);
        userIds = (follows ?? []).map((f: any) => f.following_id);
        userIds.push(user!.id);
        if (userIds.length <= 1) return [];
      } else if (tab === 'groups') {
        const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user!.id);
        if (!memberships || memberships.length === 0) return [];
        const groupIds = memberships.map((m: any) => m.group_id);
        const { data: groupMembers } = await supabase.from('group_members').select('user_id').in('group_id', groupIds);
        userIds = [...new Set((groupMembers ?? []).map((m: any) => m.user_id))];
      }

      let query = supabase
        .from('activities')
        .select('*, activity_type:activity_types(name, emoji)')
        .order('completed_at', { ascending: false })
        .limit(30);

      if (tab !== 'explore') query = query.in('user_id', userIds);

      const { data: activities } = await query;
      return enrichActivities(activities ?? [], user!.id);
    },
    enabled: !!user,
  });

  const tabs = [
    { key: 'following' as FeedTab, label: 'Siguiendo', icon: Users },
    { key: 'groups'    as FeedTab, label: 'Grupos',    icon: Trophy },
    { key: 'explore'   as FeedTab, label: 'Explorar',  icon: Compass },
  ];

  return (
    <MobileLayout>
      <div className="pb-24 overflow-y-auto">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="px-5 pt-10 pb-1">
            <h1 className="text-xl font-black text-foreground tracking-tight">AURA</h1>
          </div>
          <div className="flex px-5 pb-3 gap-6">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 text-sm font-semibold pb-1 border-b-2 transition-colors ${
                    tab === t.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                  }`}>
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 pt-4 space-y-4">
          {isLoading && <div className="text-center py-12 text-muted-foreground text-sm animate-pulse">Cargando...</div>}

          {!isLoading && (!feedActivities || feedActivities.length === 0) && (
            <div className="text-center py-16 space-y-3">
              <p className="text-4xl">{tab === 'following' ? '👥' : tab === 'groups' ? '🏆' : '🌍'}</p>
              <p className="text-sm font-semibold text-foreground">
                {tab === 'following' ? 'Tu feed está vacío' : tab === 'groups' ? 'Sin actividad en grupos' : 'Sin actividades'}
              </p>
              <p className="text-xs text-muted-foreground">
                {tab === 'following' ? 'Sigue a otros usuarios para ver sus actividades' : tab === 'groups' ? 'Únete a un grupo para ver qué hacen tus amigos' : 'Aún no hay actividades públicas'}
              </p>
              {tab === 'following' && (
                <button onClick={() => setTab('explore')}
                  className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  Explorar usuarios
                </button>
              )}
            </div>
          )}

          {feedActivities?.map((activity: any) => (
            <ActivityCard key={activity.id} activity={activity} currentUserId={user!.id} />
          ))}
        </div>
      </div>
      <BottomNav />
    </MobileLayout>
  );
}
