export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 150, 3: 350, 4: 600, 5: 900,
  6: 1300, 7: 1800, 8: 2400, 9: 3100, 10: 3900,
  11: 4800, 12: 5700, 13: 6600, 14: 7800, 15: 9000,
  16: 11000, 17: 13500, 18: 16500, 19: 20000, 20: 25000,
};

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Despertado', 2: 'Iniciado', 3: 'Enfocado', 4: 'Comprometido',
  5: 'Forjado', 6: 'Constante', 7: 'Ascendido', 8: 'Dominante',
  9: 'Imparable', 10: 'Legendario', 11: 'Legendario', 12: 'Legendario',
  13: 'Legendario', 14: 'Legendario', 15: 'Legendario', 16: 'Legendario',
  17: 'Legendario', 18: 'Legendario', 19: 'Legendario', 20: 'Legendario',
};

export const ATTRIBUTES = [
  'strength', 'discipline', 'creativity', 'charisma',
  'flow', 'courage', 'focus', 'freedom',
] as const;

export type AttributeName = typeof ATTRIBUTES[number];

export const ATTRIBUTE_COLORS: Record<AttributeName, string> = {
  strength: 'hsl(var(--attr-strength))',
  discipline: 'hsl(var(--attr-discipline))',
  creativity: 'hsl(var(--attr-creativity))',
  charisma: 'hsl(var(--attr-charisma))',
  flow: 'hsl(var(--attr-flow))',
  courage: 'hsl(var(--attr-courage))',
  focus: 'hsl(var(--attr-focus))',
  freedom: 'hsl(var(--attr-freedom))',
};

export const ATTRIBUTE_LABELS: Record<AttributeName, string> = {
  strength: 'Fuerza',
  discipline: 'Disciplina',
  creativity: 'Creatividad',
  charisma: 'Carisma',
  flow: 'Flow',
  courage: 'Coraje',
  focus: 'Enfoque',
  freedom: 'Libertad',
};

export function getLevelFromXP(xp: number): number {
  let level = 1;
  for (let i = 20; i >= 1; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i; break; }
  }
  return level;
}

export function getXPForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level + 1, 20)] ?? 25000;
}

export function getDominantAttribute(attrs: Record<string, number>): AttributeName {
  let max = 0;
  let dominant: AttributeName = 'strength';
  for (const attr of ATTRIBUTES) {
    if ((attrs[attr] ?? 0) > max) {
      max = attrs[attr] ?? 0;
      dominant = attr;
    }
  }
  return dominant;
}

export function calculateXP(opts: {
  hasPhoto: boolean;
  hasVideo: boolean;
  hasNote: boolean;
  durationMinutes: number;
  currentStreak: number;
  isFirstThisWeek: boolean;
}): number {
  let xp = 10; // base
  if (opts.hasPhoto) xp += 5;
  if (opts.hasVideo) xp += 8;
  if (opts.hasNote) xp += 3;
  if (opts.durationMinutes >= 60) xp += 10;
  else if (opts.durationMinutes >= 30) xp += 5;
  if (opts.currentStreak >= 7) xp += 15;
  else if (opts.currentStreak >= 3) xp += 5;
  if (opts.isFirstThisWeek) xp += 10;
  return xp;
}
