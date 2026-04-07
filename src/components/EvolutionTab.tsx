import { EVOLUTION_STAGES } from '@/lib/avatar-evolution';
import { ATTRIBUTES, ATTRIBUTE_LABELS, ATTRIBUTE_COLORS, type AttributeName } from '@/lib/constants';

interface EvolutionTabProps {
  attrs: Record<string, number>;
}

function attrLevel(val: number): number {
  if (val >= 40) return 3;
  if (val >= 20) return 2;
  if (val >= 8) return 1;
  return 0;
}

export function EvolutionTab({ attrs }: EvolutionTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Tu avatar evoluciona según tu XP en cada disciplina.</p>
      {ATTRIBUTES.map(attr => {
        const val = attrs[attr] ?? 0;
        const level = attrLevel(val);
        const stages = EVOLUTION_STAGES[attr];
        if (!stages) return null;

        return (
          <div key={attr} className="p-3 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">{stages.name}</span>
              <span className="text-xs text-muted-foreground">{val} XP · Etapa {level}/3</span>
            </div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= level ? 'opacity-100' : 'opacity-20'}`}
                  style={{ backgroundColor: `hsl(var(--attr-${attr}))` }} />
              ))}
            </div>
            <div className="space-y-1">
              {stages.stages.map((desc, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs ${i < level ? 'text-foreground' : 'text-muted-foreground opacity-50'}`}>
                  <span>{i < level ? '✅' : '🔒'}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
