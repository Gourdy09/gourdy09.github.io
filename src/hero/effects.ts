/**
 * One fragment shader per effect. Every effect implements `vec3 fx(vec2 p)`:
 * p is the slide-local uv (0..1, origin bottom-left) and the return value is the pixel color.
 *
 * Shared uniforms (see HEADER): uMouse/uVel/uDrag/uPress/uHover describe the pointer in slide space,
 * uToggle + uClick drive the click-to-toggle circular wipe via state(p) and ring(p).
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
uniform sampler2D uTex;
uniform vec2 uImg;      // image size in px
uniform vec2 uSize;     // slide size in px
uniform float uTime, uHover, uPress, uToggle, uDim, uRadius, uShift, uZoom, uMove;
uniform vec2 uMouse, uVel, uDrag;
uniform vec3 uClick;    // xy = last click (uv), z = seconds since the click
uniform vec3 uAccent, uBg;

float asp() { return uSize.x / uSize.y; }

vec2 cover(vec2 uv) {
  float ra = uSize.x / uSize.y;
  float ia = uImg.x / uImg.y;
  vec2 s = ra > ia ? vec2(1.0, ia / ra) : vec2(ra / ia, 1.0);
  uv.x += uShift + uMove * 0.035 * sin(uv.y * 6.2831 + uTime * 2.0);   // ripples while sliding
  uv.y += uMove * 0.01 * sin(uv.x * 9.0);
  return (uv - 0.5) * s / uZoom + 0.5;
}
vec3 tex(vec2 uv) { return texture2D(uTex, cover(uv)).rgb; }

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 x) {
  vec2 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Click toggle: 1 where the toggled variant applies. The new state spreads in a circle from the click.
float wipeRadius() { return uClick.z * 1.7; }
float state(vec2 p) {
  float d = length((p - uClick.xy) * vec2(asp(), 1.0));
  float m = smoothstep(wipeRadius(), wipeRadius() - 0.05, d);
  return mix(1.0 - uToggle, uToggle, m);
}
// A bright rim travelling with the wipe edge
float ring(vec2 p) {
  float d = length((p - uClick.xy) * vec2(asp(), 1.0));
  return smoothstep(0.035, 0.0, abs(d - wipeRadius())) * (1.0 - smoothstep(0.8, 1.6, uClick.z));
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

const invert = /* glsl */ `
vec3 fx(vec2 p) {
  vec2 d = (p - uMouse) * vec2(asp(), 1.0);
  float dist = length(d);
  float r = 0.17 + 0.13 * uPress;
  float f = smoothstep(r, 0.0, dist) * (0.35 + 0.65 * uHover);
  vec2 dir = d / (dist + 1e-4);
  vec2 disp = -dir * f * f * (0.04 + 0.08 * uPress) + uVel * f * 1.6 + uDrag * f * 0.5;
  disp += vec2(sin(p.y * 18.0 + uTime * 1.3), cos(p.x * 14.0 - uTime)) * 0.0015;
  vec3 c = tex(p + disp);
  c = mix(c, 1.0 - c, state(p));
  return c + ring(p) * 0.4;
}`;

const rgb = /* glsl */ `
vec3 fx(vec2 p) {
  vec2 v = uVel * 2.6 + uDrag * 0.6;
  float sp = length(v);
  vec2 dir = sp > 1e-4 ? v / sp : vec2(1.0, 0.0);
  float amt = 0.003 + 0.004 * uHover + min(sp * 0.5, 0.03) + uPress * 0.008;
  vec2 q = p + vec2(sin(p.y * 30.0 + uTime * 1.5), 0.0) * 0.0015 * (1.0 + uPress * 6.0);
  vec3 c = vec3(tex(q + dir * amt).r, tex(q).g, tex(q - dir * amt).b);
  vec3 duo = mix(uBg, uAccent, smoothstep(0.12, 0.85, luma(c))) + c * 0.12;
  c = mix(c, duo, state(p));
  return c + ring(p) * 0.35;
}`;

const liquid = /* glsl */ `
vec3 fx(vec2 p) {
  vec2 d = (p - uMouse) * vec2(asp(), 1.0);
  float f = smoothstep(0.46, 0.0, length(d)) * (0.4 + 0.6 * uHover);
  vec2 q = p * vec2(asp(), 1.0) * 3.0;
  vec2 n = vec2(vnoise(q + uTime * 0.25), vnoise(q.yx + 9.0 - uTime * 0.2)) - 0.5;
  vec2 disp = n * (0.018 + f * (0.07 + 0.12 * uPress)) + uVel * f * 0.9;
  vec2 cd = (p - uClick.xy) * vec2(asp(), 1.0);
  float cl = length(cd);
  float wave = exp(-pow((cl - uClick.z * 0.9) * 12.0, 2.0)) * exp(-uClick.z * 1.2);
  disp += cd / (cl + 1e-4) * wave * 0.05 / vec2(asp(), 1.0);
  vec3 c = tex(p + disp);
  c = mix(c, vec3(luma(c)) * 1.1, state(p) * 0.92);
  return c + wave * 0.12;
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

const slice = /* glsl */ `
vec3 fx(vec2 p) {
  float tg = state(p);
  float rows = 16.0;
  float id = floor(mix(p.y, p.x, tg) * rows);
  float h = hash(vec2(id, 3.1)) - 0.5;
  float drive = clamp(mix(uDrag.x + uVel.x * 2.0, uDrag.y + uVel.y * 2.0, tg), -0.22, 0.22);
  float s = h * 2.0 * drive * 0.8 + h * exp(-uClick.z * 3.0) * 0.12 + sin(uTime * 0.5 + id) * 0.003;
  vec2 off = mix(vec2(s, 0.0), vec2(0.0, s), tg);
  vec2 sp = mix(vec2(s * 0.3, 0.0), vec2(0.0, s * 0.3), tg);
  vec3 c = vec3(tex(p + off + sp).r, tex(p + off).g, tex(p + off - sp).b);
  return c + ring(p) * 0.3;
}`;

export const EFFECTS = { invert, rgb, liquid, pixel, slice } as const;
export type EffectKey = keyof typeof EFFECTS;

export const fragmentFor = (effect: EffectKey) => HEADER + EFFECTS[effect] + MAIN;
