import { SKIN_TONES, HAIR_COLORS as HAIR_COLOR_OPTIONS } from '@/lib/avatar-options';
import { type AttributeName } from '@/lib/constants';

interface AvatarSVGProps {
  config: {
    skin_tone: string;
    hair_style: string;
    hair_color: string;
    outfit: string;
    facial_hair: string;
    eye_color: string;
  };
  attributes: Record<string, number>;
  size?: number;
  className?: string;
}

function getAttrLevel(val: number): number {
  if (val >= 30) return 3;
  if (val >= 15) return 2;
  if (val >= 5) return 1;
  return 0;
}

function getSkinColor(id: string): string {
  return SKIN_TONES.find(s => s.id === id)?.color ?? '#C68642';
}

function getHairColor(id: string): string {
  return HAIR_COLOR_OPTIONS.find(h => h.id === id)?.color ?? '#1a1a1a';
}

export default function AvatarSVG({ config, attributes, size = 200, className = '' }: AvatarSVGProps) {
  const skin = getSkinColor(config.skin_tone);
  const hair = getHairColor(config.hair_color);

  const strength = getAttrLevel(attributes.strength ?? 0);
  const discipline = getAttrLevel(attributes.discipline ?? 0);
  const creativity = getAttrLevel(attributes.creativity ?? 0);
  const charisma = getAttrLevel(attributes.charisma ?? 0);
  const flow = getAttrLevel(attributes.flow ?? 0);
  const courage = getAttrLevel(attributes.courage ?? 0);
  const focus = getAttrLevel(attributes.focus ?? 0);
  const freedom = getAttrLevel(attributes.freedom ?? 0);

  // Dynamic body based on attributes
  const armWidth = 12 + strength * 3;
  const shoulderWidth = 38 + strength * 4;
  const chestWidth = 34;

  // Clothes color evolves with charisma
  const clothesColors = [
    'hsl(220, 14%, 20%)',
    'hsl(220, 30%, 28%)',
    'hsl(260, 40%, 35%)',
    'hsl(42, 76%, 45%)',
  ];
  const clothesColor = clothesColors[charisma];

  // Flow accent
  const flowAccent = flow > 0 ? `hsl(170, ${40 + flow * 15}%, ${40 + flow * 5}%)` : 'transparent';

  // Courage glow
  const courageGlow = courage > 0 ? `0 0 ${courage * 8}px hsla(25, 90%, 55%, ${0.2 + courage * 0.15})` : 'none';

  // Discipline belt/headband
  const showHeadband = discipline >= 2;
  const showBelt = discipline >= 1;

  // Creativity particles
  const creativityAccent = creativity > 0 ? `hsl(${280 + creativity * 20}, 70%, ${50 + creativity * 5}%)` : 'transparent';

  // Freedom - flowing cape/scarf element
  const showFreedomScarf = freedom >= 2;

  // Focus - eye glow
  const focusGlow = focus >= 2;

  // Outfit-based clothes style
  const isAthletic = config.outfit === 'athletic' || config.outfit === 'tank-top';
  const isFormal = config.outfit === 'formal' || config.outfit === 'elegant';

  return (
    <div className={className} style={{ filter: courageGlow !== 'none' ? `drop-shadow(${courageGlow})` : undefined }}>
      <svg width={size} height={size} viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg">

        {/* Freedom scarf */}
        {showFreedomScarf && (
          <path
            d={`M${100 - shoulderWidth / 2 - 5} 100 Q${60 - freedom * 5} 130 ${65 - freedom * 3} 170`}
            stroke={`hsl(200, ${50 + freedom * 10}%, 60%)`}
            strokeWidth="4"
            fill="none"
            opacity="0.5"
            strokeLinecap="round"
          />
        )}

        {/* Torso */}
        <path
          d={`M${100 - chestWidth / 2} 120 
              Q${100 - shoulderWidth / 2} 108 ${100 - shoulderWidth / 2} 100 
              L${100 + shoulderWidth / 2} 100 
              Q${100 + shoulderWidth / 2} 108 ${100 + chestWidth / 2} 120 
              L${100 + chestWidth / 2 - 2} 170 
              Q100 175 ${100 - chestWidth / 2 + 2} 170 Z`}
          fill={clothesColor}
          stroke="hsla(0,0%,100%,0.08)"
          strokeWidth="0.5"
        />

        {/* Flow lines on clothes */}
        {flow >= 1 && (
          <>
            <path
              d={`M${100 - chestWidth / 2 + 4} 130 Q100 ${135 + flow * 3} ${100 + chestWidth / 2 - 4} 130`}
              stroke={flowAccent}
              strokeWidth="1.5"
              fill="none"
              opacity="0.6"
            />
            {flow >= 2 && (
              <path
                d={`M${100 - chestWidth / 2 + 4} 145 Q100 ${150 + flow * 3} ${100 + chestWidth / 2 - 4} 145`}
                stroke={flowAccent}
                strokeWidth="1"
                fill="none"
                opacity="0.4"
              />
            )}
          </>
        )}

        {/* Belt for discipline */}
        {showBelt && (
          <rect
            x={100 - chestWidth / 2 + 2}
            y="165"
            width={chestWidth - 4}
            height="4"
            rx="2"
            fill={discipline >= 2 ? 'hsl(42, 76%, 55%)' : 'hsl(220, 20%, 30%)'}
          />
        )}

        {/* V-neck for formal */}
        {isFormal && (
          <path d="M92 100 L100 115 L108 100" stroke="hsla(0,0%,100%,0.15)" strokeWidth="1" fill="none" />
        )}

        {/* Sport stripes */}
        {isAthletic && (
          <>
            <line x1="92" y1="100" x2="92" y2="110" stroke={creativityAccent !== 'transparent' ? creativityAccent : flowAccent} strokeWidth="2" opacity="0.7" />
            <line x1="108" y1="100" x2="108" y2="110" stroke={creativityAccent !== 'transparent' ? creativityAccent : flowAccent} strokeWidth="2" opacity="0.7" />
          </>
        )}

        {/* Left arm */}
        <path
          d={`M${100 - shoulderWidth / 2} 102 
              L${100 - shoulderWidth / 2 - armWidth * 0.6} 155 
              L${100 - shoulderWidth / 2 - armWidth * 0.6 + armWidth} 155
              L${100 - shoulderWidth / 2 + 6} 108 Z`}
          fill={clothesColor}
          stroke="hsla(0,0%,0%,0.15)"
          strokeWidth="0.5"
        />
        <ellipse
          cx={100 - shoulderWidth / 2 - armWidth * 0.6 + armWidth / 2}
          cy="158"
          rx={armWidth * 0.35}
          ry={armWidth * 0.3}
          fill={skin}
        />

        {/* Right arm */}
        <path
          d={`M${100 + shoulderWidth / 2} 102 
              L${100 + shoulderWidth / 2 + armWidth * 0.6} 155 
              L${100 + shoulderWidth / 2 + armWidth * 0.6 - armWidth} 155
              L${100 + shoulderWidth / 2 - 6} 108 Z`}
          fill={clothesColor}
          stroke="hsla(0,0%,0%,0.15)"
          strokeWidth="0.5"
        />
        <ellipse
          cx={100 + shoulderWidth / 2 + armWidth * 0.6 - armWidth / 2}
          cy="158"
          rx={armWidth * 0.35}
          ry={armWidth * 0.3}
          fill={skin}
        />

        {/* Legs */}
        <rect x="78" y="168" width="16" height="50" rx="6" fill="hsl(220, 14%, 16%)" />
        <rect x="106" y="168" width="16" height="50" rx="6" fill="hsl(220, 14%, 16%)" />
        {/* Shoes */}
        <ellipse cx="86" cy="220" rx="10" ry="5" fill={charisma >= 2 ? 'hsl(42, 50%, 40%)' : 'hsl(220, 14%, 12%)'} />
        <ellipse cx="114" cy="220" rx="10" ry="5" fill={charisma >= 2 ? 'hsl(42, 50%, 40%)' : 'hsl(220, 14%, 12%)'} />

        {/* Neck */}
        <rect x="93" y="88" width="14" height="14" rx="4" fill={skin} />

        {/* Head */}
        <ellipse cx="100" cy="60" rx="30" ry="32" fill={skin} />

        {/* Eyes */}
        <ellipse cx="88" cy="58" rx="4" ry="3.5" fill="white" />
        <ellipse cx="112" cy="58" rx="4" ry="3.5" fill="white" />
        <circle cx="89" cy="58" r="2" fill="#1a1a2e" />
        <circle cx="113" cy="58" r="2" fill="#1a1a2e" />
        <circle cx="90" cy="57" r="0.7" fill="white" />
        <circle cx="114" cy="57" r="0.7" fill="white" />

        {/* Focus glow on eyes */}
        {focusGlow && (
          <>
            <ellipse cx="88" cy="58" rx="5.5" ry="5" fill="none" stroke="hsl(200, 80%, 60%)" strokeWidth="0.8" opacity="0.5" />
            <ellipse cx="112" cy="58" rx="5.5" ry="5" fill="none" stroke="hsl(200, 80%, 60%)" strokeWidth="0.8" opacity="0.5" />
          </>
        )}

        {/* Eyebrows - courage intensity */}
        <path
          d={`M82 ${52 - courage * 0.5} Q88 ${49 - courage} 94 ${52 - courage * 0.5}`}
          stroke={hair}
          strokeWidth={1.5 + courage * 0.3}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M106 ${52 - courage * 0.5} Q112 ${49 - courage} 118 ${52 - courage * 0.5}`}
          stroke={hair}
          strokeWidth={1.5 + courage * 0.3}
          fill="none"
          strokeLinecap="round"
        />

        {/* Nose */}
        <path d="M98 62 Q100 68 102 62" stroke={`${skin}99`} strokeWidth="1.2" fill="none" />

        {/* Mouth - charisma smile */}
        <path
          d={`M92 72 Q100 ${76 + charisma * 1.5} 108 72`}
          stroke="hsl(0, 40%, 55%)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Facial hair */}
        {config.facial_hair === 'stubble' && (
          <g opacity="0.3">
            {[92, 96, 100, 104, 108].map(x => (
              <circle key={x} cx={x} cy="78" r="0.5" fill={hair} />
            ))}
            {[94, 98, 102, 106].map(x => (
              <circle key={x} cx={x} cy="80" r="0.5" fill={hair} />
            ))}
          </g>
        )}
        {(config.facial_hair === 'short-beard' || config.facial_hair === 'long-beard') && (
          <path
            d={`M85 72 Q85 ${config.facial_hair === 'long-beard' ? 95 : 85} 100 ${config.facial_hair === 'long-beard' ? 98 : 88} Q115 ${config.facial_hair === 'long-beard' ? 95 : 85} 115 72`}
            fill={hair}
            opacity="0.6"
          />
        )}
        {config.facial_hair === 'mustache' && (
          <path d="M92 70 Q100 74 108 70" stroke={hair} strokeWidth="2.5" fill="none" opacity="0.7" />
        )}
        {config.facial_hair === 'goatee' && (
          <>
            <path d="M92 70 Q100 74 108 70" stroke={hair} strokeWidth="2" fill="none" opacity="0.6" />
            <path d="M96 76 Q100 86 104 76" fill={hair} opacity="0.5" />
          </>
        )}

        {/* Hair */}
        {renderHair(config.hair_style, hair)}

        {/* Headband for discipline */}
        {showHeadband && (
          <rect
            x="68"
            y="40"
            width="64"
            height="5"
            rx="2.5"
            fill={discipline >= 3 ? 'hsl(0, 72%, 55%)' : 'hsl(42, 76%, 55%)'}
          />
        )}

        {/* Creativity particles */}
        {creativity >= 2 && (
          <g opacity={0.3 + creativity * 0.1}>
            <circle cx="55" cy="45" r="2" fill={creativityAccent} />
            <circle cx="145" cy="50" r="1.5" fill={creativityAccent} />
            <circle cx="50" cy="80" r="1.5" fill={creativityAccent} />
            <circle cx="150" cy="85" r="2" fill={creativityAccent} />
            {creativity >= 3 && (
              <>
                <circle cx="60" cy="130" r="1.5" fill={creativityAccent} />
                <circle cx="140" cy="125" r="2" fill={creativityAccent} />
                <circle cx="48" cy="65" r="1" fill="hsl(42, 76%, 55%)" />
                <circle cx="152" cy="70" r="1" fill="hsl(42, 76%, 55%)" />
              </>
            )}
          </g>
        )}

        {/* Courage scar at max */}
        {courage >= 3 && (
          <path
            d="M115 50 L120 45 L118 52"
            stroke="hsla(0, 50%, 60%, 0.5)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
        )}

      </svg>
    </div>
  );
}

function renderHair(style: string, color: string) {
  switch (style) {
    case 'buzzed':
      return <ellipse cx="100" cy="42" rx="29" ry="18" fill={color} opacity="0.7" />;
    case 'short':
      return (
        <path
          d="M70 55 Q70 25 100 22 Q130 25 130 55 L128 45 Q125 30 100 27 Q75 30 72 45 Z"
          fill={color}
        />
      );
    case 'medium':
      return (
        <>
          <path d="M68 60 Q68 22 100 18 Q132 22 132 60 L130 48 Q128 28 100 24 Q72 28 70 48 Z" fill={color} />
          <path d="M68 60 Q65 75 68 82" stroke={color} strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M132 60 Q135 75 132 82" stroke={color} strokeWidth="8" fill="none" strokeLinecap="round" />
        </>
      );
    case 'long':
    case 'ponytail':
      return (
        <>
          <path d="M66 60 Q66 20 100 16 Q134 20 134 60 L132 45 Q130 26 100 22 Q70 26 68 45 Z" fill={color} />
          <path d="M66 60 Q62 90 66 110" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M134 60 Q138 90 134 110" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />
        </>
      );
    case 'curly':
    case 'afro':
      return (
        <>
          <path d="M66 58 Q66 20 100 16 Q134 20 134 58" fill={color} />
          {[70, 80, 90, 100, 110, 120, 130].map(x => (
            <circle key={x} cx={x} cy={30 + Math.sin(x) * 4} r={style === 'afro' ? 10 : 8} fill={color} />
          ))}
          <circle cx="66" cy="60" r={style === 'afro' ? 9 : 7} fill={color} />
          <circle cx="134" cy="60" r={style === 'afro' ? 9 : 7} fill={color} />
          <circle cx="64" cy="72" r={style === 'afro' ? 8 : 6} fill={color} />
          <circle cx="136" cy="72" r={style === 'afro' ? 8 : 6} fill={color} />
        </>
      );
    case 'mohawk':
      return (
        <>
          <ellipse cx="100" cy="42" rx="29" ry="18" fill={color} opacity="0.4" />
          {[85, 92, 100, 108, 115].map((x, i) => (
            <path key={x} d={`M${x - 4} 35 L${x} ${10 - i * 0.5} L${x + 4} 35`} fill={color} />
          ))}
        </>
      );
    case 'braids':
      return (
        <>
          <path d="M68 60 Q68 22 100 18 Q132 22 132 60 L130 48 Q128 28 100 24 Q72 28 70 48 Z" fill={color} />
          {/* Braids hanging down */}
          <path d="M72 55 Q68 80 72 110 Q74 115 76 110 Q80 80 76 55" fill={color} />
          <path d="M128 55 Q132 80 128 110 Q126 115 124 110 Q120 80 124 55" fill={color} />
        </>
      );
    case 'bun':
      return (
        <>
          <path d="M70 55 Q70 25 100 22 Q130 25 130 55 L128 45 Q125 30 100 27 Q75 30 72 45 Z" fill={color} />
          <circle cx="100" cy="22" r="12" fill={color} />
        </>
      );
    default:
      return <path d="M70 55 Q70 25 100 22 Q130 25 130 55 L128 45 Q125 30 100 27 Q75 30 72 45 Z" fill={color} />;
  }
}
