import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MobileLayout } from '@/components/MobileLayout';
import { AvatarEditor } from '@/components/AvatarEditor';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import AvatarSVG from '@/components/AvatarSVG';
import { DEFAULT_AVATAR_CONFIG } from '@/lib/avatar-options';

export default function OnboardingPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [avatarDone, setAvatarDone] = useState(false);
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
    const { error: userErr } = await supabase.from('users').insert({
      user_id: user.id, username, display_name: username,
    });
    if (userErr) { toast.error(userErr.message); return; }
    await supabase.from('avatar_state').insert({ user_id: user.id });
    await supabase.from('streaks').insert({ user_id: user.id });
    if (selectedActivities.length > 0) {
      await supabase.from('user_favorites').insert(
        selectedActivities.map(id => ({ user_id: user.id, activity_type_id: id }))
      );
    }
    await supabase.from('users').update({ onboarded: true }).eq('user_id', user.id);
    navigate('/home');
  };

  const TOTAL_STEPS = 4;
  const progress = ((step) / (TOTAL_STEPS - 1)) * 100;

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen px-6">
        {/* Progress bar */}
        {step > 0 && (
          <div className="pt-12 pb-2">
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-6 w-full">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <span className="text-3xl font-black text-primary tracking-wider">A</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground leading-tight">
                Haz cosas reales.<br />Conviértete en alguien real.
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                AURA transforma tus actividades reales en evolución personal.
                Tu avatar refleja quién estás construyendo ser.
              </p>
              <button onClick={() => setStep(1)} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold">
                Comenzar
              </button>
            </div>
          )}

          {/* Step 1: Username */}
          {step === 1 && (
            <div className="w-full space-y-6">
              <h2 className="text-2xl font-bold text-foreground text-center">¿Cómo te llamas?</h2>
              <input
                type="text"
                placeholder="Tu nombre o apodo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-center text-lg"
                maxLength={20}
                autoFocus
              />
              <button
                onClick={() => username.trim() && setStep(2)}
                disabled={!username.trim()}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Step 2: Activities */}
          {step === 2 && (
            <div className="w-full space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">Elige tus actividades</h2>
                <p className="text-muted-foreground text-sm mt-1">Selecciona 3 a 5 actividades</p>
              </div>
              <div className="grid grid-cols-3 gap-2.5 max-h-[55vh] overflow-y-auto pb-2">
                {activityTypes?.map((at) => (
                  <button
                    key={at.id}
                    onClick={() => toggleActivity(at.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                      selectedActivities.includes(at.id)
                        ? 'border-primary bg-primary/10 scale-95'
                        : 'border-border bg-card'
                    }`}
                  >
                    <span className="text-2xl">{at.emoji}</span>
                    <span className="text-xs text-foreground leading-tight text-center">{at.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => selectedActivities.length >= 3 && setStep(3)}
                disabled={selectedActivities.length < 3}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40"
              >
                Continuar ({selectedActivities.length}/5)
              </button>
            </div>
          )}

          {/* Step 3: Avatar */}
          {step === 3 && (
            <div className="text-center space-y-5 w-full">
              <h2 className="text-2xl font-bold text-foreground">Crea tu avatar</h2>
              <p className="text-muted-foreground text-sm">
                Personalízalo ahora o hazlo después desde tu perfil.
              </p>

              <div
                className="mx-auto cursor-pointer relative"
                onClick={() => setAvatarEditorOpen(true)}
                style={{ width: 140, height: 160 }}
              >
                <div className="bg-card rounded-2xl border-2 border-dashed border-primary/40 p-2 hover:border-primary transition-colors">
                  <AvatarSVG
                    config={DEFAULT_AVATAR_CONFIG}
                    attributes={{}}
                    size={120}
                    showAura
                  />
                </div>
                {!avatarDone && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
                    <span className="text-white text-xs font-semibold bg-primary px-3 py-1 rounded-full">✏️ Editar</span>
                  </div>
                )}
                {avatarDone && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setAvatarEditorOpen(true)}
                  className="w-full h-12 rounded-xl border border-primary text-primary font-semibold"
                >
                  {avatarDone ? '✏️ Cambiar avatar' : '🎨 Personalizar avatar'}
                </button>
                <button
                  onClick={finishOnboarding}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold"
                >
                  {avatarDone ? '¡Listo! Vamos 🚀' : 'Saltar y entrar 🚀'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AvatarEditor
        open={avatarEditorOpen}
        onClose={() => {
          setAvatarEditorOpen(false);
          setAvatarDone(true);
        }}
      />
    </MobileLayout>
  );
}
