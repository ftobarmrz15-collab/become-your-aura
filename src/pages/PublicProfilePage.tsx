import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import AvatarSVG from '@/components/AvatarSVG';
import { ArrowLeft, Image as ImageIcon, Video } from 'lucide-react';
import { getLevelFromXP, LEVEL_NAMES, ATTRIBUTES, ATTRIBUTE_LABELS, ATTRIBUTE_COLORS, type AttributeName } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
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
      const { data } = await supabase
        .from('activities')
        .select('*, activity_types(name, emoji)')
        .eq('user_id', userId!)
        .order('completed_at', { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!userId,
  });

  const { data: uploads } = useQuery({
    queryKey: ['public-uploads', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('uploads')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(30);
      return data ?? [];
    },
    enabled: !!userId,
  });

  if (!profile || !avatar) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </MobileLayout>
    );
  }

  const level = getLevelFromXP(avatar.total_xp);
  const attrs: Record<string, number> = {};
  for (const a of ATTRIBUTES) attrs[a] = (avatar as any)[a] ?? 0;

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('activity-uploads').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <MobileLayout>
      <div className="pb-24 overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-10 pb-2 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">
            {isOwn ? 'Mi perfil' : profile.display_name || profile.username}
          </h1>
        </div>

        {/* Avatar + info */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="bg-card rounded-2xl border border-border p-3">
            <AvatarSVG
              config={{
                skin_tone: avatarConfig?.skin_tone ?? 'medium',
                hair_style: avatarConfig?.hair_style ?? 'short',
                hair_color: avatarConfig?.hair_color ?? 'black',
                outfit: avatarConfig?.outfit ?? 'casual',
                facial_hair: avatarConfig?.facial_hair ?? 'none',
                eye_color: avatarConfig?.eye_color ?? 'brown',
              }}
              attributes={attrs}
              size={140}
            />
          </div>
          <p className="text-xl font-bold text-foreground">{profile.display_name || profile.username}</p>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              Nivel {level} — {LEVEL_NAMES[level]}
            </span>
            <span className="text-sm font-bold text-accent">{avatar.total_xp} XP</span>
          </div>
        </div>

        {/* Attributes */}
        <div className="px-5 space-y-2 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Disciplinas</p>
          {ATTRIBUTES.map((attr) => {
            const val = attrs[attr] ?? 0;
            return (
              <div key={attr} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 truncate">{ATTRIBUTE_LABELS[attr]}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(val, 100)}%`,
                      backgroundColor: ATTRIBUTE_COLORS[attr],
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{val}</span>
              </div>
            );
          })}
        </div>

        {/* Tabs: activities + gallery */}
        <Tabs defaultValue="feed" className="px-5">
          <TabsList className="w-full bg-card/50">
            <TabsTrigger value="feed" className="text-xs flex-1">Actividades</TabsTrigger>
            <TabsTrigger value="gallery" className="text-xs flex-1">Galería</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-3 space-y-2">
            {activities?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Sin actividades aún</p>
            )}
            {activities?.map((a: any) => {
              const actUploads = uploads?.filter((u: any) => u.activity_id === a.id) ?? [];
              return (
                <div key={a.id} className="p-3 rounded-xl bg-card border border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{a.activity_types?.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.activity_types?.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {a.duration_minutes} min · +{a.xp_earned} XP · {new Date(a.completed_at).toLocaleDateString('es')}
                      </p>
                    </div>
                  </div>
                  {a.note && <p className="text-xs text-muted-foreground italic">"{a.note}"</p>}
                  {actUploads.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {actUploads.map((u: any) => (
                        <div key={u.id} className="w-16 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                          {u.media_type === 'photo' ? (
                            <img src={getPublicUrl(u.storage_path)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="gallery" className="mt-3">
            {(!uploads || uploads.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-6">Sin evidencias aún</p>
            )}
            <div className="grid grid-cols-3 gap-1.5">
              {uploads?.map((u: any) => (
                <div key={u.id} className="aspect-square rounded-lg overflow-hidden bg-secondary">
                  {u.media_type === 'photo' ? (
                    <img src={getPublicUrl(u.storage_path)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <Video className="w-6 h-6 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Video</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </MobileLayout>
  );
}
