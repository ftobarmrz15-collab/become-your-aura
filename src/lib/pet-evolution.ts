// Pet evolution system — mascota que evoluciona con el avatar

export type PetStage = 0 | 1 | 2 | 3 | 4;
export type PetMood = 'happy' | 'neutral' | 'sad' | 'sleeping' | 'excited';

export interface PetProfile {
  stage: PetStage;
  mood: PetMood;
  dominantType: string;
  name: string;
  description: string;
  color: string;
  accentColor: string;
  glowColor: string;
  hasWings: boolean;
  hasTail: boolean;
  bodySize: number;
}

const PET_NAMES: Record<string, string[]> = {
  strength:   ['Ignis', 'Brutus', 'Titan'],
  discipline: ['Seiko', 'Zen', 'Kira'],
  creativity: ['Prism', 'Pixel', 'Muse'],
  charisma:   ['Luxe', 'Sol', 'Auro'],
  flow:       ['Drift', 'Zephyr', 'Ripple'],
  courage:    ['Blaze', 'Vex', 'Ember'],
  focus:      ['Oracle', 'Axis', 'Lumen'],
  freedom:    ['Wisp', 'Nova', 'Zara'],
};

const PET_COLORS: Record<string, { main: string; accent: string; glow: string }> = {
  strength:   { main: '#c0392b', accent: '#e74c3c', glow: 'hsla(0,70%,50%,0.4)' },
  discipline: { main: '#d4a017', accent: '#f0c040', glow: 'hsla(38,80%,50%,0.4)' },
  creativity: { main: '#8e44ad', accent: '#bb8fce', glow: 'hsla(271,60%,55%,0.4)' },
  charisma:   { main: '#e67e22', accent: '#f5cba7', glow: 'hsla(30,80%,55%,0.4)' },
  flow:       { main: '#27ae60', accent: '#82e0aa', glow: 'hsla(142,60%,45%,0.4)' },
  courage:    { main: '#e55722', accent: '#f0926a', glow: 'hsla(20,75%,52%,0.4)' },
  focus:      { main: '#2980b9', accent: '#7fb3d3', glow: 'hsla(207,70%,50%,0.4)' },
  freedom:    { main: '#16a085', accent: '#76d7c4', glow: 'hsla(168,70%,40%,0.4)' },
};

const STAGE_DESCRIPTIONS = [
  'Un huevo misterioso que vibra levemente...',
  'Una pequeña cría que te observa con curiosidad',
  'Ya reconoce tu voz y tus movimientos',
  'Una criatura poderosa ligada a tu espíritu',
  'Forma legendaria — el reflejo perfecto de tu aura',
];

export function getPetStage(totalXP: number): PetStage {
  if (totalXP >= 1000) return 4;
  if (totalXP >= 400)  return 3;
  if (totalXP >= 150)  return 2;
  if (totalXP >= 40)   return 1;
  return 0;
}

export function getPetMood(lastActivityDate: string | null | undefined): PetMood {
  if (!lastActivityDate) return 'sleeping';
  const last = new Date(lastActivityDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'happy';
  if (diffDays === 1) return 'neutral';
  if (diffDays === 2) return 'sad';
  return 'sleeping';
}

export function getPetProfile(
  attrs: Record<string, number>,
  totalXP: number,
  lastActivityDate?: string | null
): PetProfile {
  const sorted = Object.entries(attrs).sort(([, a], [, b]) => b - a);
  const dominant = sorted[0]?.[0] ?? 'flow';
  const colors = PET_COLORS[dominant] ?? PET_COLORS.flow;
  const stage = getPetStage(totalXP);
  const mood = getPetMood(lastActivityDate);
  const names = PET_NAMES[dominant] ?? PET_NAMES.flow;
  const nameIndex = Math.abs(dominant.charCodeAt(0)) % names.length;

  return {
    stage,
    mood,
    dominantType: dominant,
    name: stage === 0 ? '???' : names[nameIndex],
    description: STAGE_DESCRIPTIONS[stage],
    color: colors.main,
    accentColor: colors.accent,
    glowColor: colors.glow,
    hasWings: ['creativity', 'freedom', 'flow'].includes(dominant) && stage >= 2,
    hasTail: stage >= 1,
    bodySize: 0.6 + stage * 0.2,
  };
}

export const MOOD_LABELS: Record<PetMood, string> = {
  happy: '¡Feliz!',
  excited: '¡Emocionado!',
  neutral: 'Tranquilo',
  sad: 'Extraña tus actividades...',
  sleeping: 'Durmiendo... necesita atención',
};

export const STAGE_NAMES: Record<PetStage, string> = {
  0: 'Huevo',
  1: 'Cría',
  2: 'Joven',
  3: 'Adulto',
  4: 'Legendario',
};
