import { useState, useRef } from 'react';
import { Share2, X, Copy } from 'lucide-react';
import AvatarSVG from '@/components/AvatarSVG';
import { LEVEL_NAMES, ATTRIBUTE_LABELS, type AttributeName } from '@/lib/constants';

interface ShareCardProps {
  username: string;
  level: number;
  totalXP: number;
  dominant: AttributeName;
  attrs: Record<string, number>;
  avatarConfig: any;
}

const AURA_COLORS: Record<string, string> = {
  strength: 'from-red-900/80 to-background',
  discipline: 'from-amber-900/80 to-background',
  creativity: 'from-purple-900/80 to-background',
  charisma: 'from-yellow-900/80 to-background',
  flow: 'from-green-900/80 to-background',
  courage: 'from-orange-900/80 to-background',
  focus: 'from-blue-900/80 to-background',
  freedom: 'from-teal-900/80 to-background',
};

export function ShareCard({ username, level, totalXP, dominant, attrs, avatarConfig }: ShareCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const topAttrs = Object.entries(attrs)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .filter(([, v]) => v > 0);

  const handleCopy = () => {
    const text = `🌟 Mi AURA\n👤 ${username}\n⚡ Nivel ${level} — ${LEVEL_NAMES[level]}\n🏆 ${totalXP.toLocaleString()} XP\n💪 ${ATTRIBUTE_LABELS[dominant as AttributeName]} dominante\n\n¡Únete a AURA y mejora tu vida!`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-sm text-foreground hover:border-primary/50 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Compartir perfil
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-8">
          <div className="w-full max-w-sm">
            {/* The card */}
            <div className={`relative rounded-2xl overflow-hidden border border-border bg-gradient-to-b ${AURA_COLORS[dominant] ?? 'from-primary/20 to-background'} p-6`}>
              <div className="flex items-center gap-4">
                <div className="bg-background/40 rounded-xl p-1 backdrop-blur-sm">
                  <AvatarSVG
                    config={avatarConfig}
                    attributes={attrs}
                    size={90}
                    showAura
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-lg text-foreground">{username}</p>
                  <p className="text-sm text-muted-foreground">Nivel {level} — {LEVEL_NAMES[level]}</p>
                  <p className="text-xs text-primary font-semibold mt-1">{totalXP.toLocaleString()} XP totales</p>
                </div>
              </div>

              {topAttrs.length > 0 && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  {topAttrs.map(([attr, val]) => (
                    <span key={attr} className="px-2.5 py-1 rounded-full bg-background/40 backdrop-blur-sm text-xs text-foreground border border-white/10">
                      {ATTRIBUTE_LABELS[attr as AttributeName]} {val}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-muted-foreground mt-4 text-right tracking-widest uppercase">AURA · Become your best self</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
              >
                <Copy className="w-4 h-4" />
                {copied ? '¡Copiado!' : 'Copiar texto'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-card border border-border"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
