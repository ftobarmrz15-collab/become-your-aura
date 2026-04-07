// Avatar evolution logic — maps discipline XP to visual traits

export interface EvolutionProfile {
  // Top two disciplines
  primary: string;
  secondary: string;
  primaryLevel: number; // 0-3
  secondaryLevel: number;
  // Derived visual traits
  bodyBuild: 'slim' | 'average' | 'athletic' | 'muscular';
  outfitStyle: 'casual' | 'athletic' | 'streetwear' | 'formal' | 'artistic' | 'zen' | 'business';
  auraColor: string;
  auraIntensity: number;
  expressionType: 'neutral' | 'confident' | 'serene' | 'fierce';
  // Unlocked accessories by evolution
  unlockedAccessories: string[];
}

function attrLevel(val: number): number {
  if (val >= 40) return 3;
  if (val >= 20) return 2;
  if (val >= 8) return 1;
  return 0;
}

export function getEvolutionProfile(attrs: Record<string, number>): EvolutionProfile {
  const sorted = Object.entries(attrs)
    .sort(([, a], [, b]) => b - a);

  const primary = sorted[0]?.[0] ?? 'strength';
  const primaryVal = sorted[0]?.[1] ?? 0;
  const secondary = sorted[1]?.[0] ?? 'discipline';
  const secondaryVal = sorted[1]?.[1] ?? 0;
  const primaryLvl = attrLevel(primaryVal);
  const secondaryLvl = attrLevel(secondaryVal);

  // Body build
  const strengthLvl = attrLevel(attrs.strength ?? 0);
  let bodyBuild: EvolutionProfile['bodyBuild'] = 'slim';
  if (strengthLvl >= 3) bodyBuild = 'muscular';
  else if (strengthLvl >= 2) bodyBuild = 'athletic';
  else if (strengthLvl >= 1) bodyBuild = 'average';

  // Outfit style based on primary discipline
  const outfitMap: Record<string, EvolutionProfile['outfitStyle']> = {
    strength: 'athletic',
    discipline: 'zen',
    creativity: 'artistic',
    charisma: 'streetwear',
    flow: 'streetwear',
    courage: 'athletic',
    focus: 'formal',
    freedom: 'casual',
  };
  const outfitStyle = primaryLvl >= 2 ? (outfitMap[primary] ?? 'casual') : 'casual';

  // Aura color
  const auraMap: Record<string, string> = {
    strength: 'hsl(0, 84%, 60%)',
    discipline: 'hsl(38, 92%, 50%)',
    creativity: 'hsl(271, 81%, 56%)',
    charisma: 'hsl(330, 81%, 60%)',
    flow: 'hsl(142, 71%, 45%)',
    courage: 'hsl(25, 95%, 53%)',
    focus: 'hsl(217, 91%, 60%)',
    freedom: 'hsl(173, 80%, 40%)',
  };
  const auraColor = auraMap[primary] ?? 'hsl(240, 10%, 55%)';
  const totalXP = Object.values(attrs).reduce((s, v) => s + v, 0);
  const auraIntensity = Math.min(0.7, 0.1 + totalXP / 200);

  // Expression
  let expressionType: EvolutionProfile['expressionType'] = 'neutral';
  if (primary === 'discipline' && primaryLvl >= 2) expressionType = 'serene';
  else if (primary === 'courage' && primaryLvl >= 2) expressionType = 'fierce';
  else if (primaryLvl >= 2) expressionType = 'confident';

  // Unlocked accessories
  const unlocked: string[] = [];
  if (attrLevel(attrs.creativity ?? 0) >= 2) unlocked.push('beret', 'color-glasses');
  if (attrLevel(attrs.creativity ?? 0) >= 3) unlocked.push('arm-tattoo');
  if (attrLevel(attrs.charisma ?? 0) >= 1) unlocked.push('chain');
  if (attrLevel(attrs.charisma ?? 0) >= 2) unlocked.push('earrings', 'sunglasses');
  if (attrLevel(attrs.flow ?? 0) >= 2) unlocked.push('headphones');
  if (attrLevel(attrs.focus ?? 0) >= 2) unlocked.push('reading-glasses', 'watch');
  if (attrLevel(attrs.focus ?? 0) >= 3) unlocked.push('book');
  if (attrLevel(attrs.discipline ?? 0) >= 2) unlocked.push('meditation-bracelet');
  if (attrLevel(attrs.discipline ?? 0) >= 3) unlocked.push('zen-outfit');
  if (attrLevel(attrs.strength ?? 0) >= 2) unlocked.push('sport-cap', 'wristbands');
  if (attrLevel(attrs.strength ?? 0) >= 3) unlocked.push('sport-headphones');

  return {
    primary,
    secondary,
    primaryLevel: primaryLvl,
    secondaryLevel: secondaryLvl,
    bodyBuild,
    outfitStyle,
    auraColor,
    auraIntensity,
    expressionType,
    unlockedAccessories: [...new Set(unlocked)],
  };
}

export const EVOLUTION_STAGES: Record<string, { name: string; stages: string[] }> = {
  strength: {
    name: 'Fuerza',
    stages: ['Hombros más anchos', 'Brazos musculosos, torso robusto', 'Postura firme, ropa deportiva ajustada'],
  },
  discipline: {
    name: 'Disciplina',
    stages: ['Postura erguida', 'Outfit minimalista, headband', 'Aura intensa, outfit zen'],
  },
  creativity: {
    name: 'Creatividad',
    stages: ['Colores más vibrantes', 'Boina, lentes de colores', 'Tatuaje, estilo artístico completo'],
  },
  charisma: {
    name: 'Carisma',
    stages: ['Sonrisa más amplia', 'Cadena, aretes, streetwear', 'Lentes de sol, outfit premium'],
  },
  flow: {
    name: 'Flow',
    stages: ['Líneas de flujo en ropa', 'Audífonos, postura relajada', 'Estilo completo streetwear'],
  },
  courage: {
    name: 'Coraje',
    stages: ['Cejas más marcadas', 'Aura cálida, cicatriz', 'Expresión feroz, glow intenso'],
  },
  focus: {
    name: 'Enfoque',
    stages: ['Mirada intensa', 'Lentes de lectura, reloj', 'Libro bajo el brazo, outfit formal'],
  },
  freedom: {
    name: 'Libertad',
    stages: ['Bufanda ligera', 'Ropa más suelta y colorida', 'Estilo libre y único'],
  },
};
