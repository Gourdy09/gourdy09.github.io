/**
 * One fragment shader per effect. Every effect implements `vec3 fx(vec2 p)`:
 * p is the slide-local uv (0..1, origin bottom-left) and the return value is the pixel color.
 *
 * Shared uniforms (see HEADER):
 *  - uMouse/uVel/uDrag/uPress/uHover describe the pointer in slide space.
 *  - uToggle + uClick drive the click-to-toggle variant via state(p) and ring(p).
 *  - uFxStrength/uFxSize/uFxSoft/uFxClick/uFxIdle are the per-slide effect settings (config/carousel.ts).
 *  - uFit/uBlurBg/uFocus control how the image is fitted into the slide (cover, or contain over a blurred backdrop).
 *
 * Two helpers keep effects from reading as obvious shapes:
 *  - influence(p, R): the cursor's area of effect, a wide feathered falloff with a noise-wobbled outline.
 *  - state(p): the click variant spreads from the click as a soft, noisy front (like ink soaking in), not a ring.
 */

export const VERTEX = /* glsl */ `
attribute vec2 aPos;
uniform vec4 uRect;     // x, y, w, h in device px, y measured from the top
uniform vec2 uCanvas;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x, 1.0 - aPos.y);
  vec2 px = uRect.xy + aPos * uRect.zw;
  gl_Position = vec4(px.x / uCanvas.x * 2.0 - 1.0, 1.0 - px.y / uCanvas.y * 2.0, 0.0, 1.0);
}`;

const HEADER = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uTex;      // the image
uniform sampler2D uTexBlur;  // a tiny, pre-blurred copy used as the backdrop when the image is letterboxed
uniform vec2 uImg;      // image size in px
uniform vec2 uSize;     // slide size in px
uniform float uTime, uHover, uPress, uToggle, uDim, uRadius, uShift, uZoom, uMove;
uniform float uFit, uBlurBg;   // uFit: 0 = cover (crop to fill), 1 = contain (whole image, bars around it)
uniform vec2 uFocus;           // which part of the image stays in view when cropping (0..1, y up)
uniform float uFxStrength, uFxSize, uFxSoft, uFxClick, uFxIdle;
uniform vec2 uMouse, uVel, uDrag;
uniform vec3 uClick;    // xy = last click (uv), z = seconds since the click
uniform vec3 uAccent, uBg;

float asp() { return uSize.x / uSize.y; }

// slide uv -> image uv
vec2 imgUv(vec2 uv) {
  float ra = uSize.x / uSize.y;
  float ia = uImg.x / uImg.y;
  vec2 cov = ra > ia ? vec2(1.0, ia / ra) : vec2(ra / ia, 1.0);
  vec2 con = ra > ia ? vec2(ra / ia, 1.0) : vec2(1.0, ia / ra);
  vec2 s = mix(cov, con, uFit);
  float z = mix(uZoom, 1.0, uFit);
  uv.x += uShift + uMove * 0.035 * sin(uv.y * 6.2831 + uTime * 2.0);   // ripples while sliding
  uv.y += uMove * 0.01 * sin(uv.x * 9.0);
  vec2 win = s / z;                                              // the part of the image that is visible
  vec2 c = 0.5 + (uFocus - 0.5) * max(1.0 - win, 0.0);           // where that window sits (focus point)
  return (uv - 0.5) * win + c;
}

// blurred, darkened copy of the whole image, cover-fitted: fills the bars around a letterboxed image
vec3 backdrop(vec2 uv) {
  float ra = uSize.x / uSize.y;
  float ia = uImg.x / uImg.y;
  vec2 cov = ra > ia ? vec2(1.0, ia / ra) : vec2(ra / ia, 1.0);
  vec2 t = (uv - 0.5) * cov * 0.92 + 0.5;
  vec2 e = vec2(0.012);
  vec3 b = texture2D(uTexBlur, t + vec2(e.x, e.y)).rgb + texture2D(uTexBlur, t + vec2(-e.x, e.y)).rgb
         + texture2D(uTexBlur, t + vec2(e.x, -e.y)).rgb + texture2D(uTexBlur, t + vec2(-e.x, -e.y)).rgb;
  return b * 0.25 * 0.55;
}

vec3 tex(vec2 uv) {
  vec2 t = imgUv(uv);
  vec3 c = texture2D(uTex, clamp(t, 0.0, 1.0)).rgb;
  if (uFit > 0.001) {
    vec2 a = smoothstep(vec2(0.0), vec2(0.0025), t) * smoothstep(vec2(0.0), vec2(0.0025), 1.0 - t);
    float inside = a.x * a.y;
    if (inside < 0.999) c = mix(uBlurBg > 0.5 ? backdrop(uv) : uBg, c, inside);
  }
  return c;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 x) {
  vec2 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// The cursor's area of effect, 0..1. A wide, feathered falloff (softness setting) whose outline is
// wobbled by slow noise, so it never reads as a circle. R is in slide-height units, scaled by the size setting.
float influence(vec2 p, float R) {
  vec2 d = (p - uMouse) * vec2(asp(), 1.0);
  float wob = vnoise(d * 2.6 + vec2(uTime * 0.15, -uTime * 0.12)) - 0.5;
  float x = length(d) * (1.0 + wob * 0.7) / (R * uFxSize);
  float k = mix(3.5, 1.2, clamp(uFxSoft * 0.5, 0.0, 1.0));
  return exp(-pow(x * 1.45, k));
}

// Click toggle. wipeAmt is 1 where the new state has arrived: it spreads from the click point as a soft,
// noisy front (ink soaking in) instead of a clean ring. The front travels at a constant speed (as it always did).
float wipeRadius() { return uClick.z * 1.7; }
float wipeAmt(vec2 p) {
  vec2 a = vec2(asp(), 1.0);
  vec2 q = (p - uClick.xy) * a;
  float n = vnoise(q * 3.2 + 4.0) * 0.65 + vnoise(q * 8.0 + 1.7) * 0.35;
  float edge = length(q) + (n - 0.5) * 0.6;
  float feather = 0.16 + 0.2 * uFxSoft;
  float front = wipeRadius();
  return smoothstep(front, front - feather, edge);
}
// 1 where the toggled variant applies (scaled by the click setting)
float state(vec2 p) {
  return clamp(mix(1.0 - uToggle, uToggle, wipeAmt(p)) * uFxClick, 0.0, 1.0);
}
// A faint, wide glow riding the spreading front. Barely there on purpose.
float ring(vec2 p) {
  float m = wipeAmt(p);
  return 4.0 * m * (1.0 - m) * (1.0 - smoothstep(0.8, 1.6, uClick.z)) * 0.5 * uFxClick;
}
`;

const MAIN = /* glsl */ `
void main() {
  vec3 col = fx(vUv) * uDim;
  vec2 q = (vUv - 0.5) * uSize;
  vec2 d = abs(q) - uSize * 0.5 + uRadius;
  float sdf = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - uRadius;
  float a = 1.0 - smoothstep(-1.0, 0.0, sdf);
  gl_FragColor = vec4(col * a, a);   // premultiplied
}`;

const none = /* glsl */ `
vec3 fx(vec2 p) {
  return tex(p);
}`;

// Hover: a gentle lens that magnifies around the cursor; drag smears. Click: colors invert.
const invert = /* glsl */ `
vec3 fx(vec2 p) {
  float f = influence(p, 0.2 + 0.1 * uPress) * (0.35 + 0.65 * uHover);
  // magnify with a displacement proportional to the distance from the cursor: zero at the center, no pinch point
  vec2 disp = (-(p - uMouse) * f * (0.16 + 0.12 * uPress) + uVel * f * 1.4 + uDrag * f * 0.45) * uFxStrength;
  disp += vec2(sin(p.y * 18.0 + uTime * 1.3), cos(p.x * 14.0 - uTime)) * 0.0015 * uFxIdle;
  vec3 c = tex(p + disp);
  c = mix(c, 1.0 - c, state(p));
  return c + ring(p) * 0.4;
}`;

// Moving the pointer splits the color channels along the motion. Click: duotone.
const rgb = /* glsl */ `
vec3 fx(vec2 p) {
  vec2 v = uVel * 2.6 + uDrag * 0.6;
  float sp = length(v);
  vec2 dir = sp > 1e-4 ? v / sp : vec2(1.0, 0.0);
  float amt = (0.003 + 0.004 * uHover + min(sp * 0.5, 0.03) + uPress * 0.008) * uFxStrength;
  vec2 q = p + vec2(sin(p.y * 30.0 + uTime * 1.5), 0.0) * 0.0015 * (1.0 + uPress * 6.0) * uFxIdle;
  vec3 c = vec3(tex(q + dir * amt).r, tex(q).g, tex(q - dir * amt).b);
  vec3 duo = mix(uBg, uAccent, smoothstep(0.12, 0.85, luma(c))) + c * 0.12;
  c = mix(c, duo, state(p));
  return c + ring(p) * 0.35;
}`;

// The image flows around the cursor. Click: a soft swirl at the click point that settles, and color drains.
const liquid = /* glsl */ `
vec3 fx(vec2 p) {
  float f = influence(p, 0.34) * (0.4 + 0.6 * uHover);
  vec2 q = p * vec2(asp(), 1.0) * 3.0;
  vec2 n = vec2(vnoise(q + uTime * 0.25), vnoise(q.yx + 9.0 - uTime * 0.2)) - 0.5;
  vec2 disp = n * (0.018 * uFxIdle + f * (0.06 + 0.1 * uPress) * uFxStrength) + uVel * f * 0.8 * uFxStrength;
  vec2 cd = (p - uClick.xy) * vec2(asp(), 1.0);
  float puff = exp(-length(cd) * 2.6) * exp(-uClick.z * 1.2) * uFxClick;
  disp += (vec2(-cd.y, cd.x) * 0.25 + n * 0.12) * puff * uFxStrength / vec2(asp(), 1.0);
  vec3 c = tex(p + disp);
  c = mix(c, vec3(luma(c)) * 1.1, state(p) * 0.92);
  return c + ring(p) * 0.3;
}`;

const pixel = /* glsl */ `
vec3 fx(vec2 p) {
  vec2 g = vec2(34.0 * asp(), 34.0);
  vec2 pc = (floor(p * g) + 0.5) / g;
  float d = length((p - uMouse) * vec2(asp(), 1.0));
  float R = 0.14 + 0.08 * uHover + 0.16 * uPress;
  float lens = smoothstep(R, R * 0.7, d);
  float sharp = mix(lens, 1.0 - lens, state(p));
  vec3 c = mix(tex(pc), tex(p + uVel * lens * 0.5), sharp);
  vec2 fr = fract(p * g);
  c -= step(0.94, max(fr.x, fr.y)) * (1.0 - sharp) * 0.12;
  return c + ring(p) * 0.3;
}`;

// Dragging shears horizontal strips. Click: strips shift most near the click, then turn vertical.
const slice = /* glsl */ `
vec3 fx(vec2 p) {
  float tg = state(p);
  float rows = 16.0;
  float id = floor(mix(p.y, p.x, tg) * rows);
  float h = hash(vec2(id, 3.1)) - 0.5;
  float drive = clamp(mix(uDrag.x + uVel.x * 2.0, uDrag.y + uVel.y * 2.0, tg), -0.22, 0.22);
  float nearC = exp(-length((p - uClick.xy) * vec2(asp(), 1.0)) * 1.6);   // the burst is strongest at the click
  float s = (h * 2.0 * drive * 0.8 + h * exp(-uClick.z * 3.0) * 0.12 * nearC * uFxClick + sin(uTime * 0.5 + id) * 0.003 * uFxIdle) * uFxStrength;
  vec2 off = mix(vec2(s, 0.0), vec2(0.0, s), tg);
  vec2 sp = mix(vec2(s * 0.3, 0.0), vec2(0.0, s * 0.3), tg);
  vec3 c = vec3(tex(p + off + sp).r, tex(p + off).g, tex(p + off - sp).b);
  return c + ring(p) * 0.3;
}`;

export const EFFECTS = { none, invert, rgb, liquid, pixel, slice } as const;
export type EffectKey = keyof typeof EFFECTS;

export const fragmentFor = (effect: EffectKey) => HEADER + EFFECTS[effect] + MAIN;
