export const BADGES = [
  { id: 'hit',      emoji: '🔥', labelUk: 'ХІТ',          labelEn: 'HIT',          bg: '#FAEEE0', color: '#B85C2A' },
  { id: 'new',      emoji: '✨', labelUk: 'НОВИНКА',       labelEn: 'NEW',          bg: '#E8F4E8', color: '#2d7a3a' },
  { id: 'season',   emoji: '🍂', labelUk: 'СЕЗОН',         labelEn: 'SEASONAL',     bg: '#EEE8F4', color: '#5A3A8B' },
  { id: 'chef',     emoji: '⭐', labelUk: 'ВІД ШЕФА',      labelEn: 'CHEF\'S PICK', bg: '#FFF3CD', color: '#856404' },
  { id: 'spicy',    emoji: '🌶', labelUk: 'ГОСТРЕ',        labelEn: 'SPICY',        bg: '#FCE8E8', color: '#C0392B' },
  { id: 'vegan',    emoji: '🌱', labelUk: 'ВЕГАН',         labelEn: 'VEGAN',        bg: '#E8F4E8', color: '#1a6b35' },
  { id: 'nolactose',emoji: '🥛', labelUk: 'БЕЗ ЛАКТОЗИ',  labelEn: 'LACTOSE FREE', bg: '#E8F0FE', color: '#1a56b0' },
  { id: 'limited',  emoji: '⚡', labelUk: 'ЛІМІТОВАНО',   labelEn: 'LIMITED',      bg: '#FEF3E8', color: '#a05a00' },
  { id: 'gluten',   emoji: '✦', labelUk: 'БЕЗ ГЛЮТЕНУ',  labelEn: 'GLUTEN FREE',  bg: '#F0FAF0', color: '#2d7a3a' },
  { id: 'set',      emoji: '🎁', labelUk: 'НАБІР',         labelEn: 'BUNDLE',       bg: '#FCE8F4', color: '#8B2276' },
];

export function getBadge(id) {
  return BADGES.find(b => b.id === id);
}
