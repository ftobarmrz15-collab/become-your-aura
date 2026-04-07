export const SKIN_TONES = [
  { id: 'very-light', label: 'Muy claro', color: '#FDEBD0' },
  { id: 'light', label: 'Claro', color: '#F5CBA7' },
  { id: 'medium-light', label: 'Medio claro', color: '#E0AC69' },
  { id: 'medium', label: 'Medio', color: '#C68642' },
  { id: 'medium-dark', label: 'Medio oscuro', color: '#8D5524' },
  { id: 'dark', label: 'Oscuro', color: '#6B3A2A' },
  { id: 'very-dark', label: 'Muy oscuro', color: '#3B1F0B' },
  { id: 'cool-brown', label: 'Marrón frío', color: '#7B5B4C' },
];

export const HAIR_STYLES = [
  { id: 'short', label: 'Corto', emoji: '💇' },
  { id: 'medium', label: 'Medio', emoji: '💁' },
  { id: 'long', label: 'Largo', emoji: '👩' },
  { id: 'buzzed', label: 'Rapado', emoji: '👨‍🦲' },
  { id: 'braids', label: 'Trenzas', emoji: '🧑' },
  { id: 'afro', label: 'Afro', emoji: '🧑‍🦱' },
  { id: 'curly', label: 'Rizado', emoji: '👨‍🦱' },
  { id: 'mohawk', label: 'Mohawk', emoji: '🤘' },
  { id: 'ponytail', label: 'Cola', emoji: '🧑‍🎤' },
  { id: 'bun', label: 'Moño', emoji: '👩‍🎤' },
];

export const HAIR_COLORS = [
  { id: 'black', label: 'Negro', color: '#1a1a1a' },
  { id: 'dark-brown', label: 'Castaño oscuro', color: '#3B2314' },
  { id: 'brown', label: 'Castaño', color: '#6B4226' },
  { id: 'light-brown', label: 'Castaño claro', color: '#A0714A' },
  { id: 'blonde', label: 'Rubio', color: '#D4A76A' },
  { id: 'platinum', label: 'Platino', color: '#E8DCC8' },
  { id: 'red', label: 'Pelirrojo', color: '#8B2500' },
  { id: 'ginger', label: 'Cobrizo', color: '#D2691E' },
  { id: 'gray', label: 'Gris', color: '#808080' },
  { id: 'white', label: 'Blanco', color: '#E0E0E0' },
  { id: 'purple', label: 'Púrpura', color: '#7C3AED' },
  { id: 'blue', label: 'Azul', color: '#3B82F6' },
  { id: 'pink', label: 'Rosa', color: '#EC4899' },
  { id: 'green', label: 'Verde', color: '#22C55E' },
];

export const FACE_SHAPES = [
  { id: 'oval', label: 'Ovalada' },
  { id: 'square', label: 'Cuadrada' },
  { id: 'round', label: 'Redonda' },
];

export const EYE_SHAPES = [
  { id: 'almond', label: 'Almendrados' },
  { id: 'round', label: 'Redondos' },
  { id: 'hooded', label: 'Encapuchados' },
  { id: 'monolid', label: 'Mono párpado' },
  { id: 'upturned', label: 'Rasgados' },
];

export const EYE_COLORS = [
  { id: 'brown', label: 'Café', color: '#6B4226' },
  { id: 'dark-brown', label: 'Café oscuro', color: '#3B2314' },
  { id: 'hazel', label: 'Avellana', color: '#8B7355' },
  { id: 'green', label: 'Verde', color: '#2E8B57' },
  { id: 'blue', label: 'Azul', color: '#4682B4' },
  { id: 'gray', label: 'Gris', color: '#808080' },
  { id: 'amber', label: 'Ámbar', color: '#DAA520' },
];

export const NOSES = [
  { id: 'straight', label: 'Recta' },
  { id: 'button', label: 'Respingada' },
  { id: 'wide', label: 'Ancha' },
  { id: 'aquiline', label: 'Aguileña' },
];

export const MOUTHS = [
  { id: 'neutral', label: 'Neutral' },
  { id: 'smile', label: 'Sonrisa' },
  { id: 'serious', label: 'Serio' },
  { id: 'smirk', label: 'Media sonrisa' },
];

export const FACIAL_HAIR = [
  { id: 'none', label: 'Sin barba' },
  { id: 'stubble', label: 'Barba corta' },
  { id: 'short-beard', label: 'Barba media' },
  { id: 'long-beard', label: 'Barba larga' },
  { id: 'mustache', label: 'Bigote' },
  { id: 'goatee', label: 'Candado' },
];

export const OUTFITS = [
  { id: 'casual', label: 'Casual', emoji: '👕' },
  { id: 'streetwear', label: 'Streetwear', emoji: '🧥' },
  { id: 'athletic', label: 'Atlético', emoji: '🏃' },
  { id: 'formal', label: 'Formal', emoji: '👔' },
  { id: 'hoodie', label: 'Hoodie', emoji: '🧤' },
  { id: 'tank-top', label: 'Tank top', emoji: '🎽' },
];

export interface AvatarConfig {
  skin_tone: string;
  hair_style: string;
  hair_color: string;
  face_shape: string;
  eye_shape: string;
  eye_color: string;
  nose: string;
  mouth: string;
  facial_hair: string;
  outfit: string;
  avatar_url?: string | null;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skin_tone: 'medium',
  hair_style: 'short',
  hair_color: 'black',
  face_shape: 'oval',
  eye_shape: 'almond',
  eye_color: 'brown',
  nose: 'straight',
  mouth: 'neutral',
  facial_hair: 'none',
  outfit: 'casual',
};

export function randomAvatarConfig(): AvatarConfig {
  const pick = <T extends { id: string }>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)].id;
  return {
    skin_tone: pick(SKIN_TONES),
    hair_style: pick(HAIR_STYLES),
    hair_color: pick(HAIR_COLORS),
    face_shape: pick(FACE_SHAPES),
    eye_shape: pick(EYE_SHAPES),
    eye_color: pick(EYE_COLORS),
    nose: pick(NOSES),
    mouth: pick(MOUTHS),
    facial_hair: pick(FACIAL_HAIR),
    outfit: pick(OUTFITS),
  };
}
