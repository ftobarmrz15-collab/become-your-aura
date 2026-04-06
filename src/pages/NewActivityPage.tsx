import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MobileLayout } from '@/components/MobileLayout';
import { useLocation, useNavigate } from 'react-router-dom';
import { calculateXP, getDominantAttribute, getLevelFromXP, LEVEL_NAMES, ATTRIBUTE_LABELS, ATTRIBUTE_COLORS, type AttributeName } from '@/lib/constants';
import { Camera, Video, Check, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewActivityPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preselectedId = (location.state as any)?.activityTypeId;

  const [step, setStep] = useState(preselectedId ? 1 : 0);
  const [selectedTypeId, setSelectedTypeId] = useState<string>(preselectedId ?? '');
  const [duration, setDuration] = useState(30);
  const [note, setNote] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | null>(null);
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState<{ xp: number; deltas: Record<string, number>; levelUp: boolean; newLevel: number } | null>(null);
  const [search, setSearch] = useState('');

  const { data: activityTypes } = useQuery({
    queryKey: ['activity-types-all'],
    queryFn: async () => {
      const { data } = await supabase.from('activity_types').select('*');
      return data ?? [];
    },
  });

  const { data: streak } = useQuery({
    queryKey: ['streak', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('streaks').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const selectedType = activityTypes?.find(a => a.id === selectedTypeId);
  const durations = [15, 30, 45, 60, 90];

  const handleFileSelect = (type: 'photo' | 'video') => {
    setMediaType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'photo' ? 'image/*' : 'video/*';
      fileInputRef.current.click();
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (mediaType === 'photo') {
        setUploadPreview(URL.createObjectURL(file));
      } else {
        setUploadPreview('video');
      }
    }
  };

  const handleComplete = async () => {
    if (!user || !selectedType) return;
    setLoading(true);

    try {
      // Check if first activity this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { data: weekActivities } = await supabase
        .from('activities')
        .select('id')
        .eq('user_id', user.id)
        .gte('completed_at', weekStart.toISOString())
        .limit(1);

      const currentStreak = streak?.current_streak ?? 0;

      const xp = calculateXP({
        hasPhoto: mediaType === 'photo',
        hasVideo: mediaType === 'video',
        hasNote: note.trim().length > 0,
        durationMinutes: duration,
        currentStreak,
        isFirstThisWeek: !weekActivities || weekActivities.length === 0,
      });

      const boosts = (selectedType.attribute_boosts as Record<string, number>) || {};
      const deltas: Record<string, number> = {};
      for (const [k, v] of Object.entries(boosts)) {
        deltas[k] = v as number;
      }

      // Insert activity
      const { data: activity, error: actErr } = await supabase.from('activities').insert({
        user_id: user.id,
        activity_type_id: selectedTypeId,
        duration_minutes: duration,
        note: note.trim() || null,
        xp_earned: xp,
        attribute_deltas: deltas,
      }).select().single();

      if (actErr) throw actErr;

      // Upload file if present
      if (uploadFile && activity) {
        const path = `${user.id}/${activity.id}/${uploadFile.name}`;
        await supabase.storage.from('activity-uploads').upload(path, uploadFile);
        await supabase.from('uploads').insert({
          activity_id: activity.id,
          user_id: user.id,
          storage_path: path,
          media_type: mediaType!,
        });
      }

      // Update avatar state
      const { data: avatar } = await supabase.from('avatar_state').select('*').eq('user_id', user.id).single();
      if (avatar) {
        const newXP = avatar.total_xp + xp;
        const oldLevel = getLevelFromXP(avatar.total_xp);
        const newLevel = getLevelFromXP(newXP);

        const updates: any = {
          total_xp: newXP,
          level: newLevel,
        };

        const attrs: Record<string, number> = {};
        for (const attr of ['strength', 'discipline', 'creativity', 'charisma', 'flow', 'courage', 'focus', 'freedom']) {
          const current = (avatar as any)[attr] ?? 0;
          const delta = deltas[attr] ?? 0;
          attrs[attr] = Math.min(current + delta, 100);
          updates[attr] = attrs[attr];
        }

        updates.dominant_attribute = getDominantAttribute(attrs);

        await supabase.from('avatar_state').update(updates).eq('user_id', user.id);

        // Update streak
        const today = new Date().toISOString().split('T')[0];
        const lastDate = streak?.last_activity_date;
        let newStreak = 1;
        if (lastDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          if (lastDate === today) {
            newStreak = streak?.current_streak ?? 1;
          } else if (lastDate === yesterdayStr) {
            newStreak = (streak?.current_streak ?? 0) + 1;
          }
        }

        await supabase.from('streaks').update({
          current_streak: newStreak,
          max_streak: Math.max(newStreak, streak?.max_streak ?? 0),
          last_activity_date: today,
        }).eq('user_id', user.id);

        setReward({
          xp,
          deltas,
          levelUp: newLevel > oldLevel,
          newLevel,
        });
        setStep(4);
      }

      queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar actividad');
    }
    setLoading(false);
  };

  const filteredTypes = activityTypes?.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <MobileLayout>
      <div className="min-h-screen px-5 pt-12 pb-12">
        <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} />

        {/* Step 0: Select activity */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-xl font-bold text-foreground">Nueva actividad</h1>
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 px-4 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="space-y-2">
              {filteredTypes.map(a => (
                <button
                  key={a.id}
                  onClick={() => { setSelectedTypeId(a.id); setStep(1); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left hover:border-primary/50 transition-colors"
                >
                  <span className="text-xl">{a.emoji}</span>
                  <span className="text-sm font-medium text-foreground">{a.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Duration */}
        {step === 1 && selectedType && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(0)} className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <div>
                <p className="text-xl">{selectedType.emoji} {selectedType.name}</p>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-foreground">¿Cuánto tiempo?</h2>
            <div className="flex flex-wrap gap-3">
              {durations.map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                    duration === d
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-foreground'
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold">
              Continuar
            </button>
          </div>
        )}

        {/* Step 2: Upload + note */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(1)} className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-foreground">Evidencia</h1>
            </div>

            {uploadPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                {mediaType === 'photo' ? (
                  <img src={uploadPreview} alt="preview" className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-card flex items-center justify-center">
                    <Video className="w-12 h-12 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground ml-2">Video listo</span>
                  </div>
                )}
                <button
                  onClick={() => { setUploadFile(null); setUploadPreview(null); setMediaType(null); }}
                  className="absolute top-2 right-2 bg-background/80 text-foreground p-1 rounded-full text-xs"
                >✕</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleFileSelect('photo')} className="flex flex-col items-center gap-2 p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
                  <Camera className="w-8 h-8 text-primary" />
                  <span className="text-sm text-foreground">Subir Foto</span>
                  <span className="text-[10px] text-accent">+5 XP</span>
                </button>
                <button onClick={() => handleFileSelect('video')} className="flex flex-col items-center gap-2 p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
                  <Video className="w-8 h-8 text-primary" />
                  <span className="text-sm text-foreground">Subir Video</span>
                  <span className="text-[10px] text-accent">+8 XP</span>
                </button>
              </div>
            )}

            <textarea
              placeholder="¿Cómo fue?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-24 p-4 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <button
              onClick={() => setStep(3)}
              className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && selectedType && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(2)} className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-lg font-semibold text-foreground">Confirmar</h1>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedType.emoji}</span>
                <div>
                  <p className="text-lg font-semibold text-foreground">{selectedType.name}</p>
                  <p className="text-sm text-muted-foreground">{duration} minutos</p>
                </div>
              </div>
              {uploadFile && <p className="text-xs text-success">📎 {mediaType === 'photo' ? 'Foto' : 'Video'} adjunto</p>}
              {note && <p className="text-xs text-muted-foreground italic">"{note}"</p>}
            </div>

            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Completar actividad ✓'}
            </button>
          </div>
        )}

        {/* Step 4: Reward */}
        {step === 4 && reward && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6">
            <div className="animate-xp-pop">
              <span className="text-5xl font-bold text-primary">+{reward.xp} XP</span>
            </div>

            {reward.levelUp && (
              <div className="text-center animate-xp-pop">
                <p className="text-lg font-bold text-accent">¡Subiste de nivel!</p>
                <p className="text-sm text-foreground">Nivel {reward.newLevel} — {LEVEL_NAMES[reward.newLevel]}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-center">
              {Object.entries(reward.deltas).map(([attr, val]) => (
                <span
                  key={attr}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: `${ATTRIBUTE_COLORS[attr as AttributeName]}20`,
                    color: ATTRIBUTE_COLORS[attr as AttributeName],
                  }}
                >
                  {ATTRIBUTE_LABELS[attr as AttributeName]} +{val}
                </span>
              ))}
            </div>

            <button
              onClick={() => navigate('/home')}
              className="w-full max-w-[200px] h-12 rounded-lg bg-primary text-primary-foreground font-semibold"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
