import { ATTRIBUTE_COLORS, AttributeName } from '@/lib/constants';

interface AvatarDisplayProps {
  size?: number;
  dominantAttribute: AttributeName;
  level: number;
  username?: string;
  avatarUrl?: string | null;
  onClick?: () => void;
}

export function AvatarDisplay({ size = 120, dominantAttribute, level, username, avatarUrl, onClick }: AvatarDisplayProps) {
  const ringColor = ATTRIBUTE_COLORS[dominantAttribute];
  const initials = username ? username.slice(0, 2).toUpperCase() : '??';

  return (
    <div
      className={`relative flex items-center justify-center ${onClick ? 'cursor-pointer' : ''}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `3px solid ${ringColor}`,
          boxShadow: `0 0 20px ${ringColor}40`,
        }}
      />
      {/* Inner circle / avatar image */}
      <div
        className="rounded-full bg-card flex items-center justify-center overflow-hidden"
        style={{ width: size - 16, height: size - 16 }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className="text-2xl font-bold text-foreground">{initials}</span>
        )}
      </div>
      {/* Level badge */}
      <div className="absolute -bottom-1 bg-primary text-primary-foreground text-xs font-bold px-3 py-0.5 rounded-full">
        Lv.{level}
      </div>
      {/* Edit indicator */}
      {onClick && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <span className="text-[10px] text-primary-foreground">✏️</span>
        </div>
      )}
    </div>
  );
}
