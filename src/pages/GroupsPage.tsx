import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { Users, Plus, LogIn, Crown, Lock, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

  const { data: myGroups, isLoading } = useQuery({
    queryKey: ['my-groups', user?.id],
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, role, groups(id, name, invite_code, is_public, created_by, created_at)')
        .eq('user_id', user!.id);

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
      return groups;
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
    const code = generateInviteCode();
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name: groupName.trim(), invite_code: code, created_by: user.id, is_public: isPublic })
      .select()
      .single();

    if (error) {
      toast.error('Error creando grupo');
      setLoading(false);
      return;
    }

    await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      role: 'creator',
    });

    queryClient.invalidateQueries({ queryKey: ['my-groups'] });
    toast.success(`Grupo creado. Código: ${code}`);
    setGroupName('');
    setCreateOpen(false);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    if ((myGroups?.length ?? 0) >= 3) {
      toast.error('Máximo 3 grupos permitidos');
      return;
    }
    setLoading(true);
    const { data: group } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', joinCode.trim().toUpperCase())
      .single();

    if (!group) {
      toast.error('Código no encontrado');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      role: 'member',
    });

    if (error) {
      toast.error(error.code === '23505' ? 'Ya eres miembro' : 'Error uniéndote');
      setLoading(false);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['my-groups'] });
    toast.success('¡Te uniste al grupo!');
    setJoinCode('');
    setJoinOpen(false);
    setLoading(false);
  };

  return (
    <MobileLayout>
      <div className="relative pb-24 overflow-y-auto">
        <div className="px-5 pt-10 pb-4">
          <h1 className="text-xl font-bold text-foreground">Grupos</h1>
          <p className="text-sm text-muted-foreground">Compite con amigos</p>
        </div>

        {/* Action buttons */}
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
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Nombre del grupo"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={30}
                />
                <div className="flex items-center justify-between">
                  <Label htmlFor="public-toggle" className="text-sm text-muted-foreground flex items-center gap-2">
                    {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {isPublic ? 'Público' : 'Privado'}
                  </Label>
                  <Switch id="public-toggle" checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
                <Button onClick={handleCreate} disabled={loading || !groupName.trim()} className="w-full">
                  {loading ? 'Creando...' : 'Crear'}
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
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Código (ej: AURA-X7K2)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={9}
                />
                <Button onClick={handleJoin} disabled={loading || !joinCode.trim()} className="w-full">
                  {loading ? 'Uniéndose...' : 'Unirse'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Groups list */}
        <div className="px-5 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Cargando...</div>
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
