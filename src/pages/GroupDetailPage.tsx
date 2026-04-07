import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { ArrowLeft, Crown, Copy, LogOut, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ATTRIBUTES, ATTRIBUTE_LABELS, ATTRIBUTE_COLORS, getLevelFromXP, type AttributeName } from '@/lib/constants';

function getMedal(index: number) {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `${index + 1}`;
}

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<'total_xp' | AttributeName>('total_xp');

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('*').eq('id', groupId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });

  const { data: members } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const { data: memberships, error: membershipsError } = await supabase
        .from('group_members')
        .select('user_id, role, joined_at')
        .eq('group_id', groupId!);

      if (membershipsError) throw membershipsError;

      if (!memberships?.length) return [];

      const userIds = memberships.map((m: any) => m.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('users')
        .select('user_id, username, display_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const { data: avatars, error: avatarsError } = await supabase
        .from('avatar_state')
        .select('*')
        .in('user_id', userIds);

      if (avatarsError) throw avatarsError;

      const { data: configs, error: configsError } = await supabase
        .from('avatar_config')
        .select('user_id, avatar_url')
        .in('user_id', userIds);

      if (configsError) throw configsError;

      return memberships.map((m: any) => {
        const profile = profiles?.find((p: any) => p.user_id === m.user_id);
        const avatar = avatars?.find((a: any) => a.user_id === m.user_id);
        const config = configs?.find((c: any) => c.user_id === m.user_id);
        return { ...m, profile, avatar, avatar_url: config?.avatar_url };
      });
    },
    enabled: !!groupId,
  });

  const isCreator = group?.created_by === user?.id;

  const sortedMembers = [...(members ?? [])].sort((a: any, b: any) => {
    if (sortBy === 'total_xp') return (b.avatar?.total_xp ?? 0) - (a.avatar?.total_xp ?? 0);
    return (b.avatar?.[sortBy] ?? 0) - (a.avatar?.[sortBy] ?? 0);
  });

  const handleCopyCode = () => {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code);
      toast.success('Código copiado');
    }
  };

  const handleLeave = async () => {
    if (!user || !groupId) return;
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['my-groups'] });
    toast.success('Saliste del grupo');
    navigate('/groups');
  };

  const handleDelete = async () => {
    if (!groupId) return;
    await supabase.from('groups').delete().eq('id', groupId);
    queryClient.invalidateQueries({ queryKey: ['my-groups'] });
    toast.success('Grupo eliminado');
    navigate('/groups');
  };

  const handleKick = async (memberId: string) => {
    if (!groupId) return;
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', memberId);
    queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
    toast.success('Miembro removido');
  };

  if (!group) return null;

  return (
    <MobileLayout>
      <div className="relative pb-24 overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-10 pb-2 flex items-center gap-3">
          <button onClick={() => navigate('/groups')} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{group.name}</h1>
            <p className="text-xs text-muted-foreground">{members?.length ?? 0} miembros</p>
          </div>
          <button onClick={handleCopyCode} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-card border border-border text-xs text-muted-foreground">
            <Copy className="w-3 h-3" /> {group.invite_code}
          </button>
        </div>

        {/* Ranking tabs */}
        <div className="px-5 pt-3">
          <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <TabsList className="w-full overflow-x-auto flex-nowrap justify-start bg-card/50 h-auto p-1">
              <TabsTrigger value="total_xp" className="text-xs px-3 py-1.5 shrink-0">General</TabsTrigger>
              {ATTRIBUTES.map((attr) => (
                <TabsTrigger key={attr} value={attr} className="text-xs px-3 py-1.5 shrink-0">
                  {ATTRIBUTE_LABELS[attr]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Ranking list */}
        <div className="px-5 pt-4 space-y-2">
          {sortedMembers.map((m: any, i: number) => {
            const xp = sortBy === 'total_xp' ? (m.avatar?.total_xp ?? 0) : (m.avatar?.[sortBy] ?? 0);
            const level = getLevelFromXP(m.avatar?.total_xp ?? 0);
            const initials = m.profile?.username?.slice(0, 2)?.toUpperCase() ?? '??';

            return (
              <div key={m.user_id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${i < 3 ? 'bg-card border-primary/20' : 'bg-card border-border'}`}>
                <span className="w-7 text-center text-sm font-bold">{getMedal(i)}</span>
                <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">{initials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-foreground truncate">{m.profile?.username ?? 'Usuario'}</p>
                    {m.role === 'creator' && <Crown className="w-3 h-3 text-yellow-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground">Lv.{level}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent">{xp} XP</p>
                  {sortBy !== 'total_xp' && (
                    <p className="text-[10px] text-muted-foreground">{ATTRIBUTE_LABELS[sortBy as AttributeName]}</p>
                  )}
                </div>
                {isCreator && m.user_id !== user?.id && (
                  <button onClick={() => handleKick(m.user_id)} className="text-destructive/60 hover:text-destructive p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-5 pt-6 space-y-2">
          {isCreator ? (
            <Button variant="destructive" onClick={handleDelete} className="w-full gap-2">
              <Trash2 className="w-4 h-4" /> Eliminar grupo
            </Button>
          ) : (
            <Button variant="outline" onClick={handleLeave} className="w-full gap-2 text-destructive border-destructive/30">
              <LogOut className="w-4 h-4" /> Salir del grupo
            </Button>
          )}
        </div>
      </div>
      <BottomNav />
    </MobileLayout>
  );
}
