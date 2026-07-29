/**
 * Coffee phenological stages: internal key, image and display name.
 *
 * The one place this mapping lives. It was repeated in four (`SectionData`, `SectionCard`, and the
 * create and edit modals) with two different representations -- the detail used the project's images
 * and the rest emojis -- and `SectionData`'s map was keyed by the TRANSLATED name, so it stopped
 * finding the image when the language changed to English.
 *
 * The images are the project's own (`public/assets/section_icons/`), not generic iconography: they are
 * domain content, and the stage should look the same across the app.
 */
export const GROWTH_STAGES = [
  'plantula',
  'vegetativo',
  'floracion',
  'fructificacion',
  'maduracion',
  'cosecha',
] as const;

export type GrowthStageKey = (typeof GROWTH_STAGES)[number];

/** Names as the backend returns them, which stores the display name in Spanish. */
const DISPLAY_TO_KEY: Record<string, GrowthStageKey> = {
  'Plántula': 'plantula',
  Vegetativo: 'vegetativo',
  'Floración': 'floracion',
  'Fructificación': 'fructificacion',
  'Maduración': 'maduracion',
  Cosecha: 'cosecha',
};

/**
 * Accepts both the internal key (`maduracion`) and the name the backend stores (`Maduración`), with or
 * without accents and in any case.
 */
export const toStageKey = (value?: string | null): GrowthStageKey | null => {
  if (!value) return null;
  if (DISPLAY_TO_KEY[value]) return DISPLAY_TO_KEY[value];

  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  return (GROWTH_STAGES as readonly string[]).includes(slug) ? (slug as GrowthStageKey) : null;
};

/**
 * The stage's image. `null` when the value matches no known stage.
 *
 * Two sizes on purpose. The originals are 1080x1080 illustrations up to 764 KB: in the section detail
 * they show large and earn it, but using them in a 24 px label meant downloading ~3.4 MB to draw six
 * thumbnails -- on a phone in the field that shows. The `thumbs/` versions weigh 52 KB for all six.
 */
export const stageImage = (
  value?: string | null,
  size: 'thumb' | 'full' = 'thumb'
): string | null => {
  const key = toStageKey(value);
  if (!key) return null;
  return size === 'full'
    ? `/assets/section_icons/${key}.png`
    : `/assets/section_icons/thumbs/${key}.png`;
};

/** Translation key for the stage name (`sectionType.maduracion`). */
export const stageLabelKey = (value?: string | null): string | null => {
  const key = toStageKey(value);
  return key ? `sectionType.${key}` : null;
};
