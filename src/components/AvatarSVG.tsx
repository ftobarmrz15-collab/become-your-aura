import { SKIN_TONES, HAIR_COLORS as HAIR_COLOR_OPTIONS, EYE_COLORS } from '@/lib/avatar-options';
import { getEvolutionProfile, type EvolutionProfile } from '@/lib/avatar-evolution';

interface AvatarSVGProps {
  config: {
    skin_tone: string;
    hair_style: string;
    hair_color: string;
    outfit: string;
    facial_hair: string;
    eye_color: string;
    face_shape?: string;
    eye_shape?: string;
    nose?: string;
    mouth?: string;
    gender?: string;
    eyebrows?: string;
  };
  attributes: Record<string, number>;
  size?: number;
  className?: string;
  showAura?: boolean;
}

function getSkinColor(id: string): string {
  return SKIN_TONES.find(s => s.id === id)?.color ?? '#C68642';
}
function getHairColor(id: string): string {
  return HAIR_COLOR_OPTIONS.find(h => h.id === id)?.color ?? '#1a1a1a';
}
function getEyeColor(id: string): string {
  return EYE_COLORS.find(e => e.id === id)?.color ?? '#6B4226';
}

export default function AvatarSVG({ config, attributes, size = 200, className = '', showAura = false }: AvatarSVGProps) {
  const skin = getSkinColor(config.skin_tone);
  const hair = getHairColor(config.hair_color);
  const eyeColor = getEyeColor(config.eye_color);
  const evo = getEvolutionProfile(attributes);

  // Body dimensions from evolution
  const shoulderW = evo.bodyBuild === 'muscular' ? 54 : evo.bodyBuild === 'athletic' ? 48 : evo.bodyBuild === 'average' ? 42 : 38;
  const armW = evo.bodyBuild === 'muscular' ? 22 : evo.bodyBuild === 'athletic' ? 18 : 14;
  const chestW = evo.bodyBuild === 'muscular' ? 42 : evo.bodyBuild === 'athletic' ? 38 : 34;

  // Clothes color from outfit + evolution
  const clothesColor = getClothesColor(config.outfit, evo);
  const clothesAccent = getClothesAccent(config.outfit, evo);

  // Face shape
  const faceRx = config.face_shape === 'square' ? 26 : config.face_shape === 'round' ? 32 : 28;
  const faceRy = config.face_shape === 'square' ? 30 : config.face_shape === 'round' ? 30 : 33;

  // Eyebrow thickness
  const browWidth = config.eyebrows === 'thick' ? 2.5 : config.eyebrows === 'thin' ? 1 : 1.8;

  // Mouth style
  const mouthCurve = config.mouth === 'smile' ? 5 : config.mouth === 'serious' ? -1 : config.mouth === 'smirk' ? 3 : 2;

  // Expression override from evolution
  const exprCurve = evo.expressionType === 'confident' ? mouthCurve + 2
    : evo.expressionType === 'serene' ? 1
    : evo.expressionType === 'fierce' ? -2
    : mouthCurve;

  // Gender affects body
  const isFeminine = config.gender === 'feminine';

  return (
    <div className={className}>
      <svg width={size} height={size} viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Aura glow */}
        {showAura && evo.auraIntensity > 0.15 && (
          <ellipse cx="100" cy="120" rx="90" ry="110"
            fill={evo.auraColor} opacity={evo.auraIntensity * 0.3} filter="url(#auraBlur)" />
        )}
        <defs>
          <filter id="auraBlur"><feGaussianBlur stdDeviation="18" /></filter>
          <filter id="glow"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>

        {/* === BODY === */}
        {/* Legs */}
        <rect x={isFeminine ? 80 : 78} y="168" width={isFeminine ? 14 : 16} height="50" rx="6" fill="hsl(220, 14%, 16%)" />
        <rect x={isFeminine ? 106 : 106} y="168" width={isFeminine ? 14 : 16} height="50" rx="6" fill="hsl(220, 14%, 16%)" />
        {/* Shoes */}
        <ellipse cx="86" cy="220" rx="10" ry="5" fill={evo.primaryLevel >= 2 ? clothesAccent : 'hsl(220, 14%, 12%)'} />
        <ellipse cx="114" cy="220" rx="10" ry="5" fill={evo.primaryLevel >= 2 ? clothesAccent : 'hsl(220, 14%, 12%)'} />

        {/* Torso */}
        <path
          d={`M${100 - chestW / 2} 120 
              Q${100 - shoulderW / 2} 108 ${100 - shoulderW / 2} 100 
              L${100 + shoulderW / 2} 100 
              Q${100 + shoulderW / 2} 108 ${100 + chestW / 2} 120 
              L${100 + chestW / 2 - 2} 170 
              Q100 175 ${100 - chestW / 2 + 2} 170 Z`}
          fill={clothesColor}
          stroke="hsla(0,0%,100%,0.06)"
          strokeWidth="0.5"
        />

        {/* Outfit details */}
        {renderOutfitDetails(config.outfit, chestW, shoulderW, clothesAccent, evo)}

        {/* Evolution belt */}
        {evo.primaryLevel >= 1 && (
          <rect x={100 - chestW / 2 + 2} y="165" width={chestW - 4} height="4" rx="2"
            fill={evo.primaryLevel >= 3 ? 'hsl(38, 92%, 55%)' : 'hsl(220, 20%, 30%)'} />
        )}

        {/* Arms */}
        {renderArm('left', shoulderW, armW, clothesColor, skin)}
        {renderArm('right', shoulderW, armW, clothesColor, skin)}

        {/* Neck */}
        <rect x="93" y="88" width="14" height="14" rx="4" fill={skin} />

        {/* === HEAD === */}
        <ellipse cx="100" cy="60" rx={faceRx} ry={faceRy} fill={skin} />

        {/* Eyes */}
        {renderEyes(config.eye_shape ?? 'almond', eyeColor, evo)}

        {/* Eyebrows */}
        <path d={`M82 51 Q88 ${48 - evo.primaryLevel * 0.3} 94 51`}
          stroke={hair} strokeWidth={browWidth} fill="none" strokeLinecap="round" />
        <path d={`M106 51 Q112 ${48 - evo.primaryLevel * 0.3} 118 51`}
          stroke={hair} strokeWidth={browWidth} fill="none" strokeLinecap="round" />

        {/* Nose */}
        {renderNose(config.nose ?? 'straight', skin)}

        {/* Mouth */}
        <path
          d={`M92 72 Q100 ${72 + exprCurve} 108 72`}
          stroke="hsl(0, 40%, 55%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Facial hair */}
        {renderFacialHair(config.facial_hair, hair)}

        {/* Hair */}
        {renderHair(config.hair_style, hair)}

        {/* Evolution headband */}
        {evo.primaryLevel >= 2 && evo.primary === 'discipline' && (
          <rect x="68" y="40" width="64" height="5" rx="2.5"
            fill={evo.primaryLevel >= 3 ? 'hsl(0, 72%, 55%)' : 'hsl(38, 76%, 55%)'} />
        )}

        {/* Evolution accessories */}
        {renderEvolutionAccessories(evo, hair)}

        {/* Creativity particles */}
        {evo.unlockedAccessories.includes('color-glasses') && evo.primaryLevel >= 2 && (
          <g opacity={0.3 + evo.primaryLevel * 0.15}>
            <circle cx="52" cy="45" r="2" fill="hsl(271, 81%, 56%)" />
            <circle cx="148" cy="50" r="1.5" fill="hsl(330, 81%, 60%)" />
            <circle cx="48" cy="80" r="1.5" fill="hsl(271, 81%, 56%)" />
            <circle cx="152" cy="85" r="2" fill="hsl(38, 92%, 50%)" />
          </g>
        )}

        {/* Chain accessory for charisma */}
        {evo.unlockedAccessories.includes('chain') && (
          <path d="M92 98 Q100 105 108 98" stroke="hsl(38, 70%, 50%)" strokeWidth="1.5" fill="none" opacity="0.8" />
        )}
      </svg>
    </div>
  );
}

// === OUTFIT COLORS ===
function getClothesColor(outfit: string, evo: EvolutionProfile): string {
  const base: Record<string, string> = {
    casual: 'hsl(220, 14%, 22%)',
    streetwear: 'hsl(0, 0%, 15%)',
    athletic: 'hsl(220, 50%, 25%)',
    formal: 'hsl(220, 20%, 18%)',
    hoodie: 'hsl(240, 10%, 25%)',
    'tank-top': 'hsl(220, 14%, 28%)',
    university: 'hsl(0, 60%, 30%)',
    elegant: 'hsl(260, 20%, 15%)',
  };
  let color = base[outfit] ?? base.casual;

  // Evolution override on high levels
  if (evo.primaryLevel >= 3) {
    const evoColors: Record<string, string> = {
      creativity: 'hsl(271, 40%, 30%)',
      charisma: 'hsl(0, 0%, 12%)',
      discipline: 'hsl(220, 10%, 85%)',
      focus: 'hsl(220, 30%, 20%)',
    };
    color = evoColors[evo.primary] ?? color;
  }
  return color;
}

function getClothesAccent(outfit: string, evo: EvolutionProfile): string {
  if (evo.primaryLevel >= 2) {
    const accents: Record<string, string> = {
      strength: 'hsl(0, 70%, 45%)',
      creativity: 'hsl(271, 60%, 50%)',
      charisma: 'hsl(38, 80%, 50%)',
      flow: 'hsl(142, 60%, 40%)',
      discipline: 'hsl(38, 92%, 55%)',
      courage: 'hsl(25, 90%, 50%)',
      focus: 'hsl(217, 70%, 50%)',
      freedom: 'hsl(173, 60%, 45%)',
    };
    return accents[evo.primary] ?? 'hsl(220, 14%, 30%)';
  }
  return 'hsl(220, 14%, 12%)';
}

// === OUTFIT DETAILS ===
function renderOutfitDetails(outfit: string, chestW: number, shoulderW: number, accent: string, evo: EvolutionProfile) {
  const elements: JSX.Element[] = [];

  if (outfit === 'formal' || outfit === 'elegant') {
    elements.push(<path key="vneck" d="M92 100 L100 115 L108 100" stroke="hsla(0,0%,100%,0.15)" strokeWidth="1" fill="none" />);
    elements.push(<circle key="btn1" cx="100" cy="125" r="1.5" fill="hsla(0,0%,100%,0.2)" />);
    elements.push(<circle key="btn2" cx="100" cy="135" r="1.5" fill="hsla(0,0%,100%,0.2)" />);
  }
  if (outfit === 'athletic' || outfit === 'tank-top') {
    elements.push(
      <line key="s1" x1="92" y1="100" x2="92" y2="112" stroke={accent} strokeWidth="2" opacity="0.7" />,
      <line key="s2" x1="108" y1="100" x2="108" y2="112" stroke={accent} strokeWidth="2" opacity="0.7" />
    );
  }
  if (outfit === 'hoodie') {
    elements.push(
      <path key="hood" d={`M${100 - shoulderW / 2 + 5} 100 Q100 96 ${100 + shoulderW / 2 - 5} 100`}
        stroke="hsla(0,0%,100%,0.08)" strokeWidth="2" fill="none" />
    );
    elements.push(<line key="zip" x1="100" y1="100" x2="100" y2="170" stroke="hsla(0,0%,100%,0.06)" strokeWidth="1" />);
  }
  if (outfit === 'university') {
    elements.push(
      <text key="u" x="100" y="140" textAnchor="middle" fontSize="10" fill="hsla(0,0%,100%,0.15)" fontWeight="bold">U</text>
    );
  }

  // Flow lines on clothes
  if (evo.primaryLevel >= 1 && (evo.primary === 'flow' || evo.secondary === 'flow')) {
    elements.push(
      <path key="flow1"
        d={`M${100 - chestW / 2 + 4} 130 Q100 138 ${100 + chestW / 2 - 4} 130`}
        stroke="hsl(142, 60%, 45%)" strokeWidth="1.2" fill="none" opacity="0.4" />
    );
  }

  return <>{elements}</>;
}

// === ARMS ===
function renderArm(side: 'left' | 'right', shoulderW: number, armW: number, clothesColor: string, skin: string) {
  const dir = side === 'left' ? -1 : 1;
  const sx = 100 + dir * shoulderW / 2;
  const ex = sx + dir * armW * 0.6;

  return (
    <g key={side}>
      <path
        d={`M${sx} 102 L${ex} 155 L${ex - dir * armW} 155 L${sx - dir * 6} 108 Z`}
        fill={clothesColor} stroke="hsla(0,0%,0%,0.12)" strokeWidth="0.5" />
      <ellipse cx={ex - dir * armW / 2} cy="158" rx={armW * 0.35} ry={armW * 0.3} fill={skin} />
    </g>
  );
}

// === EYES ===
function renderEyes(shape: string, color: string, evo: EvolutionProfile) {
  const rx = shape === 'round' ? 4.5 : shape === 'monolid' ? 5 : 4;
  const ry = shape === 'round' ? 4 : shape === 'hooded' ? 3 : shape === 'upturned' ? 3 : 3.5;

  const focusGlow = evo.unlockedAccessories.includes('reading-glasses') || evo.primary === 'focus' && evo.primaryLevel >= 2;

  return (
    <g>
      <ellipse cx="88" cy="58" rx={rx} ry={ry} fill="white" />
      <ellipse cx="112" cy="58" rx={rx} ry={ry} fill="white" />
      <circle cx="89" cy="58" r="2.2" fill={color} />
      <circle cx="113" cy="58" r="2.2" fill={color} />
      <circle cx="88" cy="58" r="1.3" fill="#1a1a2e" />
      <circle cx="112" cy="58" r="1.3" fill="#1a1a2e" />
      <circle cx="89.5" cy="57" r="0.7" fill="white" />
      <circle cx="113.5" cy="57" r="0.7" fill="white" />
      {/* Hooded eyelid */}
      {shape === 'hooded' && (
        <>
          <path d="M84 55 Q88 53 92 55" stroke={`${color}40`} strokeWidth="1.5" fill="none" />
          <path d="M108 55 Q112 53 116 55" stroke={`${color}40`} strokeWidth="1.5" fill="none" />
        </>
      )}
      {/* Upturned lashes */}
      {shape === 'upturned' && (
        <>
          <path d="M92 56.5 L93.5 54.5" stroke="#1a1a2e" strokeWidth="0.8" />
          <path d="M116 56.5 L117.5 54.5" stroke="#1a1a2e" strokeWidth="0.8" />
        </>
      )}
      {/* Focus glow */}
      {focusGlow && (
        <>
          <ellipse cx="88" cy="58" rx={rx + 1.5} ry={ry + 1.5} fill="none"
            stroke="hsl(217, 80%, 60%)" strokeWidth="0.7" opacity="0.5" />
          <ellipse cx="112" cy="58" rx={rx + 1.5} ry={ry + 1.5} fill="none"
            stroke="hsl(217, 80%, 60%)" strokeWidth="0.7" opacity="0.5" />
        </>
      )}
    </g>
  );
}

// === NOSE ===
function renderNose(nose: string, skin: string) {
  switch (nose) {
    case 'button':
      return <circle cx="100" cy="65" r="2.5" fill={`${skin}CC`} stroke={`${skin}99`} strokeWidth="0.5" />;
    case 'wide':
      return <path d="M96 62 Q100 69 104 62" stroke={`${skin}99`} strokeWidth="1.5" fill="none" />;
    case 'aquiline':
      return <path d="M99 56 Q101 64 100 67 Q99 68 98 67" stroke={`${skin}99`} strokeWidth="1.2" fill="none" />;
    default: // straight
      return <path d="M98 60 Q100 67 102 60" stroke={`${skin}99`} strokeWidth="1.2" fill="none" />;
  }
}

// === FACIAL HAIR ===
function renderFacialHair(type: string, hairColor: string) {
  switch (type) {
    case 'stubble':
      return (
        <g opacity="0.3">
          {[90, 94, 98, 102, 106, 110].map(x => (
            <circle key={`s1-${x}`} cx={x} cy="77" r="0.5" fill={hairColor} />
          ))}
          {[92, 96, 100, 104, 108].map(x => (
            <circle key={`s2-${x}`} cx={x} cy="79" r="0.5" fill={hairColor} />
          ))}
        </g>
      );
    case 'short-beard':
      return <path d="M85 72 Q85 85 100 88 Q115 85 115 72" fill={hairColor} opacity="0.5" />;
    case 'long-beard':
      return <path d="M85 72 Q85 98 100 102 Q115 98 115 72" fill={hairColor} opacity="0.5" />;
    case 'mustache':
      return <path d="M92 70 Q100 75 108 70" stroke={hairColor} strokeWidth="2.5" fill="none" opacity="0.7" />;
    case 'goatee':
      return (
        <>
          <path d="M92 70 Q100 74 108 70" stroke={hairColor} strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M96 76 Q100 88 104 76" fill={hairColor} opacity="0.5" />
        </>
      );
    default:
      return null;
  }
}

// === HAIR ===
function renderHair(style: string, color: string) {
  switch (style) {
    case 'buzzed':
      return <ellipse cx="100" cy="42" rx="29" ry="18" fill={color} opacity="0.7" />;
    case 'fade':
      return (
        <>
          <ellipse cx="100" cy="42" rx="29" ry="18" fill={color} opacity="0.4" />
          <path d="M75 50 Q75 30 100 25 Q125 30 125 50 L123 42 Q120 32 100 29 Q80 32 77 42 Z" fill={color} />
        </>
      );
    case 'short':
      return <path d="M70 55 Q70 25 100 22 Q130 25 130 55 L128 45 Q125 30 100 27 Q75 30 72 45 Z" fill={color} />;
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
    case 'bob':
      return (
        <>
          <path d="M68 55 Q68 22 100 18 Q132 22 132 55 L130 45 Q128 28 100 24 Q72 28 70 45 Z" fill={color} />
          <path d="M68 55 Q66 72 70 78" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M132 55 Q134 72 130 78" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />
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

// === EVOLUTION ACCESSORIES ===
function renderEvolutionAccessories(evo: EvolutionProfile, hair: string) {
  const items: JSX.Element[] = [];

  // Reading glasses (focus)
  if (evo.unlockedAccessories.includes('reading-glasses')) {
    items.push(
      <g key="glasses" opacity="0.8">
        <circle cx="88" cy="58" r="7" stroke="hsl(220, 20%, 40%)" strokeWidth="1.2" fill="none" />
        <circle cx="112" cy="58" r="7" stroke="hsl(220, 20%, 40%)" strokeWidth="1.2" fill="none" />
        <line x1="95" y1="58" x2="105" y2="58" stroke="hsl(220, 20%, 40%)" strokeWidth="1" />
        <line x1="81" y1="57" x2="72" y2="55" stroke="hsl(220, 20%, 40%)" strokeWidth="1" />
        <line x1="119" y1="57" x2="128" y2="55" stroke="hsl(220, 20%, 40%)" strokeWidth="1" />
      </g>
    );
  }

  // Sunglasses (charisma)
  if (evo.unlockedAccessories.includes('sunglasses') && !evo.unlockedAccessories.includes('reading-glasses')) {
    items.push(
      <g key="sunglasses" opacity="0.9">
        <rect x="80" y="53" width="16" height="10" rx="3" fill="hsl(220, 20%, 15%)" stroke="hsl(220, 20%, 30%)" strokeWidth="1" />
        <rect x="104" y="53" width="16" height="10" rx="3" fill="hsl(220, 20%, 15%)" stroke="hsl(220, 20%, 30%)" strokeWidth="1" />
        <line x1="96" y1="58" x2="104" y2="58" stroke="hsl(220, 20%, 30%)" strokeWidth="1" />
        <line x1="80" y1="57" x2="72" y2="55" stroke="hsl(220, 20%, 30%)" strokeWidth="1" />
        <line x1="120" y1="57" x2="128" y2="55" stroke="hsl(220, 20%, 30%)" strokeWidth="1" />
      </g>
    );
  }

  // Watch (focus)
  if (evo.unlockedAccessories.includes('watch')) {
    items.push(
      <g key="watch">
        <rect x="56" y="152" width="8" height="10" rx="2" fill="hsl(220, 20%, 25%)" stroke="hsl(38, 70%, 45%)" strokeWidth="0.8" />
        <circle cx="60" cy="157" r="2.5" fill="hsl(220, 20%, 15%)" stroke="hsl(38, 70%, 45%)" strokeWidth="0.5" />
      </g>
    );
  }

  // Earrings (charisma)
  if (evo.unlockedAccessories.includes('earrings')) {
    items.push(
      <g key="earrings">
        <circle cx="71" cy="62" r="2" fill="hsl(38, 80%, 55%)" />
        <circle cx="129" cy="62" r="2" fill="hsl(38, 80%, 55%)" />
      </g>
    );
  }

  // Headphones (flow)
  if (evo.unlockedAccessories.includes('headphones')) {
    items.push(
      <g key="headphones" opacity="0.85">
        <path d="M68 50 Q68 30 100 28 Q132 30 132 50" stroke="hsl(0, 0%, 25%)" strokeWidth="4" fill="none" />
        <rect x="63" y="48" width="8" height="14" rx="4" fill="hsl(0, 0%, 20%)" stroke="hsl(0, 0%, 30%)" strokeWidth="0.8" />
        <rect x="129" y="48" width="8" height="14" rx="4" fill="hsl(0, 0%, 20%)" stroke="hsl(0, 0%, 30%)" strokeWidth="0.8" />
      </g>
    );
  }

  // Sport cap (strength)
  if (evo.unlockedAccessories.includes('sport-cap')) {
    items.push(
      <g key="cap">
        <path d="M68 42 Q68 32 100 30 Q132 32 132 42 L135 44 L65 44 Z" fill="hsl(220, 50%, 30%)" />
        <rect x="65" y="42" width="70" height="4" rx="1" fill="hsl(220, 50%, 25%)" />
        <path d="M125 43 L145 40 L145 45 L125 46 Z" fill="hsl(220, 50%, 28%)" />
      </g>
    );
  }

  // Beret (creativity)
  if (evo.unlockedAccessories.includes('beret') && !evo.unlockedAccessories.includes('sport-cap')) {
    items.push(
      <g key="beret">
        <ellipse cx="105" cy="32" rx="22" ry="10" fill="hsl(271, 50%, 40%)" />
        <circle cx="105" cy="24" r="3" fill="hsl(271, 50%, 40%)" />
      </g>
    );
  }

  // Wristbands (strength)
  if (evo.unlockedAccessories.includes('wristbands')) {
    items.push(
      <g key="wristbands">
        <rect x="53" y="148" width="10" height="5" rx="2" fill="hsl(0, 70%, 45%)" opacity="0.8" />
        <rect x="137" y="148" width="10" height="5" rx="2" fill="hsl(0, 70%, 45%)" opacity="0.8" />
      </g>
    );
  }

  // Meditation bracelet (discipline)
  if (evo.unlockedAccessories.includes('meditation-bracelet')) {
    items.push(
      <g key="mbracelet">
        <ellipse cx="60" cy="155" rx="5" ry="3" fill="none" stroke="hsl(38, 60%, 45%)" strokeWidth="1.5" strokeDasharray="2 1.5" />
      </g>
    );
  }

  // Courage scar
  if (evo.primary === 'courage' && evo.primaryLevel >= 3) {
    items.push(
      <path key="scar" d="M115 50 L120 45 L118 52" stroke="hsla(0, 50%, 60%, 0.5)" strokeWidth="1" fill="none" strokeLinecap="round" />
    );
  }

  return <>{items}</>;
}
