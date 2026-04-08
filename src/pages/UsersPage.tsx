import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, UserMinus, Trophy, Star } from 'lucide-react';
import { getLevelFromXP, LEVEL_NAMES, ATTRIBUTES } from '@/lib/constants';
import AvatarSVG from '@/components/AvatarSVG';
import { toast } from 'sonner';

function UserCard({ u, currentUserId, isFollowing, onFollowToggle }: {
  u: any;
  currentUserId: string;
  isFollowing: boolean;
  onFollowToggle: (userId: string, isFollowing: boolean) => void;
}) {
  const navigate = useNavigate();
  const isMe = u.userId === currentUserId;
  const attrs: Record<string, number> = {};
  for (const a of ATTRIBUTES) attrs[a] = u.attrs?.[a] ?? 0;

  return (
    <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl">
      {/* Avatar */}
      <button
        onClick={() => navigate(`/profile/${u.userId}`)}
        className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-secondary border border-border/50"
      >
        {u.avatarConfig ? (
          <AvatarSVG config={u.avatarConfig} attributes={attrs} size={64} showAura />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-lg font-black text-muted-foreground">
              {u.username?.slice(0,2).toUpperCase() ?? '??'}
            </span>
          </div>
        )}
      </button>

      {/* Info */}
      <button
        className="flex-1 min-w-0 text-left"
        onClick={() => navigate(`/profile/${u.userId}`)}
      >
        <p className="text-sm font-bold text-foreground truncate">{u.username}</p>
        <p className="text-xs text-muted-foreground">
          Lv.{u.level} — {LEVEL_NAMES[u.level]}
        </p>
        <p className="text-xs text-accent font-semibold mt-0.5">{u.totalXP.toLocaleString()} XP</p>
        {u.followers > 0 && <p className="text-[10px] text-muted-foreground">{u.followers} seguidores</p>}
      </button>

      {/* Rank if available */}
      {u.rank && (
        <div className="flex flex-col items-center mr-1">
          {u.rank === 1 && <span className="text-lg">🥇</span>}
          {u.rank === 2 && <span className="text-lg">🥈</span>}
          {u.rank === 3 && <span className="text-lg">🥉</span>}
          {u.rank > 3 && <span className="text-xs text-muted-foreground font-bold">#{u.rank}</span>}
        </div>
      )}

      {/* Follow button */}
      {!isMe && (
        <button
          onClick={() => onFollowToggle(u.userId, isFollowing)}
          className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            isFollowing
              ? 'bg-secondary text-muted-foreground border border-border'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          {isFollowing
            ? <><UserMinus className="w-3.5 h-3.5" /> Siguiendo</>
            : <><UserPlus className="w-3.5 h-3.5" /> Seguir</>
          }
        </button>
      )}
    </div>
  );
}

export default function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'following' | 'groups' | 'popular'>('following');

  // Get who I follow
  const { data: followingIds } = useQuery({
    queryKey: ['following-ids', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user!.id);
      return (data ?? []).map((f: any) => f.following_id);
    },
    enabled: !!user,
  });

  // Group members
  const { data: groupUsers, isLoading: loadingGroups } = useQuery({
    queryKey: ['group-users', user?.id],
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, groups(name)')
        .eq('user_id', user!.id);

      if (!memberships || memberships.length === 0) return [];

      const groupIds = memberships.map((m: any) => m.group_id);

      const { data: allMembers } = await supabase
        .from('group_members')
        .select('user_id, group_id, groups(name)')
        .in('group_id', groupIds);

      if (!allMembers) return [];

      // Get unique user IDs (excluding self)
      const uniqueIds = [...new Set(allMembers.map((m: any) => m.user_id))].filter(id => id !== user!.id);

      // Fetch each user's data
      const users = await Promise.all(uniqueIds.map(async (uid: string) => {
        const [profileRes, avatarRes, configRes] = await Promise.all([
          supabase.from('users').select('username').eq('user_id', uid).single(),
          supabase.from('avatar_state').select('*').eq('user_id', uid).single(),
          supabase.from('avatar_config').select('*').eq('user_id', uid).single(),
        ]);
        const totalXP = avatarRes.data?.total_xp ?? 0;
        const attrs: Record<string, number> = {};
        for (const a of ATTRIBUTES) attrs[a] = avatarRes.data?.[a] ?? 0;

        // Find group names for this user
        const userGroups = allMembers
          .filter((m: any) => m.user_id === uid)
          .map((m: any) => (m.groups as any)?.name)
          .filter(Boolean);

        return {
          userId: uid,
          username: profileRes.data?.username ?? 'Usuario',
          totalXP,
          level: getLevelFromXP(totalXP),
          attrs,
          avatarConfig: configRes.data,
          groups: userGroups,
        };
      }));

      // Sort by XP and add rank
      return users
        .sort((a, b) => b.totalXP - a.totalXP)
        .map((u, i) => ({ ...u, rank: i + 1 }));
    },
    enabled: !!user,
  });

  // Following users
  const { data: followingUsers, isLoading: loadingFollowing } = useQuery({
    queryKey: ['following-users', user?.id, followingIds],
    queryFn: async () => {
      if (!followingIds || followingIds.length === 0) return [];

      const users = await Promise.all(followingIds.map(async (uid: string) => {
        const [profileRes, avatarRes, configRes] = await Promise.all([
          supabase.from('users').select('username').eq('user_id', uid).single(),
          supabase.from('avatar_state').select('*').eq('user_id', uid).single(),
          supabase.from('avatar_config').select('*').eq('user_id', uid).single(),
        ]);
        const totalXP = avatarRes.data?.total_xp ?? 0;
        const attrs: Record<string, number> = {};
        for (const a of ATTRIBUTES) attrs[a] = avatarRes.data?.[a] ?? 0;
        return {
          userId: uid,
          username: profileRes.data?.username ?? 'Usuario',
          totalXP,
          level: getLevelFromXP(totalXP),
          attrs,
          avatarConfig: configRes.data,
        };
      }));

      return users.sort((a, b) => b.totalXP - a.totalXP);
    },
    enabled: !!user && tab === 'following',
  });


  // Popular users (all Aura, sorted by XP)
  const { data: popularUsers, isLoading: loadingPopular } = useQuery({
    queryKey: ['popular-users'],
    queryFn: async () => {
      const { data: avatars } = await supabase
        .from('avatar_state')
        .select('user_id, total_xp')
        .order('total_xp', { ascending: false })
        .limit(30);

      if (!avatars) return [];

      const users = await Promise.all(avatars.map(async (a: any) => {
        const [profileRes, configRes, followersRes] = await Promise.all([
          supabase.from('users').select('username, is_public').eq('user_id', a.user_id).single(),
          supabase.from('avatar_config').select('*').eq('user_id', a.user_id).single(),
          supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', a.user_id),
        ]);
        const totalXP = a.total_xp ?? 0;
        const attrs: Record<string, number> = {};
        for (const attr of ATTRIBUTES) attrs[attr] = (a as any)[attr] ?? 0;
        return {
          userId: a.user_id,
          username: profileRes.data?.username ?? 'Usuario',
          totalXP,
          level: getLevelFromXP(totalXP),
          attrs,
          avatarConfig: configRes.data,
          followers: (followersRes as any).count ?? 0,
        };
      }));

      return users
        .filter(u => u.username !== 'Usuario')
        .map((u, i) => ({ ...u, rank: i + 1 }));
    },
    enabled: tab === 'popular',
  });

  const followMutation = useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user!.id).eq('following_id', userId);
        toast.success('Dejaste de seguir');
      } else {
        await supabase.from('follows').insert({ follower_id: user!.id, following_id: userId });
        toast.success('¡Ahora los sigues!');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following-ids'] });
      queryClient.invalidateQueries({ queryKey: ['following-users'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const currentList = tab === 'groups' ? groupUsers : tab === 'following' ? followingUsers : popularUsers;
  const isLoading = tab === 'groups' ? loadingGroups : tab === 'following' ? loadingFollowing : loadingPopular;

  return (
    <MobileLayout>
      <div className="pb-24 overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-10 pb-3">
          <h1 className="text-xl font-bold text-foreground">Comunidad</h1>
          <p className="text-sm text-muted-foreground">Tu círculo de Aura</p>
        </div>

        {/* Tabs */}
        <div className="flex px-5 gap-1 pb-4">
          <button
            onClick={() => setTab('following')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
              tab === 'following' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            Siguiendo
          </button>
          <button
            onClick={() => setTab('groups')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
              tab === 'groups' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            Grupos
          </button>
          <button
            onClick={() => setTab('popular')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
              tab === 'popular' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            🌍 Populares
          </button>
        </div>

        {/* Stats bar */}
        {tab === 'groups' && groupUsers && groupUsers.length > 0 && (
          <div className="mx-5 mb-4 p-3 bg-card border border-border rounded-xl flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">
              {groupUsers.length} personas en tus grupos ·
              Top: <span className="font-semibold text-foreground">{groupUsers[0]?.username}</span> con {groupUsers[0]?.totalXP.toLocaleString()} XP
            </span>
          </div>
        )}

        {/* List */}
        <div className="px-5 space-y-2.5">
          {isLoading && (
            <div className="text-center py-12 text-muted-foreground text-sm animate-pulse">
              Cargando...
            </div>
          )}

          {!isLoading && (!currentList || currentList.length === 0) && (
            <div className="text-center py-16 space-y-3">
              {tab === 'groups' && <>
                <p className="text-4xl">👥</p>
                <p className="text-sm font-semibold text-foreground">Sin miembros en tus grupos</p>
                <p className="text-xs text-muted-foreground">Invita amigos a unirse a tus grupos</p>
              </>}
              {tab === 'following' && <>
                <p className="text-4xl">🔍</p>
                <p className="text-sm font-semibold text-foreground">No sigues a nadie aún</p>
                <p className="text-xs text-muted-foreground">Explora populares para encontrar usuarios</p>
              </>}
              {tab === 'popular' && <>
                <p className="text-4xl">🌍</p>
                <p className="text-sm font-semibold text-foreground">Sin usuarios todavía</p>
              </>}
            </div>
          )}

          {currentList?.map((u: any) => (
            <UserCard
              key={u.userId}
              u={u}
              currentUserId={user!.id}
              isFollowing={followingIds?.includes(u.userId) ?? false}
              onFollowToggle={(userId, isFollowing) =>
                followMutation.mutate({ userId, isFollowing })
              }
            />
          ))}
        </div>
      </div>
      <BottomNav />
    </MobileLayout>
  );
}
