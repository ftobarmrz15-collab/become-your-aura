import { ATTRIBUTE_COLORS, ATTRIBUTE_LABELS, AttributeName } from '@/lib/constants';

interface AttributeBarProps {
  attribute: AttributeName;
  value: number;
  max?: number;
}

export function AttributeBar({ attribute, value, max = 100 }: AttributeBarProps) {
  const color = ATTRIBUTE_COLORS[attribute];
  const label = ATTRIBUTE_LABELS[attribute];
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-20 text-right">{label}</span>
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium text-foreground w-8">{value}</span>
    </div>
  );
}
