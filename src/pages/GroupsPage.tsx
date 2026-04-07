import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { Users, Plus, LogIn, Crown, Lock, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'AURA-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function GroupsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const invalidateGroupQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['my-groups'] });
  };

  const { data: myGroups, isLoading } = useQuery({
    queryKey: ['my-groups', user?.id],
    queryFn: async () => {
      const { data: memberships, error: memErr } = await supabase
        .from('group_members')
        .select('group_id, role, groups(id, name, invite_code, is_public, created_by, created_at)')
        .eq('user_id', user!.id);

      if (memErr) throw memErr;
      if (!memberships) return [];

      const groups = await Promise.all(
        memberships.map(async (m: any) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', m.group_id);
          return { ...m.groups, role: m.role, member_count: count ?? 0 };
        })
      );
      return groups.filter(Boolean);
    },
    enabled: !!user,
  });

  const handleCreate = async () => {
    if (!user || !groupName.trim()) return;
    if ((myGroups?.length ?? 0) >= 3) {
      toast.error('Máximo 3 grupos permitidos');
      return;
    }

    setLoading(true);

    try {
      // Try RPC first, fallback to direct insert
      let groupId: string | null = null;
      let inviteCode = generateInviteCode();

      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_group_with_code', {
          _name: groupName.trim(),
          _is_public: isPublic,
        });
        if (!rpcError && rpcData) {
          const group = Array.isArray(rpcData) ? rpcData[0] : rpcData;
          if (group?.id) {
            groupId = group.id;
            inviteCode = group.invite_code;
          }
        }
      } catch (_) { /* fallthrough to direct insert */ }

      if (!groupId) {
        // Direct insert fallback
        let attempts = 0;
        while (attempts < 10 && !groupId) {
          const { data: insertedGroup, error: insertError } = await supabase
            .from('groups')
            .insert({
              name: groupName.trim(),
              invite_code: inviteCode,
              created_by: user.id,
              is_public: isPublic,
            })
            .select('id, invite_code')
            .single();

          if (insertError) {
            if (insertError.code === '23505') {
              inviteCode = generateInviteCode();
              attempts++;
              continue;
            }
            throw insertError;
          }
          groupId = insertedGroup.id;
          inviteCode = insertedGroup.invite_code;
        }

        if (!groupId) throw new Error('No se pudo crear el grupo');

        const { error: memberError } = await supabase
          .from('group_members')
          .insert({ group_id: groupId, user_id: user.id, role: 'creator' });

        if (memberError) throw memberError;
      }

      invalidateGroupQueries();
      toast.success(`Grupo creado 🎉  Código: ${inviteCode}`);
      setGroupName('');
      setCreateOpen(false);
      navigate(`/groups/${groupId}`);
    } catch (error: any) {
      console.error('Error creando grupo:', error);
      toast.error(error?.message ?? 'Error creando grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    if ((myGroups?.length ?? 0) >= 3) {
      toast.error('Máximo 3 grupos permitidos');
      return;
    }

    setLoading(true);

    try {
      const code = joinCode.trim().toUpperCase();

      // Try RPC first
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('join_group_with_code', {
          _invite_code: code,
        });
        if (!rpcError && rpcData) {
          const joinedGroupId = Array.isArray(rpcData) ? rpcData[0] : rpcData;
          if (joinedGroupId) {
            invalidateGroupQueries();
            toast.success('¡Te uniste al grupo!');
            setJoinCode('');
            setJoinOpen(false);
            navigate(`/groups/${joinedGroupId}`);
            return;
          }
        }
      } catch (_) { /* fallthrough */ }

      // Direct join fallback
      const { data: group, error: findError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('invite_code', code)
        .single();

      if (findError || !group) throw new Error('Código de invitación no encontrado');

      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        toast.info('Ya eres miembro de este grupo');
        setJoinCode('');
        setJoinOpen(false);
        navigate(`/groups/${group.id}`);
        return;
      }

      const { error: joinError } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'member' });

      if (joinError) throw joinError;

      invalidateGroupQueries();
      toast.success(`¡Te uniste a ${group.name}!`);
      setJoinCode('');
      setJoinOpen(false);
      navigate(`/groups/${group.id}`);
    } catch (error: any) {
      console.error('Error uniéndose:', error);
      toast.error(error?.message ?? 'Error uniéndote al grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <div className="relative pb-24 overflow-y-auto">
        <div className="px-5 pt-10 pb-4">
          <h1 className="text-xl font-bold text-foreground">Grupos</h1>
          <p className="text-sm text-muted-foreground">Compite con amigos</p>
        </div>

        <div className="px-5 flex gap-3 pb-4">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="flex-1 gap-2">
                <Plus className="w-4 h-4" /> Crear grupo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[350px]">
              <DialogHeader>
                <DialogTitle>Crear grupo</DialogTitle>
                <DialogDescription>
                  Crea un grupo y comparte el código con tus amigos.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Nombre del grupo"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={30}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleCreate()}
                />
                <div className="flex items-center justify-between">
                  <Label htmlFor="public-toggle" className="text-sm text-muted-foreground flex items-center gap-2">
                    {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {isPublic ? 'Público' : 'Privado'}
                  </Label>
                  <Switch id="public-toggle" checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
                <Button onClick={handleCreate} disabled={loading || !groupName.trim()} className="w-full">
                  {loading ? 'Creando...' : 'Crear grupo'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 gap-2">
                <LogIn className="w-4 h-4" /> Unirse
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[350px]">
              <DialogHeader>
                <DialogTitle>Unirse a grupo</DialogTitle>
                <DialogDescription>
                  Ingresa el código de invitación.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Código (ej: AURA-X7K2)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={9}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleJoin()}
                />
                <Button onClick={handleJoin} disabled={loading || !joinCode.trim()} className="w-full">
                  {loading ? 'Uniéndose...' : 'Unirse al grupo'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="px-5 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Cargando grupos...</div>
          ) : myGroups && myGroups.length > 0 ? (
            myGroups.map((g: any) => (
              <button
                key={g.id}
                onClick={() => navigate(`/groups/${g.id}`)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-border text-left hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{g.name}</p>
                    {g.role === 'creator' && <Crown className="w-3 h-3 text-yellow-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{g.member_count} miembros · {g.invite_code}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {g.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </span>
              </button>
            ))
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Sin grupos todavía</p>
              <p className="text-xs text-muted-foreground mt-1">Crea uno o únete con un código</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </MobileLayout>
  );
}
