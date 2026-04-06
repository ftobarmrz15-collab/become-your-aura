import { ATTRIBUTE_COLORS, AttributeName } from '@/lib/constants';

interface AvatarCircleProps {
  size?: number;
  dominantAttribute: AttributeName;
  level: number;
  username?: string;
}

export function AvatarCircle({ size = 120, dominantAttribute, level, username }: AvatarCircleProps) {
  const ringColor = ATTRIBUTE_COLORS[dominantAttribute];
  const initials = username ? username.slice(0, 2).toUpperCase() : '??';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full animate-ring-pulse"
        style={{
          border: `3px solid ${ringColor}`,
          boxShadow: `0 0 20px ${ringColor}40`,
        }}
      />
      {/* Inner circle */}
      <div className="rounded-full bg-card flex items-center justify-center"
        style={{ width: size - 16, height: size - 16 }}
      >
        <span className="text-2xl font-bold text-foreground">{initials}</span>
      </div>
      {/* Level badge */}
      <div className="absolute -bottom-1 bg-primary text-primary-foreground text-xs font-bold px-3 py-0.5 rounded-full">
        Lv.{level}
      </div>
    </div>
  );
}
