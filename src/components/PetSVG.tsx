import { PetProfile, PetStage, PetMood } from '@/lib/pet-evolution';

interface PetSVGProps {
  pet: PetProfile;
  size?: number;
  animate?: boolean;
}

export default function PetSVG({ pet, size = 120, animate = true }: PetSVGProps) {
  const { stage, mood, color, accentColor, glowColor, hasWings, dominantType } = pet;

  const bobClass = animate && mood !== 'sleeping' ? 'pet-bob' : '';
  const sleepClass = mood === 'sleeping' ? 'pet-sleep' : '';

  return (
    <div className={`relative inline-block ${bobClass} ${sleepClass}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`petGlow-${stage}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id={`bodyGrad-${stage}`} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="100%" stopColor={color} />
          </radialGradient>
          <filter id="petShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Glow base */}
        {stage >= 2 && (
          <ellipse cx="60" cy="100" rx={20 + stage * 5} ry="6"
            fill={glowColor} opacity="0.5" />
        )}

        {stage === 0 && <EggSVG color={color} accentColor={accentColor} mood={mood} dominantType={dominantType} />}
        {stage === 1 && <BabySVG color={color} accentColor={accentColor} mood={mood} dominantType={dominantType} hasWings={hasWings} />}
        {stage === 2 && <YoungSVG color={color} accentColor={accentColor} mood={mood} dominantType={dominantType} hasWings={hasWings} />}
        {stage === 3 && <AdultSVG color={color} accentColor={accentColor} mood={mood} dominantType={dominantType} hasWings={hasWings} />}
        {stage === 4 && <LegendarySVG color={color} accentColor={accentColor} mood={mood} dominantType={dominantType} />}

        {/* Sleep zzz */}
        {mood === 'sleeping' && (
          <g opacity="0.8">
            <text x="82" y="30" fontSize="8" fill={accentColor} fontWeight="bold">z</text>
            <text x="88" y="22" fontSize="10" fill={accentColor} fontWeight="bold">z</text>
            <text x="95" y="14" fontSize="12" fill={accentColor} fontWeight="bold">Z</text>
          </g>
        )}

        {/* Happy sparkles */}
        {mood === 'happy' && stage >= 1 && (
          <g>
            <circle cx="20" cy="30" r="2" fill={accentColor} opacity="0.8" />
            <circle cx="100" cy="25" r="1.5" fill={accentColor} opacity="0.7" />
            <circle cx="15" cy="55" r="1.5" fill={accentColor} opacity="0.6" />
            <text x="95" y="45" fontSize="10">✨</text>
          </g>
        )}
      </svg>

      <style>{`
        .pet-bob {
          animation: petBob 2s ease-in-out infinite;
        }
        .pet-sleep {
          animation: petSleep 3s ease-in-out infinite;
        }
        @keyframes petBob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes petSleep {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  );
}

// ============ STAGE 0: EGG ============
function EggSVG({ color, accentColor, mood, dominantType }: any) {
  return (
    <g>
      {/* Egg body */}
      <ellipse cx="60" cy="68" rx="28" ry="34" fill={`url(#bodyGrad-0)`} filter="url(#petShadow)" />
      {/* Egg pattern */}
      <path d="M40 55 Q60 48 80 55" stroke={accentColor} strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M36 68 Q60 60 84 68" stroke={accentColor} strokeWidth="1.5" fill="none" opacity="0.4" />
      {/* Cracks if mood is happy (about to hatch) */}
      {mood === 'happy' && (
        <g stroke={accentColor} strokeWidth="1.2" opacity="0.8">
          <path d="M55 45 L58 52 L53 57" fill="none" />
          <path d="M65 43 L62 50 L67 54" fill="none" />
        </g>
      )}
      {/* Eyes */}
      <circle cx="53" cy="63" r="3" fill="white" />
      <circle cx="67" cy="63" r="3" fill="white" />
      <circle cx="54" cy="64" r="1.5" fill="#1a1a2e" />
      <circle cx="68" cy="64" r="1.5" fill="#1a1a2e" />
      <circle cx="54.5" cy="63.5" r="0.6" fill="white" />
      <circle cx="68.5" cy="63.5" r="0.6" fill="white" />
      {/* Smile */}
      <path d="M55 70 Q60 74 65 70" stroke="#1a1a2e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </g>
  );
}

// ============ STAGE 1: BABY ============
function BabySVG({ color, accentColor, mood, dominantType, hasWings }: any) {
  const eyeY = mood === 'sad' ? 58 : 55;
  const mouthCurve = mood === 'happy' ? 5 : mood === 'sad' ? -3 : 2;
  return (
    <g filter="url(#petShadow)">
      {/* Tiny wings */}
      {hasWings && (
        <g opacity="0.6">
          <ellipse cx="35" cy="62" rx="10" ry="6" fill={accentColor} transform="rotate(-20, 35, 62)" />
          <ellipse cx="85" cy="62" rx="10" ry="6" fill={accentColor} transform="rotate(20, 85, 62)" />
        </g>
      )}
      {/* Body */}
      <ellipse cx="60" cy="72" rx="22" ry="20" fill={`url(#bodyGrad-1)`} />
      {/* Head */}
      <circle cx="60" cy="52" r="20" fill={`url(#bodyGrad-1)`} />
      {/* Ears/horns based on type */}
      {dominantType === 'strength' && (
        <>
          <path d="M48 36 L44 26 L52 33" fill={color} />
          <path d="M72 36 L76 26 L68 33" fill={color} />
        </>
      )}
      {dominantType === 'flow' && (
        <>
          <ellipse cx="50" cy="34" rx="5" ry="8" fill={accentColor} transform="rotate(-15,50,34)" />
          <ellipse cx="70" cy="34" rx="5" ry="8" fill={accentColor} transform="rotate(15,70,34)" />
        </>
      )}
      {!['strength','flow'].includes(dominantType) && (
        <>
          <ellipse cx="50" cy="36" rx="6" ry="9" fill={color} />
          <ellipse cx="70" cy="36" rx="6" ry="9" fill={color} />
          <ellipse cx="50" cy="37" rx="3" ry="5" fill={accentColor} opacity="0.5" />
          <ellipse cx="70" cy="37" rx="3" ry="5" fill={accentColor} opacity="0.5" />
        </>
      )}
      {/* Eyes */}
      <circle cx="53" cy={eyeY} r="5" fill="white" />
      <circle cx="67" cy={eyeY} r="5" fill="white" />
      <circle cx="54" cy={eyeY + 1} r="3" fill="#1a1a2e" />
      <circle cx="68" cy={eyeY + 1} r="3" fill="#1a1a2e" />
      <circle cx="54.5" cy={eyeY} r="1" fill="white" />
      <circle cx="68.5" cy={eyeY} r="1" fill="white" />
      {/* Mouth */}
      <path d={`M55 63 Q60 ${63 + mouthCurve} 65 63`} stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <ellipse cx="47" cy="60" rx="4" ry="2.5" fill={accentColor} opacity="0.3" />
      <ellipse cx="73" cy="60" rx="4" ry="2.5" fill={accentColor} opacity="0.3" />
      {/* Tail */}
      <path d="M60 90 Q48 98 50 106 Q58 110 62 100" fill={color} opacity="0.7" />
    </g>
  );
}

// ============ STAGE 2: YOUNG ============
function YoungSVG({ color, accentColor, mood, dominantType, hasWings }: any) {
  const mouthCurve = mood === 'happy' ? 6 : mood === 'sad' ? -3 : 3;
  return (
    <g filter="url(#petShadow)">
      {/* Wings */}
      {hasWings && (
        <g>
          <path d="M38 60 Q22 45 28 70 Q35 68 38 60" fill={accentColor} opacity="0.7" />
          <path d="M82 60 Q98 45 92 70 Q85 68 82 60" fill={accentColor} opacity="0.7" />
        </g>
      )}
      {/* Body */}
      <ellipse cx="60" cy="76" rx="24" ry="22" fill={`url(#bodyGrad-2)`} />
      {/* Belly */}
      <ellipse cx="60" cy="78" rx="14" ry="13" fill={accentColor} opacity="0.35" />
      {/* Head */}
      <circle cx="60" cy="50" r="22" fill={`url(#bodyGrad-2)`} />
      {/* Horns/features */}
      {dominantType === 'strength' && (
        <g fill={accentColor}>
          <path d="M50 30 L46 16 L54 28" />
          <path d="M70 30 L74 16 L66 28" />
        </g>
      )}
      {dominantType === 'creativity' && (
        <g>
          <circle cx="50" cy="30" r="4" fill={accentColor} />
          <circle cx="70" cy="30" r="4" fill={accentColor} />
          <circle cx="60" cy="27" r="3" fill={accentColor} opacity="0.6" />
        </g>
      )}
      {!['strength','creativity'].includes(dominantType) && (
        <g>
          <path d="M48 32 L44 20 L52 30" fill={color} />
          <path d="M72 32 L76 20 L68 30" fill={color} />
        </g>
      )}
      {/* Eyes */}
      <circle cx="51" cy="48" r="6" fill="white" />
      <circle cx="69" cy="48" r="6" fill="white" />
      <circle cx="52" cy="49" r="3.5" fill="#1a1a2e" />
      <circle cx="70" cy="49" r="3.5" fill="#1a1a2e" />
      <circle cx="52.5" cy="48" r="1.2" fill="white" />
      <circle cx="70.5" cy="48" r="1.2" fill="white" />
      {/* Nose */}
      <ellipse cx="60" cy="56" rx="3" ry="2" fill={color} opacity="0.5" />
      {/* Mouth */}
      <path d={`M53 62 Q60 ${62 + mouthCurve} 67 62`} stroke="#1a1a2e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Tail */}
      <path d="M60 96 Q44 106 46 114 Q56 118 60 106" fill={color} opacity="0.8" />
      {/* Pattern on body */}
      <path d="M50 72 Q60 68 70 72" stroke={accentColor} strokeWidth="1.5" fill="none" opacity="0.5" />
    </g>
  );
}

// ============ STAGE 3: ADULT ============
function AdultSVG({ color, accentColor, mood, dominantType, hasWings }: any) {
  const mouthCurve = mood === 'happy' ? 7 : mood === 'sad' ? -4 : 3;
  return (
    <g filter="url(#petShadow)">
      {/* Big wings */}
      {hasWings && (
        <g>
          <path d="M36 55 Q12 35 18 65 Q28 72 36 62" fill={accentColor} opacity="0.75" />
          <path d="M84 55 Q108 35 102 65 Q92 72 84 62" fill={accentColor} opacity="0.75" />
          {/* Wing detail */}
          <path d="M36 58 Q20 45 24 62" stroke={color} strokeWidth="1" fill="none" opacity="0.4" />
          <path d="M84 58 Q100 45 96 62" stroke={color} strokeWidth="1" fill="none" opacity="0.4" />
        </g>
      )}
      {/* Body */}
      <ellipse cx="60" cy="78" rx="26" ry="24" fill={`url(#bodyGrad-3)`} />
      {/* Belly */}
      <ellipse cx="60" cy="80" rx="16" ry="15" fill={accentColor} opacity="0.3" />
      {/* Head */}
      <circle cx="60" cy="48" r="24" fill={`url(#bodyGrad-3)`} />
      {/* Crown/horns */}
      {dominantType === 'discipline' && (
        <g fill={accentColor} opacity="0.9">
          <path d="M52 26 L50 14 L56 24" />
          <path d="M60 24 L60 10 L64 22" />
          <path d="M68 26 L70 14 L64 24" />
        </g>
      )}
      {dominantType === 'strength' && (
        <g fill={accentColor}>
          <path d="M48 28 L43 12 L52 26" />
          <path d="M72 28 L77 12 L68 26" />
        </g>
      )}
      {!['discipline','strength'].includes(dominantType) && (
        <g>
          <path d="M48 28 L44 14 L54 26" fill={color} />
          <path d="M72 28 L76 14 L66 26" fill={color} />
          <ellipse cx="60" cy="25" rx="4" ry="6" fill={accentColor} opacity="0.7" />
        </g>
      )}
      {/* Eyes — bigger, more expressive */}
      <circle cx="49" cy="46" r="7.5" fill="white" />
      <circle cx="71" cy="46" r="7.5" fill="white" />
      <circle cx="50" cy="47" r="4.5" fill="#1a1a2e" />
      <circle cx="72" cy="47" r="4.5" fill="#1a1a2e" />
      {/* Iris color */}
      <circle cx="50.5" cy="47.5" r="2.5" fill={accentColor} opacity="0.7" />
      <circle cx="72.5" cy="47.5" r="2.5" fill={accentColor} opacity="0.7" />
      <circle cx="51" cy="46.5" r="1.2" fill="white" />
      <circle cx="73" cy="46.5" r="1.2" fill="white" />
      {/* Nose */}
      <ellipse cx="60" cy="55" rx="3.5" ry="2.5" fill={color} opacity="0.5" />
      {/* Mouth */}
      <path d={`M51 61 Q60 ${61 + mouthCurve} 69 61`} stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Aura ring */}
      <circle cx="60" cy="48" r="28" stroke={accentColor} strokeWidth="1.5" fill="none" opacity="0.2" strokeDasharray="4 3" />
      {/* Tail */}
      <path d="M58 100 Q40 112 42 118 Q54 122 60 108" fill={color} />
      <path d="M62 100 Q78 112 76 118 Q64 122 60 108" fill={accentColor} opacity="0.7" />
    </g>
  );
}

// ============ STAGE 4: LEGENDARY ============
function LegendarySVG({ color, accentColor, mood, dominantType }: any) {
  const mouthCurve = mood === 'happy' ? 8 : 4;
  return (
    <g filter="url(#petShadow)">
      {/* Legendary aura rings */}
      <circle cx="60" cy="60" r="52" stroke={accentColor} strokeWidth="1" fill="none" opacity="0.15" />
      <circle cx="60" cy="60" r="46" stroke={color} strokeWidth="1.5" fill="none" opacity="0.2" strokeDasharray="6 4" />
      {/* Big wings always */}
      <path d="M34 52 Q8 28 14 62 Q26 74 36 60" fill={accentColor} opacity="0.8" />
      <path d="M86 52 Q112 28 106 62 Q94 74 84 60" fill={accentColor} opacity="0.8" />
      <path d="M34 52 Q16 36 20 58" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M86 52 Q104 36 100 58" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* Body */}
      <ellipse cx="60" cy="78" rx="27" ry="25" fill={`url(#bodyGrad-4)`} />
      <ellipse cx="60" cy="80" rx="17" ry="16" fill={accentColor} opacity="0.25" />
      {/* Head */}
      <circle cx="60" cy="46" r="25" fill={`url(#bodyGrad-4)`} />
      {/* Crown */}
      <g fill={accentColor}>
        <path d="M46 24 L43 10 L50 22" />
        <path d="M60 22 L60 6 L65 20" />
        <path d="M74 24 L77 10 L70 22" />
        <circle cx="43" cy="9" r="3" />
        <circle cx="60" cy="5" r="3.5" />
        <circle cx="77" cy="9" r="3" />
      </g>
      {/* Eyes — legendary */}
      <circle cx="48" cy="44" r="8.5" fill="white" />
      <circle cx="72" cy="44" r="8.5" fill="white" />
      <circle cx="49" cy="45" r="5.5" fill="#1a1a2e" />
      <circle cx="73" cy="45" r="5.5" fill="#1a1a2e" />
      <circle cx="49.5" cy="45.5" r="3" fill={accentColor} />
      <circle cx="73.5" cy="45.5" r="3" fill={accentColor} />
      <circle cx="50" cy="44.5" r="1.5" fill="white" />
      <circle cx="74" cy="44.5" r="1.5" fill="white" />
      {/* Star pupils for legendary */}
      <circle cx="49.5" cy="45.5" r="1" fill="white" opacity="0.8" />
      <circle cx="73.5" cy="45.5" r="1" fill="white" opacity="0.8" />
      {/* Nose */}
      <ellipse cx="60" cy="54" rx="4" ry="3" fill={color} opacity="0.4" />
      {/* Mouth */}
      <path d={`M50 60 Q60 ${60 + mouthCurve} 70 60`} stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Legendary tail */}
      <path d="M56 100 Q36 114 38 120 Q52 126 58 108" fill={color} />
      <path d="M64 100 Q84 114 82 120 Q68 126 62 108" fill={accentColor} />
      {/* Stars around legendary */}
      <text x="8" y="40" fontSize="10">⭐</text>
      <text x="100" y="38" fontSize="10">⭐</text>
      <text x="14" y="85" fontSize="8">✨</text>
      <text x="98" y="82" fontSize="8">✨</text>
    </g>
  );
}
