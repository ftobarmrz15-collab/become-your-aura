import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAvatarConfig } from '@/hooks/useAvatarConfig';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import AvatarSVG from '@/components/AvatarSVG';
import {
  AvatarConfig,
  SKIN_TONES, HAIR_STYLES, HAIR_COLORS,
  FACE_SHAPES, EYE_SHAPES, EYE_COLORS,
  NOSES, MOUTHS, FACIAL_HAIR, OUTFITS,
  GENDERS, EYEBROWS,
  randomAvatarConfig,
} from '@/lib/avatar-options';
import { ATTRIBUTES } from '@/lib/constants';
import { Shuffle, Save, X } from 'lucide-react';

interface AvatarEditorProps {
  open: boolean;
  onClose: () => void;
}

export function AvatarEditor({ open, onClose }: AvatarEditorProps) {
  const { user } = useAuth();
  const { config, saveConfig } = useAvatarConfig();
  const [draft, setDraft] = useState<AvatarConfig | null>(null);
  const [dirty, setDirty] = useState(false);

  const { data: avatar } = useQuery({
    queryKey: ['avatar', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('avatar_state').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const attrs: Record<string, number> = {};
  if (avatar) {
    for (const a of ATTRIBUTES) attrs[a] = (avatar as any)[a] ?? 0;
  }

  useEffect(() => {
    if (config && open) {
      setDraft({
        skin_tone: config.skin_tone,
        hair_style: config.hair_style,
        hair_color: config.hair_color,
        face_shape: config.face_shape,
        eye_shape: config.eye_shape,
        eye_color: config.eye_color,
        nose: config.nose,
        mouth: config.mouth,
        facial_hair: config.facial_hair,
        outfit: config.outfit,
        gender: (config as any).gender ?? 'neutral',
        eyebrows: (config as any).eyebrows ?? 'normal',
      });
      setDirty(false);
    }
  }, [config, open]);

  if (!draft) return null;

  const update = (key: keyof AvatarConfig, value: string) => {
    setDraft(prev => prev ? { ...prev, [key]: value } : null);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!draft) return;
    await saveConfig(draft);
    setDirty(false);
    onClose();
  };

  const handleCancel = () => {
    setDirty(false);
    onClose();
  };

  const handleRandom = () => {
    setDraft(randomAvatarConfig());
    setDirty(true);
  };

  const showFacialHair = draft.gender !== 'feminine';

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleCancel()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl bg-background border-border p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-2">
          <SheetTitle className="text-foreground text-lg">Personaliza tu Avatar</SheetTitle>
        </SheetHeader>

        <div className="flex items-center justify-center py-2 gap-4">
          <div className="bg-card rounded-2xl border border-border p-2">
            <AvatarSVG config={draft} attributes={attrs} size={120} />
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={handleRandom} className="gap-1.5 text-xs">
              <Shuffle className="w-3.5 h-3.5" /> Aleatorio
            </Button>
          </div>
        </div>

        <Tabs defaultValue="base" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-5 bg-card">
            <TabsTrigger value="base" className="text-xs">Base</TabsTrigger>
            <TabsTrigger value="face" className="text-xs">Cara</TabsTrigger>
            <TabsTrigger value="hair" className="text-xs">Cabello</TabsTrigger>
            <TabsTrigger value="outfit" className="text-xs">Outfit</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <TabsContent value="base" className="mt-4 space-y-5">
              <Section title="Estilo base">
                <ChipSelect options={GENDERS} value={draft.gender} onChange={v => update('gender', v)} />
              </Section>
              <Section title="Tono de piel">
                <div className="flex flex-wrap gap-2">
                  {SKIN_TONES.map(t => (
                    <button key={t.id} onClick={() => update('skin_tone', t.id)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${draft.skin_tone === t.id ? 'border-primary scale-110' : 'border-border'}`}
                      style={{ backgroundColor: t.color }} title={t.label} />
                  ))}
                </div>
              </Section>
              <Section title="Forma de cara">
                <ChipSelect options={FACE_SHAPES} value={draft.face_shape} onChange={v => update('face_shape', v)} />
              </Section>
            </TabsContent>

            <TabsContent value="face" className="mt-4 space-y-5">
              <Section title="Cejas">
                <ChipSelect options={EYEBROWS} value={draft.eyebrows} onChange={v => update('eyebrows', v)} />
              </Section>
              <Section title="Forma de ojos">
                <ChipSelect options={EYE_SHAPES} value={draft.eye_shape} onChange={v => update('eye_shape', v)} />
              </Section>
              <Section title="Color de ojos">
                <div className="flex flex-wrap gap-2">
                  {EYE_COLORS.map(c => (
                    <button key={c.id} onClick={() => update('eye_color', c.id)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${draft.eye_color === c.id ? 'border-primary scale-110' : 'border-border'}`}
                      style={{ backgroundColor: c.color }} title={c.label} />
                  ))}
                </div>
              </Section>
              <Section title="Nariz">
                <ChipSelect options={NOSES} value={draft.nose} onChange={v => update('nose', v)} />
              </Section>
              <Section title="Boca">
                <ChipSelect options={MOUTHS} value={draft.mouth} onChange={v => update('mouth', v)} />
              </Section>
              {showFacialHair && (
                <Section title="Vello facial">
                  <ChipSelect options={FACIAL_HAIR} value={draft.facial_hair} onChange={v => update('facial_hair', v)} />
                </Section>
              )}
            </TabsContent>

            <TabsContent value="hair" className="mt-4 space-y-5">
              <Section title="Estilo">
                <div className="grid grid-cols-4 gap-2">
                  {HAIR_STYLES.map(h => (
                    <button key={h.id} onClick={() => update('hair_style', h.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${draft.hair_style === h.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                      <span className="text-lg">{h.emoji}</span>
                      <span className="text-[10px] text-muted-foreground">{h.label}</span>
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="Color">
                <div className="flex flex-wrap gap-2">
                  {HAIR_COLORS.map(c => (
                    <button key={c.id} onClick={() => update('hair_color', c.id)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${draft.hair_color === c.id ? 'border-primary scale-110' : 'border-border'}`}
                      style={{ backgroundColor: c.color }} title={c.label} />
                  ))}
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="outfit" className="mt-4 space-y-5">
              <Section title="Outfit base">
                <div className="grid grid-cols-3 gap-2">
                  {OUTFITS.map(o => (
                    <button key={o.id} onClick={() => update('outfit', o.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${draft.outfit === o.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                      <span className="text-2xl">{o.emoji}</span>
                      <span className="text-xs text-foreground">{o.label}</span>
                    </button>
                  ))}
                </div>
              </Section>
            </TabsContent>
          </div>
        </Tabs>

        <div className="px-5 pb-6 pt-3 border-t border-border flex gap-3">
          <Button variant="outline" onClick={handleCancel} className="gap-1.5 flex-1">
            <X className="w-4 h-4" /> Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!dirty} className="gap-1.5 flex-1 bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4" /> Guardar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  );
}

function ChipSelect({ options, value, onChange }: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${value === o.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
