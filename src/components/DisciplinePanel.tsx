import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ATTRIBUTES, ATTRIBUTE_LABELS, ATTRIBUTE_COLORS, type AttributeName } from '@/lib/constants';

const ATTRIBUTE_ICONS: Record<AttributeName, string> = {
  strength: '💪',
  discipline: '🧘',
  creativity: '🎨',
  charisma: '🌊',
  flow: '⚡',
  courage: '🔥',
  focus: '🧠',
  freedom: '🏃',
};

// Each attribute has levels: every 25 points = 1 level
function getAttrLevel(value: number): { level: number; current: number; next: number; pct: number } {
  const level = Math.floor(value / 25) + 1;
  const current = (level - 1) * 25;
  const next = level * 25;
  const pct = ((value - current) / (next - current)) * 100;
  return { level, current, next, pct: Math.min(pct, 100) };
}

interface DisciplinePanelProps {
  attrs: Record<string, number>;
}

export function DisciplinePanel({ attrs }: DisciplinePanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <h3 className="text-sm font-semibold text-foreground">Disciplinas</h3>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Bars */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          collapsed ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'
        }`}
      >
        <div className="px-4 pb-4 space-y-3">
          {ATTRIBUTES.map((attr) => {
            const value = attrs[attr] ?? 0;
            const { level, next, pct } = getAttrLevel(value);
            const color = ATTRIBUTE_COLORS[attr];

            return (
              <div key={attr} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{ATTRIBUTE_ICONS[attr]}</span>
                    <span className="text-xs font-medium text-foreground">{ATTRIBUTE_LABELS[attr]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{value}/{next}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      Lv.{level}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out animate-bar-fill"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                      boxShadow: `0 0 8px ${color}60`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
