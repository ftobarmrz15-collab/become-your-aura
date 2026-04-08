import { Home, Plus, User, Compass, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const tabs = [
  { path: '/home',         icon: Home,    label: 'Inicio' },
  { path: '/feed',         icon: Compass, label: 'Feed' },
  { path: '/new-activity', icon: Plus,    label: '',      isCenter: true },
  { path: '/users',        icon: Users,   label: 'Gente' },
  { path: '/profile',      icon: User,    label: 'Perfil' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: pendingCount } = useQuery({
    queryKey: ['pending-duels-count', user?.id],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from('duels')
        .select('id', { count: 'exact', head: true })
        .eq('challenged_id', user!.id)
        .eq('status', 'pending');
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-card/95 backdrop-blur-md border-t border-border z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path ||
            location.pathname.startsWith(tab.path + '/');
          const Icon = tab.icon;

          if (tab.isCenter) {
            return (
              <button key={tab.path} onClick={() => navigate(tab.path)}
                className="w-14 h-14 -mt-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Icon className="w-7 h-7 text-primary-foreground" />
              </button>
            );
          }

          return (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-1 py-2 px-3 relative">
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              {pendingCount && pendingCount > 0 && tab.path === '/users' && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
              <span className={`text-[10px] transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
