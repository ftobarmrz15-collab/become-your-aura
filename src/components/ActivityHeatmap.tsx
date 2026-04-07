interface ActivityHeatmapProps {
  activities: { completed_at: string }[];
}

export function ActivityHeatmap({ activities }: ActivityHeatmapProps) {
  // Build last 12 weeks (84 days)
  const today = new Date();
  const days: { date: string; count: number; dayOfWeek: number }[] = [];

  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, count: 0, dayOfWeek: d.getDay() });
  }

  // Count activities per day
  activities.forEach((a) => {
    const day = a.completed_at.split('T')[0];
    const found = days.find(d => d.date === day);
    if (found) found.count++;
  });

  // Color intensity
  const getColor = (count: number) => {
    if (count === 0) return 'bg-secondary';
    if (count === 1) return 'bg-primary/30';
    if (count === 2) return 'bg-primary/55';
    if (count === 3) return 'bg-primary/75';
    return 'bg-primary';
  };

  const getTooltip = (d: { date: string; count: number }) => {
    if (d.count === 0) return `${d.date}: sin actividad`;
    return `${d.date}: ${d.count} actividad${d.count > 1 ? 'es' : ''}`;
  };

  // Pad start to align with day of week
  const firstDayOfWeek = days[0].dayOfWeek;
  const padded = [...Array(firstDayOfWeek).fill(null), ...days];

  // Split into weeks (columns)
  const weeks: (typeof days[0] | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const weekLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  const totalActivities = days.reduce((s, d) => s + d.count, 0);
  const activeDays = days.filter(d => d.count > 0).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Actividad</h2>
        <span className="text-xs text-muted-foreground">{totalActivities} en 12 semanas</span>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border overflow-x-auto">
        <div className="flex gap-1" style={{ minWidth: 'fit-content' }}>
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            {weekLabels.map((l, i) => (
              <div key={i} className="h-[10px] w-3 flex items-center justify-center text-[7px] text-muted-foreground">
                {i % 2 === 0 ? l : ''}
              </div>
            ))}
          </div>

          {/* Weeks grid */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`h-[10px] w-[10px] rounded-[2px] ${day ? getColor(day.count) : 'opacity-0'}`}
                  title={day ? getTooltip(day) : ''}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[9px] text-muted-foreground">Menos</span>
          {[0, 1, 2, 3, 4].map(n => (
            <div key={n} className={`h-[10px] w-[10px] rounded-[2px] ${getColor(n)}`} />
          ))}
          <span className="text-[9px] text-muted-foreground">Más</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2 text-center">
        {activeDays} {activeDays === 1 ? 'día activo' : 'días activos'} en los últimos 3 meses
      </p>
    </div>
  );
}
