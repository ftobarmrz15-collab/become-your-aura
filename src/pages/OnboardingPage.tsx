import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MobileLayout } from '@/components/MobileLayout';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const navigate = useNavigate();

  const { data: activityTypes } = useQuery({
    queryKey: ['activity-types'],
    queryFn: async () => {
      const { data } = await supabase.from('activity_types').select('*').is('user_id', null);
      return data ?? [];
    },
  });

  const toggleActivity = (id: string) => {
    setSelectedActivities(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const finishOnboarding = async () => {
    if (!user) return;
    // Create user profile
    const { error: userErr } = await supabase.from('users').insert({
      user_id: user.id, username, display_name: username,
    });
    if (userErr) { toast.error(userErr.message); return; }

    // Create avatar state
    await supabase.from('avatar_state').insert({ user_id: user.id });
    // Create streak
    await supabase.from('streaks').insert({ user_id: user.id });
    // Save favorites
    if (selectedActivities.length > 0) {
      await supabase.from('user_favorites').insert(
        selectedActivities.map(id => ({ user_id: user.id, activity_type_id: id }))
      );
    }
    // Mark onboarded
    await supabase.from('users').update({ onboarded: true }).eq('user_id', user.id);
    navigate('/home');
  };

  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-8">
        {step === 0 && (
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold text-foreground leading-tight">
              Haz cosas reales.<br />Conviértete en alguien real.
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              AURA transforma tus actividades reales en evolución personal.
              Cada acción cuenta. Tu avatar refleja quién estás construyendo ser.
            </p>
            <button onClick={() => setStep(1)} className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold">
              Comenzar
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="w-full space-y-6">
            <h2 className="text-2xl font-bold text-foreground text-center">¿Cómo te llamas?</h2>
            <input
              type="text"
              placeholder="Tu nombre"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 px-4 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-center text-lg"
              maxLength={20}
            />
            <button
              onClick={() => username.trim() && setStep(2)}
              disabled={!username.trim()}
              className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="w-full space-y-6">
            <h2 className="text-2xl font-bold text-foreground text-center">Elige tus actividades</h2>
            <p className="text-muted-foreground text-sm text-center">Selecciona 3 a 5 actividades</p>
            <div className="grid grid-cols-3 gap-3">
              {activityTypes?.map((at) => (
                <button
                  key={at.id}
                  onClick={() => toggleActivity(at.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                    selectedActivities.includes(at.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card'
                  }`}
                >
                  <span className="text-2xl">{at.emoji}</span>
                  <span className="text-xs text-foreground">{at.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => selectedActivities.length >= 3 && setStep(3)}
              disabled={selectedActivities.length < 3}
              className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              Continuar ({selectedActivities.length}/5)
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="w-28 h-28 mx-auto rounded-full bg-card border-2 border-primary flex items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{username.slice(0, 2).toUpperCase()}</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Tu aventura empieza ahora</h2>
            <p className="text-muted-foreground text-sm">Nivel 1 — Despertado</p>
            <button
              onClick={finishOnboarding}
              className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold"
            >
              Vamos 🚀
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
