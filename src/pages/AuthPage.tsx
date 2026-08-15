import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MobileLayout } from '@/components/MobileLayout';
import { toast } from 'sonner';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) toast.error(error.message);
      else {
        setSent(true);
        toast.success('Te enviamos un enlace de acceso a tu correo.');
      }
    } catch {
      toast.error('No hay conexión con el servidor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">AURA</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Haz cosas reales. Conviértete en alguien real.
          </p>
        </div>

        {sent ? (
          <div className="w-full text-center space-y-4">
            <p className="text-sm text-foreground">
              Enlace enviado a <span className="font-semibold">{email}</span>. Ábrelo desde este
              dispositivo para entrar (revisa también spam).
            </p>
            <button
              onClick={() => setSent(false)}
              className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold"
            >
              Usar otro email
            </button>
          </div>
        ) : (
          <form onSubmit={sendLink} className="w-full space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              {loading ? '...' : 'Entrar con mi email'}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              Sin contraseñas: te enviamos un enlace mágico. Si es tu primera vez, tu cuenta se crea
              automáticamente.
            </p>
          </form>
        )}
      </div>
    </MobileLayout>
  );
}
