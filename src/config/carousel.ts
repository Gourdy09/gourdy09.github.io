/**
 * Hero carousel slides. EDIT THIS FILE.
 *
 * - `src`: path inside /public (put your own images in public/hero/ and point to them here).
 * - `effect`: which shader runs on this image. One of:
 *     'invert'  hover bulges the image, drag smears it, click inverts colors with a circular wipe
 *     'rgb'     moving the pointer splits the color channels; click switches to a duotone
 *     'liquid'  the image flows around the cursor; click sends a shockwave and turns it monochrome
 *     'pixel'   pixelated, with a sharp lens following the cursor; click flips lens and background
 *     'slice'   dragging shears horizontal strips; click bursts and switches to vertical strips
 * - `title` (optional): caption shown bottom-left. Leave it out and the image's file name is used, in quotes
 *   (hero/sunset.jpg shows as "sunset.jpg").
 * - `hint`: the instruction shown next to the caption.
 *
 * Images are cover-cropped, so any aspect ratio works (about 1600x1000 is a good size).
 * hero/01.jpg to 05.jpg are generated placeholders: drop your own images into public/hero/ and point `src` at them.
 */
export type EffectName = 'invert' | 'rgb' | 'liquid' | 'pixel' | 'slice';

export interface SlideConfig {
  src: string;
  alt: string;
  title?: string;
  effect: EffectName;
  hint?: string;
}

export const slides: SlideConfig[] = [
  { src: 'hero/01.jpg', alt: 'Concentric red and cream rings', effect: 'invert', hint: 'click to invert · drag to smear' },
  { src: 'hero/02.jpg', alt: 'A halftone dot gradient', effect: 'pixel', hint: 'move the lens · click to flip it' },
  { src: 'hero/03.jpg', alt: 'Soft overlapping color blobs', effect: 'liquid', hint: 'move to stir · click for a shockwave' },
  { src: 'hero/04.jpg', alt: 'Vertical bars of different widths', effect: 'slice', hint: 'drag to shear · click to burst' },
  { src: 'hero/05.jpg', alt: 'Topographic contour lines', effect: 'rgb', hint: 'move to split color · click for duotone' },
];

/** Carousel behavior. */
export const carouselOptions = {
  /** milliseconds between automatic slides (never auto-advances while expanded) */
  autoplayMs: 7000,
  /** hold the current slide while the pointer is over the carousel */
  pauseOnHover: true,
  /** play each slide's click effect by itself shortly after it arrives */
  autoEffects: true,
};
