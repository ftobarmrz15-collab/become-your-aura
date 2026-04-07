import { useState } from 'react';
import PetSVG from '@/components/PetSVG';
import { getPetProfile, MOOD_LABELS, STAGE_NAMES, PetStage } from '@/lib/pet-evolution';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface PetPanelProps {
  attrs: Record<string, number>;
  totalXP: number;
  lastActivityDate?: string | null;
}

const STAGE_XP: Record<PetStage, number> = {
  0: 40,
  1: 150,
  2: 400,
  3: 1000,
  4: 9999,
};

const MOOD_EMOJI: Record<string, string> = {
  happy: '😄',
  excited: '🤩',
  neutral: '😊',
  sad: '😔',
  sleeping: '😴',
};

export function PetPanel({ attrs, totalXP, lastActivityDate }: PetPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const pet = getPetProfile(attrs, totalXP, lastActivityDate);

  const nextStageXP = STAGE_XP[pet.stage as PetStage];
  const prevStageXP = [0, 40, 150, 400, 1000][pet.stage] ?? 0;
  const progress = pet.stage === 4
    ? 100
    : ((totalXP - prevStageXP) / (nextStageXP - prevStageXP)) * 100;

  return (
    <div className="mx-5 rounded-2xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🐾</span>
          <span className="text-sm font-semibold text-foreground">
            {pet.stage === 0 ? 'Mascota misterosa' : pet.name}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
            {STAGE_NAMES[pet.stage as PetStage]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {MOOD_EMOJI[pet.mood]}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-4">
            {/* Pet */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <PetSVG pet={pet} size={110} animate />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">{pet.description}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: pet.accentColor }}>
                  {MOOD_EMOJI[pet.mood]} {MOOD_LABELS[pet.mood]}
                </p>
              </div>

              {/* Evolution progress */}
              {pet.stage < 4 && (
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Evolución</span>
                    <span>{totalXP} / {nextStageXP} XP</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        background: `linear-gradient(90deg, ${pet.color}, ${pet.accentColor})`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {nextStageXP - totalXP} XP para {STAGE_NAMES[(pet.stage + 1) as PetStage]}
                  </p>
                </div>
              )}

              {pet.stage === 4 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold" style={{ color: pet.accentColor }}>
                    ⭐ Forma Legendaria desbloqueada
                  </span>
                </div>
              )}

              {/* Evolution stages preview */}
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className="w-5 h-5 rounded-full border flex items-center justify-center text-[9px]"
                    style={{
                      borderColor: s <= pet.stage ? pet.accentColor : 'hsl(var(--border))',
                      background: s <= pet.stage ? `${pet.color}30` : 'transparent',
                      color: s <= pet.stage ? pet.accentColor : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {s <= pet.stage ? '✓' : s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
