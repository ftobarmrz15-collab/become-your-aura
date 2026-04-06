interface XPBarProps {
  currentXP: number;
  nextLevelXP: number;
  previousLevelXP: number;
}

export function XPBar({ currentXP, nextLevelXP, previousLevelXP }: XPBarProps) {
  const progress = nextLevelXP > previousLevelXP
    ? ((currentXP - previousLevelXP) / (nextLevelXP - previousLevelXP)) * 100
    : 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{currentXP} XP</span>
        <span>{nextLevelXP} XP</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}
