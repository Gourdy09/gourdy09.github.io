/**
 * Hero carousel. EDIT THIS FILE.
 *
 * Every slide picks its own effect, its own effect settings and how its image is fitted:
 *
 * - `src`: path inside /public (put your own images in public/hero/ and point to them here).
 * - `effect`: which shader runs on this image (any effect on any image, repeats are fine):
 *     'none'    the plain image, nothing happens
 *     'invert'  hover = soft lens, drag smears, click spreads an inverted-color variant from the cursor
 *     'rgb'     moving the pointer splits the color channels; click spreads a duotone
 *     'liquid'  the image flows around the cursor; click = a soft swirl at the cursor + color drains
 *     'pixel'   pixelated, with a sharp lens following the cursor; click flips lens and background
 *     'slice'   dragging shears horizontal strips; click shifts them most near the cursor, then they turn vertical
 * - `settings` (optional): tune the effect on this slide (see EffectSettings below). Missing values fall
 *   back to `effectDefaults[effect]`, then to `defaultSettings`.
 * - `fit` (optional): how the image is fitted into the slide, for images that aren't ~16:10 / 16:9:
 *     'auto'    (default) crop to fill when the shape is close to the slide's, otherwise show the whole image
 *               over a blurred copy of itself
 *     'cover'   always crop to fill
 *     'contain' always show the whole image, plain background around it
 *     'blur'    always show the whole image over a blurred copy of itself
 * - `focus` (optional): [x, y] from 0 to 1 (y from the top) of the part of the image to keep in view when it
 *   gets cropped. [0.5, 0.5] is the center, [0.5, 0] the top edge, [0.2, 0.5] the left side.
 * - `title` (optional): caption shown bottom-left. Leave it out and the image's file name is used, in quotes
 *   (hero/sunset.jpg shows as "sunset.jpg").
 * - `hint`: the instruction shown next to the caption.
 *
 * hero/01.jpg to 05.jpg are generated placeholders: drop your own images into public/hero/ and point `src` at them.
 */
export type EffectName = 'none' | 'invert' | 'rgb' | 'liquid' | 'pixel' | 'slice';
export type FitMode = 'auto' | 'cover' | 'contain' | 'blur';

/** All values are multipliers or amounts where 1 is the default look. */
export interface EffectSettings {
  /** how strongly the effect distorts the image (0 = none, 2 = double). Not used by 'pixel'. */
  strength: number;
  /** how big the area around the cursor is (0.5 = half, 2 = double). Not used by 'pixel'. */
  size: number;
  /** how gradual the edge of that area, and of the click's spread, is (0 = crisp, 1 = default, 2 = very soft). 'pixel' only uses it for the click. */
  softness: number;
  /** how much a click changes the image (0 = clicking does nothing visible, 1 = full) */
  click: number;
  /** how much the effect moves by itself while nobody is touching it (0 = holds still) */
  idle: number;
}

export interface SlideConfig {
  src: string;
  alt: string;
  effect: EffectName;
  title?: string;
  hint?: string;
  settings?: Partial<EffectSettings>;
  fit?: FitMode;
  focus?: [number, number];
}

/** The base settings every slide starts from. */
export const defaultSettings: EffectSettings = {
  strength: 1,
  size: 1,
  softness: 1,
  click: 1,
  idle: 1,
};

/** Override the base settings for every slide that uses a given effect. Example: `liquid: { strength: 0.8 }`. */
export const effectDefaults: { [K in EffectName]?: Partial<EffectSettings> } = {};

export const slides: SlideConfig[] = [
  { src: 'hero/01.jpg', alt: 'Concentric red and cream rings', effect: 'pixel', hint: 'move to sharpen · click to flip' },
  { src: 'hero/02.jpg', alt: 'A halftone dot gradient', effect: 'invert', hint: 'click to invert · drag to smear' },
  { src: 'hero/03.jpg', alt: 'Soft overlapping color blobs', effect: 'liquid', hint: 'move to stir · click to drain' },
  { src: 'hero/04.jpg', alt: 'Vertical bars of different widths', effect: 'slice', hint: 'drag to shear · click to burst' },
  { src: 'hero/05.jpg', alt: 'Topographic contour lines', effect: 'rgb', hint: 'move to split · click for duotone' },
  // Examples (uncomment and edit):
  // { src: 'hero/tall.jpg', alt: '…', effect: 'liquid', fit: 'blur', settings: { strength: 0.7, size: 1.4, softness: 1.5 } },
  // { src: 'hero/panorama.jpg', alt: '…', effect: 'none', fit: 'cover', focus: [0.8, 0.5] },
];

/** Carousel behavior. */
export const carouselOptions = {
  /** milliseconds between automatic slides (never auto-advances while expanded) */
  autoplayMs: 7000,
  /** hold the current slide while the pointer is over the carousel */
  pauseOnHover: true,
  /** play each slide's click effect by itself shortly after it arrives */
  autoEffects: true,
  /** default `fit` for slides that don't set one */
  fit: 'auto' as FitMode,
  /**
   * For fit 'auto': how different (as a ratio) the image's shape may be from the slide's before the whole
   * image is shown instead of cropped. 1.35 means "crop at most about a quarter of the image".
   */
  autoFitTolerance: 1.35,
};

/** Merge defaults for one slide. Used on the server (carousel.astro), the result is sent to the browser. */
export function resolveSettings(s: SlideConfig): EffectSettings {
  return { ...defaultSettings, ...effectDefaults[s.effect], ...s.settings };
}
