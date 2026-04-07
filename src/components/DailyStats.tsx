import { Zap, Trophy } from 'lucide-react';

interface DailyStatsProps {
  xpToday: number;
  currentStreak: number;
  nextMilestone?: string;
}

function StreakFlame({ streak }: { streak: number }) {
  // Size grows with streak
  const size = streak === 0 ? 14 : streak < 3 ? 15 : streak < 7 ? 17 : streak < 14 ? 19 : streak < 30 ? 21 : 24;
  const color = streak === 0
    ? 'text-muted-foreground'
    : streak < 3 ? 'text-orange-400'
    : streak < 7 ? 'text-orange-500'
    : streak < 14 ? 'text-red-500'
    : streak < 30 ? 'text-red-600'
    : 'text-yellow-400';
  const pulse = streak >= 7;

  return (
    <span
      className={`${color} ${pulse ? 'animate-pulse' : ''}`}
      style={{ fontSize: size }}
      role="img"
      aria-label="racha"
    >
      🔥
    </span>
  );
}

export function DailyStats({ xpToday, currentStreak, nextMilestone }: DailyStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border">
        <Zap className="w-4 h-4 text-accent" />
        <span className="text-lg font-bold text-foreground">{xpToday}</span>
        <span className="text-[10px] text-muted-foreground">XP hoy</span>
      </div>

      <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border relative">
        <StreakFlame streak={currentStreak} />
        <span className="text-lg font-bold text-foreground">{currentStreak}</span>
        <span className="text-[10px] text-muted-foreground">
          {currentStreak === 0 ? 'Racha' : currentStreak === 1 ? '¡1 día!' : `${currentStreak} días`}
        </span>
        {currentStreak >= 7 && (
          <span className="absolute -top-1 -right-1 text-[9px] bg-orange-500 text-white rounded-full px-1 font-bold">
            🔥 HOT
          </span>
        )}
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
