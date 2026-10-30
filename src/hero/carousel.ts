import gsap from 'gsap';
import { lenis } from '../setup/lenis';
import type { SlideConfig, EffectSettings, FitMode } from '../config/carousel';
import { VERTEX, fragmentFor, type EffectKey } from './effects';

/**
 * WebGL image carousel. One canvas draws every slide as a quad with its own effect shader.
 * Layout is a continuous `pos` (slide index as a float) so slides glide; `mode` (0..1) blends
 * the normal layout into the expanded one where the active slide fills the stage.
 */

export interface Options {
  autoplayMs: number;
  pauseOnHover: boolean;
  /** fire each slide's click effect by itself shortly after the slide arrives */
  autoEffects: boolean;
  /** how far (as a ratio) an image's shape may differ from the slide's before 'auto' fit shows it whole */
  autoFitTolerance: number;
}

/** A slide as sent from the server: config plus its resolved effect settings and fit. */
export type SlideData = SlideConfig & { settings: EffectSettings; fit: FitMode; focus: [number, number] };

interface Prog {
  program: WebGLProgram;
  loc: Record<string, WebGLUniformLocation | null>;
}

interface Slide {
  cfg: SlideData;
  tex: WebGLTexture | null;
  texBlur: WebGLTexture | null;
  img: [number, number];
  mouse: [number, number];
  vel: [number, number];
  drag: [number, number];
  last: [number, number] | null;
  hover: number;
  press: number;
  toggle: number;
  click: [number, number];
  clickAt: number;
}

const UNIFORMS = [
  'uRect', 'uCanvas', 'uTex', 'uImg', 'uSize', 'uTime', 'uHover', 'uPress', 'uToggle', 'uDim', 'uRadius',
  'uShift', 'uZoom', 'uMove', 'uMouse', 'uVel', 'uDrag', 'uClick', 'uAccent', 'uBg',
  'uTexBlur', 'uFit', 'uBlurBg', 'uFocus', 'uFxStrength', 'uFxSize', 'uFxSoft', 'uFxClick', 'uFxIdle',
];

const mod = (n: number, m: number) => ((n % m) + m) % m;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Resolve any CSS color (hex, rgb(), named…) to 0..1 rgb. */
function cssColor(value: string, fallback: [number, number, number]): [number, number, number] {
  const c = document.createElement('canvas').getContext('2d');
  if (!c || !value.trim()) return fallback;
  c.fillStyle = '#000';
  c.fillStyle = value.trim();
  const m = c.fillStyle.match(/^#([0-9a-f]{6})$/i);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * A tiny copy of the image (halved repeatedly so the result is a proper average, not aliased).
 * Stretched back up by the GPU it becomes the soft backdrop behind a letterboxed image.
 */
function tinyCopy(img: HTMLImageElement, maxDim: number): HTMLCanvasElement {
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  const k = maxDim / Math.max(w, h);
  const tw = Math.max(2, Math.round(w * k));
  const th = Math.max(2, Math.round(h * k));
  let src: CanvasImageSource = img;
  while (w > tw * 2) {
    w = Math.max(tw, Math.ceil(w / 2));
    h = Math.max(th, Math.ceil(h / 2));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d')!;
    g.imageSmoothingQuality = 'high';
    g.drawImage(src, 0, 0, w, h);
    src = c;
  }
  const out = document.createElement('canvas');
  out.width = tw;
  out.height = th;
  const g = out.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, tw, th);
  return out;
}

export class Carousel {
  private root: HTMLElement;
  private stage: HTMLElement;
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private slides: Slide[];
  private n: number;
  private opts: Options;
  private programs = new Map<EffectKey, Prog>();
  private buffer: WebGLBuffer | null = null;

  private pos = 0;
  private target = 0;
  private mode = 0;
  private maximized = false;
  private busy = false;
  private time = 0;
  private lastTs = 0;
  private raf = 0;
  private W = 1;
  private H = 1;
  private dpr = 1;

  private ready = false;
  private inView = false;
  private hovered = false;
  private playing = true; // user-controlled autoplay switch
  private timer = 0;
  private userDriven = false;
  private fxTimer = 0;
  private lastWheel = 0;
  private gestureAtTop = false;
  private lockUntil = 0;
  private hAcc = 0;
  private hArmed = true;
  private lastPos = 0;
  private moveVel = 0;
  private colors = { accent: [0.88, 0.25, 0.18] as [number, number, number], bg: [0.08, 0.07, 0.07] as [number, number, number] };

  private ptr = { x: 0, y: 0, inside: false, down: false, sx: 0, sy: 0, st: 0, moved: 0 };

  private ui: Record<string, HTMLElement | null> = {};

  constructor(root: HTMLElement, cfg: SlideData[], opts: Options) {
    this.root = root;
    this.opts = opts;
    this.stage = root.querySelector<HTMLElement>('.cr-stage')!;
    this.canvas = root.querySelector<HTMLCanvasElement>('.cr-canvas')!;
    this.n = cfg.length;
    this.slides = cfg.map((c) => ({
      cfg: c, tex: null, texBlur: null, img: [1, 1], mouse: [0.5, 0.5], vel: [0, 0], drag: [0, 0], last: null,
      hover: 0, press: 0, toggle: 0, click: [0.5, 0.5], clickAt: -1e9,
    }));
    for (const k of ['prev', 'next', 'count', 'title', 'hint', 'play', 'close', 'status']) {
      this.ui[k] = root.querySelector<HTMLElement>(`[data-ui="${k}"]`);
    }
    this.playing = !reduced();

    this.readColors();
    this.setupGL();
    this.bind();
    this.updateUI();

    root.style.opacity = '0';
    const start = () => this.reveal();
    if (document.documentElement.classList.contains('no-splash')) start();
    else window.addEventListener('splash:reveal', start, { once: true });
  }

  // ------------------------------------------------------------------ setup
  private readColors() {
    const cs = getComputedStyle(document.documentElement);
    this.colors.accent = cssColor(cs.getPropertyValue('--accent'), this.colors.accent);
    this.colors.bg = cssColor(cs.getPropertyValue('--bg'), this.colors.bg);
  }

  private setupGL() {
    const gl = this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) {
      this.root.classList.add('no-gl'); // static <img> fallback
      return;
    }
    this.gl = gl;
    this.programs.clear();
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    for (const s of this.slides) {
      const key = s.cfg.effect as EffectKey;
      if (!this.programs.has(key)) {
        const p = this.buildProgram(key);
        if (p) this.programs.set(key, p);
      }
      s.tex = this.makeTexture();
      s.texBlur = this.makeTexture();
      this.load(s);
    }
  }

  private buildProgram(effect: EffectKey): Prog | null {
    const gl = this.gl!;
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(`[carousel] ${effect} shader:`, gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentFor(effect));
    if (!vs || !fs) return null;
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'aPos');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[carousel] link failed:', gl.getProgramInfoLog(program));
      return null;
    }
    const loc: Prog['loc'] = {};
    for (const u of UNIFORMS) loc[u] = gl.getUniformLocation(program, u);
    return { program, loc };
  }

  private makeTexture(): WebGLTexture {
    const gl = this.gl!;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    // 1x1 placeholder in the surface color until the image arrives
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([27, 24, 22, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  private load(s: Slide) {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const gl = this.gl;
      if (!gl || !s.tex) return;
      gl.bindTexture(gl.TEXTURE_2D, s.tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      s.img = [img.naturalWidth, img.naturalHeight];
      if (s.texBlur) {
        gl.bindTexture(gl.TEXTURE_2D, s.texBlur);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tinyCopy(img, 48));
      }
      this.kick();
    };
    img.onerror = () => console.warn(`[carousel] could not load ${s.cfg.src}`);
    img.src = s.cfg.src;
  }

  // ------------------------------------------------------------------ events
  private bind() {
    const { canvas, stage } = this;

    new ResizeObserver(() => this.resize()).observe(stage);
    this.resize();

    new IntersectionObserver(
      (e) => {
        this.inView = e[0].isIntersecting;
        this.kick();
        this.schedule();
      },
      { threshold: 0.2 },
    ).observe(this.root);

    document.addEventListener('visibilitychange', () => {
      this.kick();
      this.schedule();
    });

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.setupGL();
      this.kick();
    });

    // pointer
    canvas.addEventListener('pointermove', (e) => {
      this.setPointer(e);
      this.ptr.inside = true;
      if (this.ptr.down) this.ptr.moved = Math.max(this.ptr.moved, Math.hypot(e.clientX - this.ptr.sx, e.clientY - this.ptr.sy));
    });
    canvas.addEventListener('pointerenter', (e) => {
      this.setPointer(e);
      this.ptr.inside = true;
    });
    canvas.addEventListener('pointerleave', () => {
      this.ptr.inside = false;
    });
    canvas.addEventListener('pointerdown', (e) => {
      this.setPointer(e);
      Object.assign(this.ptr, { down: true, sx: e.clientX, sy: e.clientY, st: performance.now(), moved: 0, inside: true });
      canvas.setPointerCapture(e.pointerId);
      this.schedule();
    });
    const up = (e: PointerEvent) => {
      if (!this.ptr.down) return;
      this.ptr.down = false;
      const dx = e.clientX - this.ptr.sx;
      const dy = e.clientY - this.ptr.sy;
      const quick = performance.now() - this.ptr.st < 500;
      if (e.type === 'pointerup') {
        if (this.ptr.moved < 8 && quick) this.tap();
        else if (!this.maximized && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) this.go(dx < 0 ? 1 : -1, true);
      }
      if (e.pointerType !== 'mouse') this.ptr.inside = false;
      this.schedule();
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    // ui
    this.ui.prev?.addEventListener('click', () => this.go(-1, true));
    this.ui.next?.addEventListener('click', () => this.go(1, true));
    this.ui.close?.addEventListener('click', () => this.minimize());
    this.ui.play?.addEventListener('click', () => {
      this.playing = !this.playing;
      this.updateUI();
      this.schedule();
    });
    // hovering the buttons also holds autoplay
    this.root.addEventListener('pointerenter', () => {
      this.hovered = true;
      this.schedule();
    });
    this.root.addEventListener('pointerleave', () => {
      this.hovered = false;
      this.schedule();
    });

    // keyboard: capture phase so we run before the workspace's Esc handling
    window.addEventListener('keydown', (e) => this.onKey(e), true);
    // Wheel / trackpad:
    //  - horizontal swipe over the carousel changes slide
    //  - scrolling UP while resting at the very top of the page expands it
    //  - scrolling DOWN while expanded returns it to the normal size
    this.root.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); // also stops the browser's swipe-back gesture
      e.stopPropagation(); // and keeps Lenis out of it
      const now = performance.now();
      if (now - this.lastWheel > 200) { this.hAcc = 0; this.hArmed = true; }
      this.lastWheel = now;
      if (!this.hArmed) return; // ignore the inertia tail of the previous swipe
      this.hAcc += e.deltaX;
      if (Math.abs(this.hAcc) > 50) {
        this.go(this.hAcc > 0 ? 1 : -1, true);
        this.hAcc = 0;
        this.hArmed = false;
      }
    }, { passive: false });

    window.addEventListener('wheel', (e) => {
      const now = performance.now();
      const fresh = now - this.lastWheel > 280;
      this.lastWheel = now;
      if (fresh) this.gestureAtTop = window.scrollY <= 1; // only a gesture that STARTED at the top counts
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (this.maximized) {
        if (e.deltaY > 0) this.minimize();
      } else if (
        e.deltaY < -2 && this.gestureAtTop && this.inView && this.ready && !this.busy &&
        now > this.lockUntil && !this.splashActive()
      ) {
        this.maximize();
      }
    }, { passive: true });

    // touch: pulling down at the top of the page expands
    let ty = 0;
    let startedAtTop = false;
    window.addEventListener('touchstart', (e) => {
      ty = e.touches[0].clientY;
      startedAtTop = window.scrollY <= 1;
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (!startedAtTop || this.maximized || this.busy || !this.ready || !this.inView || this.splashActive()) return;
      if (e.touches[0].clientY - ty > 70) {
        startedAtTop = false;
        this.maximize();
      }
    }, { passive: true });
  }

  private splashActive() {
    const s = document.getElementById('splash');
    return !!s && getComputedStyle(s).display !== 'none';
  }

  private onKey(e: KeyboardEvent) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || this.splashActive()) return;
    const t = e.target as HTMLElement | null;
    const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

    if (this.maximized) {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.minimize();
        return;
      }
      if (['ArrowDown', 'PageDown', 'End', ' '].includes(e.key) && !typing) {
        e.preventDefault();
        this.minimize();
        return;
      }
    }
    if (!this.maximized && ['ArrowUp', 'PageUp', 'Home'].includes(e.key) && !typing && !t?.closest('.desk') &&
        window.scrollY <= 1 && this.inView && this.ready && !this.busy) {
      e.preventDefault(); // keyboard equivalent of "scroll up at the top"
      this.maximize();
      return;
    }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (typing || t?.closest('.desk')) return; // the terminal and project windows keep their arrow keys
    if (!this.maximized && !this.inView) return;
    e.preventDefault();
    this.go(e.key === 'ArrowRight' ? 1 : -1, true);
  }

  // ------------------------------------------------------------------ geometry
  private resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(this.stage.clientWidth * this.dpr));
    const h = Math.max(1, Math.round(this.stage.clientHeight * this.dpr));
    if (w !== this.W || h !== this.H || this.canvas.width !== w) {
      this.W = this.canvas.width = w;
      this.H = this.canvas.height = h;
    }
    this.kick();
  }

  /** shortest signed distance (in slides) from the current position to slide i */
  private dist(i: number) {
    return mod(i - this.pos + this.n / 2, this.n) - this.n / 2;
  }

  private rect(d: number) {
    const { W, H, mode } = this;
    const w = lerp(W * 0.76, W, mode);
    const h = lerp(H * 0.94, H, mode);
    const gap = lerp(W * 0.022, 0, mode);
    return { x: W / 2 - w / 2 + d * (w + gap), y: H / 2 - h / 2, w, h };
  }

  private activeIndex() {
    return mod(Math.round(this.target), this.n);
  }

  // ------------------------------------------------------------------ pointer → slide space
  private setPointer(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    this.ptr.x = ((e.clientX - r.left) / r.width) * this.W;
    this.ptr.y = ((e.clientY - r.top) / r.height) * this.H;
  }

  /** pointer position in the active slide's uv space (y up), or null if outside it */
  private localFor(i: number): [number, number] | null {
    const r = this.rect(this.dist(i));
    const u = (this.ptr.x - r.x) / r.w;
    const v = (this.ptr.y - r.y) / r.h;
    return u < 0 || u > 1 || v < 0 || v > 1 ? null : [u, 1 - v];
  }

  private tap() {
    for (let i = 0; i < this.n; i++) {
      const loc = this.localFor(i);
      if (!loc) continue;
      if (i === this.activeIndex()) this.fire(this.slides[i], loc); // click effect, expanded or not
      else if (!this.maximized) this.go(Math.round(this.dist(i)), true); // click a neighbour to bring it in
      return;
    }
  }

  /** flip a slide's click variant, spreading from `at` */
  private fire(s: Slide, at: [number, number]) {
    s.toggle = 1 - s.toggle;
    s.click = at;
    s.clickAt = performance.now();
  }

  /** after a slide arrives, play its click effect once by itself */
  private scheduleAutoFx() {
    clearTimeout(this.fxTimer);
    if (!this.opts.autoEffects || reduced()) return;
    this.fxTimer = window.setTimeout(() => {
      if (this.ptr.down || !this.inView || document.hidden || !this.ready) return;
      const s = this.slides[this.activeIndex()];
      if (s.cfg.effect === 'none' || s.cfg.settings.click <= 0) return;
      if (performance.now() - s.clickAt < 2500) return; // the visitor just played with it
      this.fire(s, [1 + Math.random() * 3, 4 + Math.random() * 3]);
    }, 700);
  }

  // ------------------------------------------------------------------ navigation
  go(delta: number, byUser = false) {
    if (!delta) return;
    this.userDriven ||= byUser;
    this.target += delta;
    gsap.to(this, {
      pos: this.target,
      duration: reduced() ? 0 : 1,
      ease: 'power3.inOut',
      overwrite: 'auto',
      onUpdate: () => this.kick(),
      onComplete: () => this.scheduleAutoFx(),
    });
    this.updateUI();
    this.schedule();
  }

  private schedule() {
    clearTimeout(this.timer);
    const ok =
      this.ready && this.playing && !this.maximized && this.inView && !document.hidden && !reduced() &&
      !(this.opts.pauseOnHover && this.hovered) && !this.ptr.down;
    if (ok) this.timer = window.setTimeout(() => this.go(1), this.opts.autoplayMs);
  }

  // ------------------------------------------------------------------ maximize / minimize
  private maximize() {
    if (this.maximized || this.busy) return;
    this.busy = true;
    this.maximized = true;
    const r = this.stage.getBoundingClientRect();
    Object.assign(this.stage.style, { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
    this.stage.classList.add('is-max');
    this.root.dataset.max = '1';
    lenis.stop();
    const dur = reduced() ? 0 : 0.85;
    gsap.to(this.stage, {
      top: 0, left: 0, width: window.innerWidth, height: window.innerHeight, duration: dur, ease: 'power3.inOut',
      onComplete: () => {
        Object.assign(this.stage.style, { inset: '0', width: '', height: '' });
        this.busy = false;
      },
    });
    gsap.to(this, { mode: 1, duration: dur, ease: 'power3.inOut', onUpdate: () => this.kick() });
    this.updateUI();
    this.schedule();
    this.ui.close?.focus({ preventScroll: true });
  }

  private minimize() {
    if (!this.maximized || this.busy) return;
    this.busy = true;
    const cur = this.stage.getBoundingClientRect();
    const dest = this.root.getBoundingClientRect();
    Object.assign(this.stage.style, { inset: '', top: `${cur.top}px`, left: `${cur.left}px`, width: `${cur.width}px`, height: `${cur.height}px` });
    const dur = reduced() ? 0 : 0.8;
    gsap.to(this.stage, {
      top: dest.top, left: dest.left, width: dest.width, height: dest.height, duration: dur, ease: 'power3.inOut',
      onComplete: () => {
        this.stage.classList.remove('is-max');
        for (const p of ['top', 'left', 'width', 'height', 'inset']) this.stage.style.removeProperty(p);
        this.busy = false;
        this.maximized = false;
        delete this.root.dataset.max;
        // hold the page for a moment so the tail of the scroll gesture that closed it doesn't scroll the page
        this.lockUntil = performance.now() + 700;
        window.setTimeout(() => lenis.start(), 450);
        this.updateUI();
        this.schedule();
      },
    });
    gsap.to(this, { mode: 0, duration: dur, ease: 'power3.inOut', onUpdate: () => this.kick() });
    this.maximized = false; // layout switches immediately; focus/cleanup finish in onComplete
    delete this.root.dataset.max;
    this.updateUI();
  }

  // ------------------------------------------------------------------ UI
  private updateUI() {
    const i = this.activeIndex();
    const s = this.slides[i].cfg;
    const pad = (x: number) => String(x).padStart(2, '0');
    if (this.ui.count) this.ui.count.textContent = `${pad(i + 1)} / ${pad(this.n)}`;
    if (this.ui.title) this.ui.title.textContent = `"${s.title ?? s.src.split('/').pop() ?? ''}"`;
    if (this.ui.hint) this.ui.hint.textContent = s.hint ?? '';
    this.canvas.setAttribute('aria-label', s.alt);
    if (this.ui.status) {
      this.ui.status.setAttribute('aria-live', this.userDriven ? 'polite' : 'off');
      this.ui.status.textContent = `Slide ${i + 1} of ${this.n}: ${s.alt}`;
    }
    if (this.ui.play) {
      this.ui.play.textContent = this.playing ? 'pause' : 'play';
      this.ui.play.setAttribute('aria-label', this.playing ? 'Pause automatic slideshow' : 'Start automatic slideshow');
    }
    const max = this.maximized;
    if (this.ui.close) this.ui.close.hidden = !max;
    this.canvas.style.cursor = 'pointer'; // clickable: every slide has a click effect
    this.root.querySelectorAll<HTMLElement>('.cr-fallback li').forEach((li, k) => li.classList.toggle('is-on', k === i));
  }

  // ------------------------------------------------------------------ intro + loop
  private reveal() {
    if (this.ready) return;
    this.ready = true;
    const r = reduced();
    this.pos = this.target - (r ? 0 : 1.4);
    gsap.to(this.root, { opacity: 1, duration: r ? 0 : 0.9, ease: 'power2.out', delay: r ? 0 : 0.1 });
    gsap.to(this, { pos: this.target, duration: r ? 0 : 1.8, ease: 'power3.out', onUpdate: () => this.kick(), onComplete: () => this.scheduleAutoFx() });
    this.kick();
    this.schedule();
  }

  private shouldRun() {
    return !!this.gl && this.ready && !document.hidden && (this.inView || this.maximized || this.busy);
  }

  /** (re)start the render loop if it should be running */
  private kick() {
    if (!this.raf && (this.shouldRun() || (this.gl && !this.ready))) this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (ts: number) => {
    this.raf = 0;
    const dt = Math.min(64, this.lastTs ? ts - this.lastTs : 16.7);
    this.lastTs = ts;
    if (!this.gl || this.gl.isContextLost()) return;
    if (!reduced()) this.time += dt / 1000;
    this.update(dt);
    this.draw();
    // before the intro, draw once so textures are ready; afterwards loop only while visible
    if (this.shouldRun()) this.raf = requestAnimationFrame(this.frame);
    else this.lastTs = 0;
  };

  private update(dt: number) {
    const norm = 16.7 / dt;
    // how fast the carousel is moving (slides/sec), smoothed: drives a wobble while sliding
    this.moveVel = lerp(this.moveVel, clamp(((this.pos - this.lastPos) / dt) * 1000, -4, 4), 0.2);
    this.lastPos = this.pos;
    const active = this.activeIndex();
    const now = this.time;
    this.slides.forEach((s, i) => {
      const isActive = i === active && Math.abs(this.dist(i)) < 0.6;
      const loc = isActive && this.ptr.inside ? this.localFor(i) : null;

      const idleAmt = reduced() ? 0 : s.cfg.settings.idle; // 0 = holds still when nobody is touching it
      const wander = Math.min(idleAmt, 1.5);
      const idle: [number, number] = [0.5 + 0.34 * wander * Math.sin(now * 0.55 + i), 0.5 + 0.26 * wander * Math.cos(now * 0.4 + i * 1.7)];
      const tgt = loc ?? idle;
      const mx = s.mouse[0];
      const my = s.mouse[1];
      s.mouse[0] = lerp(s.mouse[0], tgt[0], 0.2);
      s.mouse[1] = lerp(s.mouse[1], tgt[1], 0.2);

      if (loc && s.last) {
        const dx = (loc[0] - s.last[0]) * norm;
        const dy = (loc[1] - s.last[1]) * norm;
        s.vel[0] = lerp(s.vel[0], clamp(dx, -0.12, 0.12), 0.3);
        s.vel[1] = lerp(s.vel[1], clamp(dy, -0.12, 0.12), 0.3);
        if (this.ptr.down) {
          s.drag[0] = clamp(s.drag[0] + (loc[0] - s.last[0]), -0.6, 0.6);
          s.drag[1] = clamp(s.drag[1] + (loc[1] - s.last[1]), -0.6, 0.6);
        }
      } else if (isActive && idleAmt > 0) {
        // no pointer: let the wandering idle point drive the motion so the shader is always visibly alive
        s.vel[0] = lerp(s.vel[0], clamp((s.mouse[0] - mx) * norm * 2.2, -0.08, 0.08), 0.15);
        s.vel[1] = lerp(s.vel[1], clamp((s.mouse[1] - my) * norm * 2.2, -0.08, 0.08), 0.15);
      } else {
        s.vel[0] *= 0.9;
        s.vel[1] *= 0.9;
      }
      s.last = loc;
      const decay = this.ptr.down && isActive ? 0.985 : 0.93;
      s.drag[0] *= decay;
      s.drag[1] *= decay;
      s.hover = lerp(s.hover, loc ? 1 : isActive && idleAmt > 0 ? 0.55 * Math.min(idleAmt, 1) : 0, 0.12);
      s.press = lerp(s.press, loc && this.ptr.down ? 1 : 0, 0.15);
    });
  }

  /** 0 = crop to fill, 1 = show the whole image. 'auto' eases between them as the slide's shape drifts from the image's. */
  private fitFor(s: Slide, slideAspect: number) {
    const mode = s.cfg.fit;
    if (mode === 'cover') return 0;
    if (mode === 'contain' || mode === 'blur') return 1;
    const ia = s.img[0] / s.img[1];
    const mismatch = Math.max(slideAspect / ia, ia / slideAspect);
    const tol = this.opts.autoFitTolerance;
    return smoothstep(tol, tol + 0.3, mismatch);
  }

  private draw() {
    const gl = this.gl!;
    gl.viewport(0, 0, this.W, this.H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const order = this.slides.map((_, i) => i).sort((a, b) => Math.abs(this.dist(b)) - Math.abs(this.dist(a)));
    for (const i of order) {
      const s = this.slides[i];
      const d = this.dist(i);
      const r = this.rect(d);
      if (r.x > this.W || r.x + r.w < 0) continue;
      const p = this.programs.get(s.cfg.effect as EffectKey);
      if (!p) continue;
      const u = p.loc;
      gl.useProgram(p.program);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, s.texBlur);
      gl.uniform1i(u.uTexBlur, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, s.tex);
      gl.uniform1i(u.uTex, 0);
      gl.uniform4f(u.uRect, r.x, r.y, r.w, r.h);
      gl.uniform2f(u.uCanvas, this.W, this.H);
      gl.uniform2f(u.uImg, s.img[0], s.img[1]);
      gl.uniform2f(u.uSize, r.w, r.h);
      gl.uniform1f(u.uTime, this.time);
      gl.uniform1f(u.uHover, s.hover);
      gl.uniform1f(u.uPress, s.press);
      gl.uniform1f(u.uToggle, s.toggle);
      gl.uniform1f(u.uDim, lerp(lerp(1, 0.5, Math.min(Math.abs(d), 1)), 1, this.mode));
      gl.uniform1f(u.uRadius, lerp(6 * this.dpr, 0, this.mode));
      gl.uniform1f(u.uShift, clamp(d, -1.5, 1.5) * 0.045 * (1 - this.mode));
      gl.uniform1f(u.uZoom, lerp(1.12, 1.02, this.mode));
      gl.uniform1f(u.uMove, this.moveVel);
      gl.uniform2f(u.uMouse, s.mouse[0], s.mouse[1]);
      gl.uniform2f(u.uVel, s.vel[0], s.vel[1]);
      gl.uniform2f(u.uDrag, s.drag[0], s.drag[1]);
      gl.uniform3f(u.uClick, s.click[0], s.click[1], Math.min(100, (performance.now() - s.clickAt) / 1000));
      const st = s.cfg.settings;
      gl.uniform1f(u.uFit, this.fitFor(s, r.w / r.h));
      gl.uniform1f(u.uBlurBg, s.cfg.fit === 'contain' ? 0 : 1);
      gl.uniform2f(u.uFocus, s.cfg.focus[0], 1 - s.cfg.focus[1]); // config y runs from the top, the texture's from the bottom
      gl.uniform1f(u.uFxStrength, st.strength);
      gl.uniform1f(u.uFxSize, st.size);
      gl.uniform1f(u.uFxSoft, st.softness);
      gl.uniform1f(u.uFxClick, st.click);
      gl.uniform1f(u.uFxIdle, st.idle);
      gl.uniform3f(u.uAccent, ...this.colors.accent);
      gl.uniform3f(u.uBg, ...this.colors.bg);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }
}
