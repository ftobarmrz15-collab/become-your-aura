import { Flame, Zap, Trophy } from 'lucide-react';

interface DailyStatsProps {
  xpToday: number;
  currentStreak: number;
  nextMilestone?: string;
}

export function DailyStats({ xpToday, currentStreak, nextMilestone }: DailyStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border">
        <Zap className="w-4 h-4 text-accent" />
        <span className="text-lg font-bold text-foreground">{xpToday}</span>
        <span className="text-[10px] text-muted-foreground">XP hoy</span>
      </div>
      <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border">
        <Flame className="w-4 h-4 text-destructive" />
        <span className="text-lg font-bold text-foreground">{currentStreak}</span>
        <span className="text-[10px] text-muted-foreground">Racha</span>
      </div>
      <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border">
        <Trophy className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-foreground text-center leading-tight mt-1">
          {nextMilestone || 'Nivel +1'}
        </span>
        <span className="text-[10px] text-muted-foreground">Próximo</span>
      </div>
    </div>
  );
}
