import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MobileLayout } from '@/components/MobileLayout';
import { toast } from 'sonner';

type Mode = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          toast.error(
            error.message === 'Invalid login credentials'
              ? 'Email o contraseña incorrectos. Usa "Olvidé mi contraseña".'
              : error.message
          );
        }
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) toast.error(error.message);
        else toast.success('Cuenta creada. Revisa tu correo para confirmarla.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) toast.error(error.message);
        else {
          setSent(true);
          toast.success('Te enviamos un enlace para recuperar tu contraseña.');
        }
      }
    } catch {
      toast.error('No hay conexión con el servidor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'forgot' ? 'Recuperar acceso' : 'AURA';

  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {mode === 'forgot'
              ? 'Escribe tu email y te enviamos un enlace para crear una nueva contraseña.'
              : 'Haz cosas reales. Conviértete en alguien real.'}
          </p>
        </div>

        {sent && mode === 'forgot' ? (
          <div className="w-full text-center space-y-4">
            <p className="text-sm text-foreground">
              Enlace enviado a <span className="font-semibold">{email}</span>. Revisa tu correo (y spam).
            </p>
            <button
              onClick={() => { setSent(false); setMode('login'); }}
              className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold"
            >
              Volver a iniciar sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
              autoComplete="email"
            />
            {mode !== 'forgot' && (
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              {loading ? '...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Crear cuenta' : 'Enviar enlace'}
            </button>
          </form>
        )}

        {!sent && (
          <div className="mt-6 flex flex-col items-center gap-3">
            {mode === 'login' && (
              <button onClick={() => setMode('forgot')} className="text-sm text-primary font-medium">
                Olvidé mi contraseña
              </button>
            )}
            <button
              onClick={() => setMode(mode === 'signup' ? 'login' : mode === 'login' ? 'signup' : 'login')}
              className="text-sm text-muted-foreground"
            >
              {mode === 'signup'
                ? '¿Ya tienes cuenta? Inicia sesión'
                : mode === 'forgot'
                  ? 'Volver a iniciar sesión'
                  : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
