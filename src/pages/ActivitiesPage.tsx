import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { BottomNav } from '@/components/BottomNav';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data: activityTypes } = useQuery({
    queryKey: ['all-activity-types', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('activity_types').select('*');
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('user_favorites').select('activity_type_id').eq('user_id', user!.id);
      return data?.map(f => f.activity_type_id) ?? [];
    },
    enabled: !!user,
  });

  const filtered = activityTypes?.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const favTypes = filtered.filter(a => favorites?.includes(a.id));
  const otherTypes = filtered.filter(a => !favorites?.includes(a.id));

  const categoryColors: Record<string, string> = {
    combate: 'bg-attr-strength/20 text-attr-strength',
    arte: 'bg-attr-creativity/20 text-attr-creativity',
    movimiento: 'bg-attr-charisma/20 text-attr-charisma',
    aventura: 'bg-attr-courage/20 text-attr-courage',
    cuerpo: 'bg-attr-discipline/20 text-attr-discipline',
    mente: 'bg-attr-focus/20 text-attr-focus',
  };

  const renderActivity = (a: any) => (
    <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
      <span className="text-xl">{a.emoji}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{a.name}</p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${categoryColors[a.category] ?? 'bg-secondary text-secondary-foreground'}`}>
          {a.category}
        </span>
      </div>
      <button
        onClick={() => navigate('/new-activity', { state: { activityTypeId: a.id } })}
        className="text-xs font-semibold text-primary px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/10 transition-colors"
      >
        Registrar
      </button>
    </div>
  );

  return (
    <MobileLayout>
      <div className="px-5 pt-12 pb-24 space-y-5">
        <h1 className="text-xl font-bold text-foreground">Actividades</h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar actividad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {favTypes.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Favoritas</h2>
            <div className="space-y-2">{favTypes.map(renderActivity)}</div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Todas</h2>
          <div className="space-y-2">{otherTypes.map(renderActivity)}</div>
        </div>
      </div>
      <BottomNav />
    </MobileLayout>
  );
}
