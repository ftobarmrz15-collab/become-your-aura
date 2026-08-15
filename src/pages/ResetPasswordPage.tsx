import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MobileLayout } from '@/components/MobileLayout';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase entrega la sesión de recuperación desde el hash de la URL
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Las contraseñas no coinciden'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    toast.success('Contraseña actualizada');
    window.location.replace('/home');
  };

  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Nueva contraseña</h1>
        <p className="text-muted-foreground text-sm mb-8 text-center">
          {ready ? 'Escribe tu nueva contraseña para entrar a AURA.' : 'Abre este enlace desde el correo de recuperación para continuar.'}
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="Repetir contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full h-12 px-4 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={loading || !ready || done}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            {loading ? '...' : 'Guardar contraseña'}
          </button>
        </form>

        <a href="/" className="mt-6 text-sm text-muted-foreground">Volver a iniciar sesión</a>
      </div>
    </MobileLayout>
  );
}
