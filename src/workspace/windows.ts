/**
 * Generic window manager. Windows reference a project slug; content is cloned from the
 * pre-rendered <template id="tpl-<slug>">. Knows nothing about GitHub or the terminal.
 */
export type WinState = 'normal' | 'minimized' | 'maximized';
export type OpenResult = 'opened' | 'focused' | 'restored' | 'missing';

export interface WinInfo {
  id: string;
  title: string;
  state: WinState;
  focused: boolean;
  isProject: boolean;
  closable: boolean;
}

interface Win {
  id: string;
  el: HTMLElement;
  body: HTMLElement;
  title: string;
  state: WinState;
  closable: boolean;
  isProject: boolean;
  scroll: number;
}

const MOBILE = '(max-width: 700px)';
export const isMobile = () => matchMedia(MOBILE).matches;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export class WindowManager {
  private stage: HTMLElement;
  private wins = new Map<string, Win>();
  private order: string[] = [];
  private listeners = new Set<() => void>();
  private cascade = 0;
  private lazyIO: IntersectionObserver;
  private viewIO: IntersectionObserver;
  private titles: Map<string, string>;

  /** titles: slug -> project title */
  constructor(stage: HTMLElement, titles: Map<string, string>) {
    this.stage = stage;
    this.titles = titles;

    // Load iframes/videos only when they approach the viewport.
    this.lazyIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          this.lazyIO.unobserve(e.target);
          this.loadLazy(e.target as HTMLElement);
        }
      },
      { rootMargin: '200px' },
    );
    // Track which videos are actually visible.
    this.viewIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.target as HTMLElement).dataset.inview = e.isIntersecting ? '1' : '0';
        this.syncMedia();
      },
      { threshold: 0.25 },
    );
    document.addEventListener('visibilitychange', () => this.syncMedia());
    window.addEventListener('resize', () => this.clampAll());
  }

  onChange(fn: () => void) {
    this.listeners.add(fn);
  }
  private emit() {
    this.order.forEach((id, i) => {
      const w = this.wins.get(id)!;
      w.el.style.zIndex = String(i + 1);
      w.el.classList.toggle('is-min', w.state === 'minimized');
      w.el.classList.toggle('is-max', w.state === 'maximized');
      w.el.classList.toggle('is-focused', id === this.focusedId());
    });
    this.syncMedia();
    this.listeners.forEach((fn) => fn());
  }

  /** Top-most visible window. */
  focusedId(): string | undefined {
    for (let i = this.order.length - 1; i >= 0; i--) {
      if (this.wins.get(this.order[i])!.state !== 'minimized') return this.order[i];
    }
    return undefined;
  }

  list(): WinInfo[] {
    const focused = this.focusedId();
    return [...this.wins.values()].map((w) => ({
      id: w.id, title: w.title, state: w.state, focused: w.id === focused, isProject: w.isProject, closable: w.closable,
    }));
  }
  /** Open project windows, oldest first. */
  listProjects(): WinInfo[] {
    return this.list().filter((w) => w.isProject);
  }
  has(id: string) {
    return this.wins.has(id);
  }
  element(id: string) {
    return this.wins.get(id)?.el;
  }

  /** Adopt a window that already exists in the DOM (the terminal). */
  register(id: string, el: HTMLElement, opts: { title: string; closable: boolean }) {
    const body = el.querySelector<HTMLElement>('.win-body')!;
    const w: Win = { id, el, body, title: opts.title, state: 'normal', closable: opts.closable, isProject: false, scroll: 0 };
    this.wins.set(id, w);
    this.order.push(id);
    this.wire(w);
    this.emit();
  }

  open(slug: string, moveFocus = false): OpenResult {
    const existing = this.wins.get(slug);
    if (existing) {
      const wasMin = existing.state === 'minimized';
      this.focus(slug);
      if (moveFocus) existing.el.focus({ preventScroll: true });
      return wasMin ? 'restored' : 'focused';
    }
    const tpl = document.getElementById(`tpl-${slug}`) as HTMLTemplateElement | null;
    if (!tpl) return 'missing';

    const title = this.titles.get(slug) ?? slug;
    const el = document.createElement('section');
    el.className = 'win is-new';
    el.dataset.win = slug;
    el.tabIndex = -1;
    el.setAttribute('aria-label', title);
    el.innerHTML = `
      <header class="win-bar">
        <button class="win-btn win-back" type="button" aria-label="Back to terminal" data-act="back">‹</button>
        <span class="win-title"></span>
        <span class="win-ctl">
          <button class="win-btn" type="button" aria-label="Minimize ${slug}" data-act="min">–</button>
          <button class="win-btn max" type="button" aria-label="Maximize ${slug}" data-act="max">▢</button>
          <button class="win-btn close" type="button" aria-label="Close ${slug}" data-act="close">×</button>
        </span>
      </header>
      <div class="win-body" data-lenis-prevent></div>`;
    el.querySelector('.win-title')!.textContent = `${slug} — ${title}`;
    const body = el.querySelector<HTMLElement>('.win-body')!;
    body.append(tpl.content.cloneNode(true));

    const compact = body.querySelector('.pp')?.getAttribute('data-compact') === '1';
    if (compact) el.classList.add('is-compact');

    const w: Win = { id: slug, el, body, title, state: 'normal', closable: true, isProject: true, scroll: 0 };
    this.wins.set(slug, w);
    this.order.push(slug);
    this.stage.append(el);
    this.place(w, compact);
    this.wire(w);

    body.querySelectorAll<HTMLElement>('[data-src]').forEach((n) => this.lazyIO.observe(n));
    body.querySelectorAll<HTMLVideoElement>('video').forEach((v) => {
      v.muted = true;
      v.dataset.intent = v.dataset.autoplay === '1' && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'play' : 'pause';
      v.dataset.inview = '0';
      this.viewIO.observe(v);
      this.wireVideo(v);
    });

    this.emit();
    if (moveFocus) el.focus({ preventScroll: true });
    return 'opened';
  }

  close(id: string): boolean {
    const w = this.wins.get(id);
    if (!w || !w.closable) return false;
    w.el.querySelectorAll('[data-src]').forEach((n) => this.lazyIO.unobserve(n));
    w.el.querySelectorAll('video').forEach((v) => {
      this.viewIO.unobserve(v);
      v.pause();
    });
    w.el.remove();
    this.wins.delete(id);
    this.order = this.order.filter((x) => x !== id);
    this.emit();
    return true;
  }

  minimize(id: string): 'ok' | 'already' | 'missing' | 'unsupported' {
    const w = this.wins.get(id);
    if (!w) return 'missing';
    if (!w.closable) return 'unsupported'; // the terminal stays available
    if (w.state === 'minimized') return 'already';
    w.scroll = w.body.scrollTop;
    w.state = 'minimized';
    this.emit();
    return 'ok';
  }

  restore(id: string): 'ok' | 'already' | 'missing' {
    const w = this.wins.get(id);
    if (!w) return 'missing';
    if (w.state !== 'minimized') return 'already';
    w.state = 'normal';
    this.raise(id);
    this.emit();
    w.body.scrollTop = w.scroll; // display:none resets scroll in some browsers
    return 'ok';
  }

  toggleMaximize(id: string) {
    const w = this.wins.get(id);
    if (!w || w.state === 'minimized') return;
    w.state = w.state === 'maximized' ? 'normal' : 'maximized';
    this.raise(id);
    this.emit();
  }

  focus(id: string) {
    const w = this.wins.get(id);
    if (!w) return;
    if (w.state === 'minimized') {
      this.restore(id);
      return;
    }
    this.raise(id);
    this.emit();
  }

  /** Taskbar behaviour: minimized -> restore, focused -> minimize, otherwise raise. */
  activate(id: string) {
    const w = this.wins.get(id);
    if (!w) return;
    if (w.state === 'minimized') this.restore(id);
    else if (id === this.focusedId() && w.closable) this.minimize(id);
    else this.focus(id);
  }

  private raise(id: string) {
    this.order = this.order.filter((x) => x !== id);
    this.order.push(id);
  }

  // ---------- geometry ----------
  private place(w: Win, compact: boolean) {
    if (isMobile()) return; // CSS makes windows full-screen on mobile
    const sw = this.stage.clientWidth;
    const sh = this.stage.clientHeight;
    const n = this.cascade++ % 6;
    const width = Math.min(sw - 16, Math.max(380, Math.round(sw * 0.52)));
    const height = Math.min(sh - 16, Math.round(sh * 0.9));
    const estH = compact ? 260 : height;
    w.el.style.width = `${width}px`;
    if (!compact) w.el.style.height = `${height}px`;
    w.el.style.left = `${clamp(Math.round(sw * 0.46) + n * 26, 8, Math.max(8, sw - width - 8))}px`;
    w.el.style.top = `${clamp(8 + n * 26, 8, Math.max(8, sh - estH - 8))}px`;
  }

  /** Convert CSS-driven geometry (terminal) to explicit pixels so it can be dragged. */
  private pin(w: Win) {
    const s = this.stage.getBoundingClientRect();
    const r = w.el.getBoundingClientRect();
    Object.assign(w.el.style, {
      left: `${r.left - s.left}px`, top: `${r.top - s.top}px`, bottom: 'auto',
      width: `${r.width}px`, height: w.el.classList.contains('is-compact') ? '' : `${r.height}px`,
    });
  }

  private clampAll() {
    if (isMobile()) return;
    const sw = this.stage.clientWidth;
    const sh = this.stage.clientHeight;
    for (const w of this.wins.values()) {
      if (!w.el.style.left) continue;
      w.el.style.left = `${clamp(w.el.offsetLeft, 8 - w.el.offsetWidth + 96, sw - 96)}px`;
      w.el.style.top = `${clamp(w.el.offsetTop, 0, sh - 32)}px`;
    }
  }

  private wire(w: Win) {
    const el = w.el;
    el.addEventListener('pointerdown', () => {
      if (this.focusedId() !== w.id) this.focus(w.id);
    }, true);

    el.querySelector('.win-bar')!.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (act === 'close') this.close(w.id);
      else if (act === 'min') this.minimize(w.id);
      else if (act === 'max') this.toggleMaximize(w.id);
      else if (act === 'back') this.focus('terminal');
    });
    el.querySelector('.win-bar')!.addEventListener('dblclick', (e) => {
      if (!(e.target as HTMLElement).closest('button') && !isMobile()) this.toggleMaximize(w.id);
    });

    // dragging (desktop only)
    const bar = el.querySelector<HTMLElement>('.win-bar')!;
    bar.addEventListener('pointerdown', (e: PointerEvent) => {
      if (isMobile() || w.state !== 'normal' || (e.target as HTMLElement).closest('button')) return;
      this.pin(w);
      const sw = this.stage.clientWidth;
      const sh = this.stage.clientHeight;
      const start = { x: e.clientX, y: e.clientY, l: el.offsetLeft, t: el.offsetTop };
      bar.setPointerCapture(e.pointerId);
      const move = (ev: PointerEvent) => {
        el.style.left = `${clamp(start.l + ev.clientX - start.x, 96 - el.offsetWidth, sw - 96)}px`;
        el.style.top = `${clamp(start.t + ev.clientY - start.y, 0, sh - 32)}px`;
      };
      const up = () => {
        bar.removeEventListener('pointermove', move);
        bar.removeEventListener('pointerup', up);
        bar.removeEventListener('pointercancel', up);
      };
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', up);
      bar.addEventListener('pointercancel', up);
    });
  }

  // ---------- lazy resources & media ----------
  private loadLazy(node: HTMLElement) {
    const src = node.dataset.src;
    if (!src) return;
    node.removeAttribute('data-src');
    node.setAttribute('src', src);
    if (node instanceof HTMLVideoElement) {
      node.muted = true;
      this.syncMedia();
    }
  }

  private wireVideo(v: HTMLVideoElement) {
    const box = v.closest('.vid');
    const btn = box?.querySelector<HTMLButtonElement>('.vid-toggle');
    const label = () => {
      if (!btn) return;
      btn.textContent = v.paused ? '▶' : '❚❚';
      btn.setAttribute('aria-label', v.paused ? 'Play video' : 'Pause video');
    };
    label();
    v.addEventListener('play', label);
    v.addEventListener('pause', label);
    // previews are always silent, even if native controls are shown
    v.addEventListener('volumechange', () => {
      if (!v.muted) v.muted = true;
    });
    v.addEventListener('error', () => this.failVideo(v));
    btn?.addEventListener('click', () => {
      if (v.paused) {
        v.dataset.intent = 'play';
        delete v.dataset.blocked;
        if (!v.getAttribute('src') && v.dataset.src) this.loadLazy(v);
        this.syncMedia();
      } else {
        v.dataset.intent = 'pause';
        v.pause();
      }
    });
  }

  private failVideo(v: HTMLVideoElement) {
    const box = v.closest('.vid');
    v.dataset.failed = '1';
    v.hidden = true;
    box?.querySelector('.vid-toggle')?.setAttribute('hidden', '');
    box?.querySelector<HTMLElement>('.vid-fallback')?.removeAttribute('hidden');
  }

  /** Only the focused window's visible videos play; everything else is paused. */
  private syncMedia() {
    const top = this.focusedId();
    for (const w of this.wins.values()) {
      const active = w.id === top && w.state !== 'minimized' && !document.hidden;
      w.el.querySelectorAll<HTMLVideoElement>('video').forEach((v) => {
        const wants =
          active && v.dataset.intent === 'play' && v.dataset.inview === '1' &&
          !v.dataset.failed && !v.dataset.blocked && !!v.getAttribute('src');
        if (wants && v.paused) {
          v.muted = true;
          v.play().catch((err: DOMException) => {
            // unplayable source -> fallback; otherwise autoplay was blocked: keep the play button
            // and don't keep forcing it
            if (err?.name === 'NotSupportedError') this.failVideo(v);
            else v.dataset.blocked = '1';
          });
        } else if (!wants && !v.paused) {
          v.pause();
        }
      });
    }
  }
}
