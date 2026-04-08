import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { Swords, Check, X, Trophy, Clock, Plus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getLevelFromXP, ATTRIBUTES, ATTRIBUTE_LABELS } from '@/lib/constants';
import AvatarSVG from '@/components/AvatarSVG';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-500',
    active: 'bg-green-500/20 text-green-500',
    finished: 'bg-secondary text-muted-foreground',
    declined: 'bg-destructive/20 text-destructive',
  };
  const labels: Record<string, string> = {
    pending: 'Pendiente', active: 'En curso', finished: 'Terminado', declined: 'Rechazado',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default function DuelsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [discipline, setDiscipline] = useState('General');
  const [duration, setDuration] = useState<'week' | 'month'>('week');

  const { data: duels, isLoading } = useQuery({
    queryKey: ['duels', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('duels').select('*')
        .or(`challenger_id.eq.${user!.id},challenged_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });
      if (!data || data.length === 0) return [];
      const enriched = await Promise.all(data.map(async (d: any) => {
        const otherId = d.challenger_id === user!.id ? d.challenged_id : d.challenger_id;
        const [otherProfile, otherAvatar, otherConfig, myAvatar] = await Promise.all([
          supabase.from('users').select('username').eq('user_id', otherId).single(),
          supabase.from('avatar_state').select('*').eq('user_id', otherId).single(),
          supabase.from('avatar_config').select('*').eq('user_id', otherId).single(),
          supabase.from('avatar_state').select('total_xp').eq('user_id', user!.id).single(),
        ]);
        return {
          ...d,
          isChallenger: d.challenger_id === user!.id,
          otherId,
          otherUsername: otherProfile.data?.username ?? 'Usuario',
          otherAvatar: otherAvatar.data,
          otherConfig: otherConfig.data,
          myXP: myAvatar.data?.total_xp ?? 0,
          otherXP: otherAvatar.data?.total_xp ?? 0,
        };
      }));
      return enriched;
    },
    enabled: !!user,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['user-search', searchUser],
    queryFn: async () => {
      if (searchUser.trim().length < 2) return [];
      const { data } = await supabase.from('users').select('user_id, username')
        .ilike('username', `%${searchUser}%`).neq('user_id', user!.id).limit(5);
      return data ?? [];
    },
    enabled: searchUser.trim().length >= 2,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ duelId, accept }: { duelId: string; accept: boolean }) => {
      if (accept) {
        const endsAt = new Date();
        const duel = duels?.find((d: any) => d.id === duelId);
        if (duel?.duration === 'month') endsAt.setMonth(endsAt.getMonth() + 1);
        else endsAt.setDate(endsAt.getDate() + 7);
        await supabase.from('duels').update({ status: 'active', ends_at: endsAt.toISOString() }).eq('id', duelId);
        toast.success('¡Duelo aceptado! ⚔️');
      } else {
        await supabase.from('duels').update({ status: 'declined' }).eq('id', duelId);
        toast.info('Duelo rechazado');
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['duels'] }),
  });

  const createDuelMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error('Selecciona un usuario');
      await supabase.from('duels').insert({
        challenger_id: user!.id, challenged_id: selectedUserId,
        discipline, duration, status: 'pending',
      });
    },
    onSuccess: () => {
      toast.success(`¡Reto enviado a ${selectedUsername}! ⚔️`);
      setCreateOpen(false);
      setSearchUser(''); setSelectedUserId(''); setSelectedUsername('');
      setDiscipline('General'); setDuration('week');
      queryClient.invalidateQueries({ queryKey: ['duels'] });
    },
    onError: (e: any) => toast.error(e.message ?? 'Error creando duelo'),
  });

  const pending  = duels?.filter((d: any) => d.status === 'pending') ?? [];
  const active   = duels?.filter((d: any) => d.status === 'active') ?? [];
  const finished = duels?.filter((d: any) => ['finished','declined'].includes(d.status)) ?? [];

  const DuelCard = ({ duel }: { duel: any }) => {
    const attrs: Record<string, number> = {};
    for (const a of ATTRIBUTES) attrs[a] = duel.otherAvatar?.[a] ?? 0;
    const otherLevel = getLevelFromXP(duel.otherXP);
    const myLevel = getLevelFromXP(duel.myXP);
    const durationLabel = duel.duration === 'month' ? '1 mes' : '1 semana';

    return (
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-semibold text-foreground">{duel.discipline}</span>
            <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />{durationLabel}
            </span>
          </div>
          <StatusBadge status={duel.status} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full bg-secondary border-2 border-primary flex items-center justify-center">
              <span className="text-xs font-bold text-muted-foreground">TÚ</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Lv.{myLevel}</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-orange-500">VS</span>
            {duel.status === 'active' && duel.ends_at && (
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(duel.ends_at), { locale: es })}
              </div>
            )}
          </div>
          <button className="flex-1 flex flex-col items-center gap-1" onClick={() => navigate(`/profile/${duel.otherId}`)}>
            <div className="w-14 h-14 rounded-full bg-secondary overflow-hidden border-2 border-border">
              {duel.otherConfig
                ? <AvatarSVG config={duel.otherConfig} attributes={attrs} size={56} />
                : <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">{duel.otherUsername.slice(0,2).toUpperCase()}</span>
                  </div>}
            </div>
            <p className="text-[10px] font-semibold text-foreground truncate max-w-16">{duel.otherUsername}</p>
            <p className="text-[10px] text-muted-foreground">Lv.{otherLevel}</p>
          </button>
        </div>

        {duel.status === 'pending' && !duel.isChallenger && (
          <div className="flex gap-2 pt-1">
            <button onClick={() => respondMutation.mutate({ duelId: duel.id, accept: true })}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              <Check className="w-4 h-4" /> Aceptar
            </button>
            <button onClick={() => respondMutation.mutate({ duelId: duel.id, accept: false })}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-secondary text-muted-foreground text-sm">
              <X className="w-4 h-4" /> Rechazar
            </button>
          </div>
        )}
        {duel.status === 'pending' && duel.isChallenger && (
          <p className="text-xs text-muted-foreground text-center">Esperando respuesta de {duel.otherUsername}...</p>
        )}
        {duel.status === 'active' && (
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Gana quien más XP acumule en <span className="font-semibold text-foreground">{duel.discipline}</span></p>
          </div>
        )}
        {duel.status === 'finished' && (
          <div className={`rounded-xl p-3 text-center ${duel.winner_id === user!.id ? 'bg-primary/10' : 'bg-secondary/50'}`}>
            <p className="text-sm font-bold">{duel.winner_id === user!.id ? '🏆 ¡Ganaste!' : `${duel.otherUsername} ganó`}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <MobileLayout>
      <div className="pb-24 overflow-y-auto">
        <div className="px-5 pt-10 pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Swords className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold text-foreground">Duelos</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Retos 1 vs 1</p>
          </div>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold">
            <Plus className="w-4 h-4" /> Retar
          </button>
        </div>

        {isLoading && <div className="text-center py-12 text-muted-foreground text-sm animate-pulse">Cargando duelos...</div>}

        {!isLoading && (!duels || duels.length === 0) && (
          <div className="text-center py-16 space-y-3 px-8">
            <Swords className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-sm font-semibold text-foreground">Sin duelos todavía</p>
            <p className="text-xs text-muted-foreground">Toca "Retar" para desafiar a alguien</p>
          </div>
        )}

        <div className="px-4 space-y-6">
          {pending.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Pendientes ({pending.length})
              </p>
              {pending.map((d: any) => <DuelCard key={d.id} duel={d} />)}
            </div>
          )}
          {active.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-green-500 uppercase tracking-wide flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5" /> En curso ({active.length})
              </p>
              {active.map((d: any) => <DuelCard key={d.id} duel={d} />)}
            </div>
          )}
          {finished.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> Historial
              </p>
              {finished.map((d: any) => <DuelCard key={d.id} duel={d} />)}
            </div>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-[350px]">
          <DialogHeader><DialogTitle>⚔️ Nuevo Duelo</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Buscar oponente</label>
              <input className="w-full h-10 px-3 rounded-xl bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nombre de usuario..."
                value={searchUser}
                onChange={e => { setSearchUser(e.target.value); setSelectedUserId(''); }} />
              {searchResults && searchResults.length > 0 && !selectedUserId && (
                <div className="mt-1 bg-card border border-border rounded-xl overflow-hidden">
                  {searchResults.map((u: any) => (
                    <button key={u.user_id} className="w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors"
                      onClick={() => { setSelectedUserId(u.user_id); setSelectedUsername(u.username); setSearchUser(u.username); }}>
                      {u.username}
                    </button>
                  ))}
                </div>
              )}
              {selectedUserId && <p className="text-xs text-primary mt-1">✓ {selectedUsername} seleccionado</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Disciplina del reto</label>
              <select className="w-full h-10 px-3 rounded-xl bg-secondary text-foreground text-sm focus:outline-none"
                value={discipline} onChange={e => setDiscipline(e.target.value)}>
                <option value="General">General (XP total)</option>
                {Object.entries(ATTRIBUTE_LABELS).map(([k, v]) => (
                  <option key={k} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Duración</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setDuration('week')}
                  className={`h-12 rounded-xl border text-sm font-semibold flex flex-col items-center justify-center transition-all ${duration === 'week' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
                  <Calendar className="w-4 h-4 mb-0.5" />1 Semana
                </button>
                <button onClick={() => setDuration('month')}
                  className={`h-12 rounded-xl border text-sm font-semibold flex flex-col items-center justify-center transition-all ${duration === 'month' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
                  <Calendar className="w-4 h-4 mb-0.5" />1 Mes
                </button>
              </div>
            </div>
            <Button onClick={() => createDuelMutation.mutate()} disabled={!selectedUserId || createDuelMutation.isPending} className="w-full">
              {createDuelMutation.isPending ? 'Enviando...' : '⚔️ Enviar reto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </MobileLayout>
  );
}
