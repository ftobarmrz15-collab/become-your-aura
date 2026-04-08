export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'streak' | 'activity' | 'xp' | 'social' | 'discipline' | 'duel';
  xpReward: number;
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalActivities: number;
  currentStreak: number;
  maxStreak: number;
  totalXP: number;
  followers: number;
  following: number;
  duelsWon: number;
  strengthXP: number;
  disciplineXP: number;
  creativityXP: number;
  charismaXP: number;
  flowXP: number;
  courageXP: number;
  focusXP: number;
  freedomXP: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'streak_3',  name: 'Calentando',     description: '3 días de racha',           emoji: '🔥', category: 'streak',    xpReward: 20,  check: s => s.currentStreak >= 3 },
  { id: 'streak_7',  name: 'Semana Perfecta', description: '7 días de racha',           emoji: '🔥', category: 'streak',    xpReward: 50,  check: s => s.currentStreak >= 7 },
  { id: 'streak_14', name: 'Imparable',       description: '14 días de racha',          emoji: '💫', category: 'streak',    xpReward: 100, check: s => s.currentStreak >= 14 },
  { id: 'streak_30', name: 'Leyenda',         description: '30 días de racha',          emoji: '👑', category: 'streak',    xpReward: 250, check: s => s.currentStreak >= 30 },
  { id: 'act_1',     name: 'Primer Paso',     description: 'Registra tu 1a actividad',  emoji: '🌱', category: 'activity',  xpReward: 10,  check: s => s.totalActivities >= 1 },
  { id: 'act_10',    name: 'En Movimiento',   description: '10 actividades',            emoji: '⚡', category: 'activity',  xpReward: 30,  check: s => s.totalActivities >= 10 },
  { id: 'act_25',    name: 'Constante',       description: '25 actividades',            emoji: '🏆', category: 'activity',  xpReward: 75,  check: s => s.totalActivities >= 25 },
  { id: 'act_50',    name: 'Máquina',         description: '50 actividades',            emoji: '🤖', category: 'activity',  xpReward: 150, check: s => s.totalActivities >= 50 },
  { id: 'act_100',   name: 'Centenario',      description: '100 actividades',           emoji: '💎', category: 'activity',  xpReward: 300, check: s => s.totalActivities >= 100 },
  { id: 'xp_100',    name: 'Iniciado',        description: 'Llega a 100 XP',           emoji: '✨', category: 'xp',        xpReward: 10,  check: s => s.totalXP >= 100 },
  { id: 'xp_500',    name: 'Ascendente',      description: 'Llega a 500 XP',           emoji: '🌟', category: 'xp',        xpReward: 30,  check: s => s.totalXP >= 500 },
  { id: 'xp_1000',   name: 'Élite',           description: 'Llega a 1,000 XP',         emoji: '🏅', category: 'xp',        xpReward: 80,  check: s => s.totalXP >= 1000 },
  { id: 'xp_5000',   name: 'Trascendido',     description: 'Llega a 5,000 XP',         emoji: '🌙', category: 'xp',        xpReward: 200, check: s => s.totalXP >= 5000 },
  { id: 'social_1',  name: 'Conectado',       description: 'Consigue tu 1er seguidor', emoji: '👋', category: 'social',    xpReward: 15,  check: s => s.followers >= 1 },
  { id: 'social_10', name: 'Influencer',      description: '10 seguidores',            emoji: '📣', category: 'social',    xpReward: 50,  check: s => s.followers >= 10 },
  { id: 'str_20',    name: 'Fuerza Bruta',    description: '20 pts de Fuerza',         emoji: '💪', category: 'discipline', xpReward: 40, check: s => s.strengthXP >= 20 },
  { id: 'flow_20',   name: 'En el Flow',      description: '20 pts de Flow',           emoji: '🌊', category: 'discipline', xpReward: 40, check: s => s.flowXP >= 20 },
  { id: 'focus_20',  name: 'Mente de Acero',  description: '20 pts de Enfoque',        emoji: '🧠', category: 'discipline', xpReward: 40, check: s => s.focusXP >= 20 },
  { id: 'disc_20',   name: 'Monje',           description: '20 pts de Disciplina',     emoji: '🧘', category: 'discipline', xpReward: 40, check: s => s.disciplineXP >= 20 },
  { id: 'duel_1',    name: 'Gladiador',       description: 'Gana tu primer duelo',     emoji: '⚔️', category: 'duel',      xpReward: 60,  check: s => s.duelsWon >= 1 },
  { id: 'duel_5',    name: 'Campeón',         description: 'Gana 5 duelos',            emoji: '🛡️', category: 'duel',      xpReward: 150, check: s => s.duelsWon >= 5 },
];

export function getUnlockedAchievements(stats: AchievementStats): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.check(stats));
}

export function getLockedAchievements(stats: AchievementStats): Achievement[] {
  return ACHIEVEMENTS.filter(a => !a.check(stats));
}

export const CATEGORY_LABELS: Record<Achievement['category'], string> = {
  streak: 'Racha', activity: 'Actividades', xp: 'Experiencia',
  social: 'Social', discipline: 'Disciplinas', duel: 'Duelos',
};
