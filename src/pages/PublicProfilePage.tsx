import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import AvatarSVG from '@/components/AvatarSVG';
import { ArrowLeft, Heart, UserPlus, UserMinus, Swords, Video } from 'lucide-react';
import { getLevelFromXP, LEVEL_NAMES, ATTRIBUTES, ATTRIBUTE_LABELS, ATTRIBUTE_COLORS, type AttributeName } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPetProfile, STAGE_NAMES } from '@/lib/pet-evolution';
import PetSVG from '@/components/PetSVG';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOwn = user?.id === userId;

  const { data: profile } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('*').eq('user_id', userId!).single();
      return data;
    },
    enabled: !!userId,
  });

  const { data: avatar } = useQuery({
    queryKey: ['public-avatar', userId],
    queryFn: async () => {
      const { data } = await supabase.from('avatar_state').select('*').eq('user_id', userId!).single();
      return data;
    },
    enabled: !!userId,
  });

  const { data: avatarConfig } = useQuery({
    queryKey: ['public-avatar-config', userId],
    queryFn: async () => {
      const { data } = await supabase.from('avatar_config').select('*').eq('user_id', userId!).single();
      return data;
    },
    enabled: !!userId,
  });

  const { data: activities } = useQuery({
    queryKey: ['public-activities', userId],
    queryFn: async () => {
      const { data } = await supabase.from('activities').select('*, activity_types(name, emoji)')
        .eq('user_id', userId!).order('completed_at', { ascending: false }).limit(30);
      return data ?? [];
    },
    enabled: !!userId,
  });

  const { data: uploads } = useQuery({
    queryKey: ['public-uploads', userId],
    queryFn: async () => {
      const { data } = await supabase.from('uploads').select('*').eq('user_id', userId!)
        .order('created_at', { ascending: false }).limit(60);
      return data ?? [];
    },
    enabled: !!userId,
  });

  const { data: followData, refetch: refetchFollow } = useQuery({
    queryKey: ['follow-status', user?.id, userId],
    queryFn: async () => {
      const [followersRes, followingRes, isFollowingRes] = await Promise.all([
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId!),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId!),
        user ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId!).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      return {
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
        isFollowing: !!(isFollowingRes as any).data,
      };
    },
    enabled: !!userId,
  });

  const { data: likesData } = useQuery({
    queryKey: ['activity-likes', userId],
    queryFn: async () => {
      const actIds = (activities ?? []).map((a: any) => a.id);
      if (actIds.length === 0) return {};
      const { data } = await supabase.from('activity_likes').select('activity_id, user_id').in('activity_id', actIds);
      const map: Record<string, string[]> = {};
      data?.forEach((l: any) => {
        if (!map[l.activity_id]) map[l.activity_id] = [];
        map[l.activity_id].push(l.user_id);
      });
      return map;
    },
    enabled: (activities?.length ?? 0) > 0,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (followData?.isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId!);
        toast.success('Dejaste de seguir');
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: userId! });
        toast.success('¡Siguiendo a ' + (profile?.username ?? 'este usuario') + '!');
      }
    },
    onSuccess: () => { refetchFollow(); queryClient.invalidateQueries({ queryKey: ['feed'] }); },
  });

  const likeMutation = useMutation({
    mutationFn: async (activityId: string) => {
      if (!user) return;
      const liked = (likesData?.[activityId] ?? []).includes(user.id);
      if (liked) {
        await supabase.from('activity_likes').delete().eq('activity_id', activityId).eq('user_id', user.id);
      } else {
        await supabase.from('activity_likes').insert({ activity_id: activityId, user_id: user.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activity-likes', userId] }),
  });

  const challengeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !userId) return;
      await supabase.from('duels').insert({
        challenger_id: user.id, challenged_id: userId,
        discipline: 'General', duration: 'week', status: 'pending',
      });
    },
    onSuccess: () => toast.success(`¡Reto enviado a ${profile?.username}! ⚔️`),
    onError: () => toast.error('Error enviando el reto'),
  });

  if (!profile || !avatar) return (
    <MobileLayout>
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground text-sm animate-pulse">Cargando perfil...</p>
      </div>
    </MobileLayout>
  );

  const level = getLevelFromXP(avatar.total_xp);
  const attrs: Record<string, number> = {};
  for (const a of ATTRIBUTES) attrs[a] = (avatar as any)[a] ?? 0;

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

  const pet = getPetProfile(attrs, avatar.total_xp);

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('activity-uploads').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <MobileLayout>
      <div className="pb-24 overflow-y-auto">
        <div className="flex items-center gap-3 px-5 pt-10 pb-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-foreground flex-1 truncate">
            {profile.display_name || profile.username}
          </h1>
          {!isOwn && user && (
            <button onClick={() => challengeMutation.mutate()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-orange-500/50 text-orange-500 text-xs font-semibold">
              <Swords className="w-3.5 h-3.5" /> Retar
            </button>
          )}
        </div>

        <div className="px-5 pb-4">
          <div className="flex items-start gap-4">
            <div className="rounded-full border-2 border-primary p-0.5 cursor-pointer flex-shrink-0"
              onClick={isOwn ? () => navigate('/profile') : undefined}>
              <div className="w-20 h-20 rounded-full overflow-hidden bg-card">
                <AvatarSVG config={fullAvatarConfig} attributes={attrs} size={80} showAura />
              </div>
            </div>
            <div className="flex-1 pt-2">
              <div className="flex gap-4 justify-around mb-3">
                <div className="text-center">
                  <p className="text-base font-bold text-foreground">{activities?.length ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">actividades</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-foreground">{followData?.followers ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">seguidores</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-foreground">{followData?.following ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">siguiendo</p>
                </div>
              </div>
              {!isOwn && user && (
                <button onClick={() => followMutation.mutate()}
                  className={`w-full py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    followData?.isFollowing
                      ? 'bg-secondary text-foreground border border-border'
                      : 'bg-primary text-primary-foreground'
                  }`}>
                  {followData?.isFollowing
                    ? <span className="flex items-center justify-center gap-1.5"><UserMinus className="w-4 h-4" /> Siguiendo</span>
                    : <span className="flex items-center justify-center gap-1.5"><UserPlus className="w-4 h-4" /> Seguir</span>}
                </button>
              )}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm font-semibold text-foreground">{profile.username}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Nivel {level} — {LEVEL_NAMES[level]} · {avatar.total_xp.toLocaleString()} XP
            </p>
          </div>
        </div>

        <Tabs defaultValue="feed">
          <TabsList className="w-full bg-transparent border-t border-b border-border rounded-none h-10">
            <TabsTrigger value="feed" className="flex-1 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">📋 Actividades</TabsTrigger>
            <TabsTrigger value="gallery" className="flex-1 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">🖼️ Galería</TabsTrigger>
            <TabsTrigger value="evolution" className="flex-1 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">⚡ Evolución</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="px-4 pt-3 space-y-3">
            {activities?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin actividades aún</p>}
            {activities?.map((a: any) => {
              const actUploads = uploads?.filter((u: any) => u.activity_id === a.id) ?? [];
              const likes = likesData?.[a.id] ?? [];
              const liked = likes.includes(user?.id ?? '');
              return (
                <div key={a.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="text-xl">{a.activity_types?.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{a.activity_types?.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {a.duration_minutes} min · <span className="text-accent font-semibold">+{a.xp_earned} XP</span> · {formatDistanceToNow(new Date(a.completed_at), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                  {actUploads.length > 0 && (
                    <div className="w-full aspect-square bg-secondary">
                      {actUploads[0].media_type === 'photo'
                        ? <img src={getPublicUrl(actUploads[0].storage_path)} alt="" className="w-full h-full object-cover" />
                        : <video src={getPublicUrl(actUploads[0].storage_path)} className="w-full h-full object-cover" controls />}
                    </div>
                  )}
                  {a.note && <p className="px-3 pt-2 text-xs text-muted-foreground italic">"{a.note}"</p>}
                  {user && (
                    <div className="flex items-center gap-4 px-3 py-2 border-t border-border/40">
                      <button onClick={() => likeMutation.mutate(a.id)}
                        className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors">
                        <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                        {likes.length > 0 && <span className="text-xs">{likes.length}</span>}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="gallery" className="pt-1">
            {(!uploads || uploads.length === 0)
              ? <p className="text-sm text-muted-foreground text-center py-8">Sin evidencias aún</p>
              : <div className="grid grid-cols-3 gap-0.5">
                  {uploads.map((u: any) => (
                    <div key={u.id} className="aspect-square bg-secondary overflow-hidden">
                      {u.media_type === 'photo'
                        ? <img src={getPublicUrl(u.storage_path)} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-secondary">
                            <Video className="w-6 h-6 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Video</span>
                          </div>}
                    </div>
                  ))}
                </div>}
          </TabsContent>

          <TabsContent value="evolution" className="px-4 pt-4 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl">
              <AvatarSVG config={fullAvatarConfig} attributes={attrs} size={90} showAura />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Avatar actual</p>
                <p className="text-xs text-muted-foreground">Nivel {level} — {LEVEL_NAMES[level]}</p>
                <p className="text-xs text-accent font-semibold mt-1">{avatar.total_xp.toLocaleString()} XP totales</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl">
              <PetSVG pet={pet} size={90} animate />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{pet.name}</p>
                <p className="text-xs text-muted-foreground">{STAGE_NAMES[pet.stage]} · {pet.description}</p>
              </div>
            </div>
            <div className="p-4 bg-card border border-border rounded-2xl space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Disciplinas</p>
              {ATTRIBUTES.map((attr) => {
                const val = attrs[attr] ?? 0;
                return (
                  <div key={attr} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20 truncate">{ATTRIBUTE_LABELS[attr]}</span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(val, 100)}%`, backgroundColor: ATTRIBUTE_COLORS[attr] }} />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-6 text-right">{val}</span>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </MobileLayout>
  );
}
