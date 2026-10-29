import type { Line, Seg } from '../lib/term.ts';
import type { Registry } from './commands.ts';

/** Only these href shapes are ever rendered as links. */
const safeHref = (h: string) => /^(https:\/\/|mailto:)/i.test(h) || (h.startsWith('/') && !h.startsWith('//'));

export class Terminal {
  readonly input: HTMLInputElement;
  private out: HTMLElement;
  private body: HTMLElement;
  private prompt: string;
  private history: string[] = [];
  private cursor = 0;
  private draft = '';
  private registry: Registry;
  private candidatesShown = false;

  constructor(root: HTMLElement, registry: Registry, prompt: string) {
    this.registry = registry;
    this.prompt = prompt;
    this.input = root.querySelector<HTMLInputElement>('#term-in')!;
    this.out = root.querySelector<HTMLElement>('#term-out')!;
    this.body = root.querySelector<HTMLElement>('#term-body')!;

    this.input.addEventListener('keydown', (e) => this.onKey(e));
    this.body.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const cmd = t.closest<HTMLElement>('[data-cmd]')?.dataset.cmd;
      if (cmd) {
        this.exec(cmd);
        return;
      }
      if (t.closest('a, button') || getSelection()?.toString()) return;
      this.focus();
    });
  }

  focus() {
    this.input.focus({ preventScroll: true });
  }

  clear() {
    this.out.replaceChildren();
  }

  print(lines: Line[]) {
    for (const line of lines) this.out.append(this.render(line));
    this.body.scrollTop = this.body.scrollHeight;
  }

  /** Runs a command exactly as if it had been typed. */
  exec(raw: string) {
    const value = raw.trim();
    this.print([[{ t: `${this.prompt} `, cls: 'red b' }, { t: value }]]);
    this.candidatesShown = false;
    if (!value) return;
    if (this.history[this.history.length - 1] !== value) this.history.push(value);
    this.cursor = this.history.length;
    this.draft = '';
    try {
      this.print(this.registry.run(value));
    } catch (e) {
      console.error(e);
      this.print([[{ t: '[FAIL] ', cls: 'err' }, { t: 'That command failed unexpectedly.' }]]);
    }
  }

  /** Esc support: returns true if there was something to dismiss. */
  dismiss(): boolean {
    if (document.activeElement !== this.input) return false;
    if (this.input.value) {
      this.input.value = '';
      return true;
    }
    return false;
  }

  private onKey(e: KeyboardEvent) {
    const input = this.input;
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = input.value;
      input.value = '';
      this.exec(v);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (!this.history.length) return;
      e.preventDefault();
      if (this.cursor === this.history.length) this.draft = input.value;
      this.cursor = Math.max(0, Math.min(this.history.length, this.cursor + (e.key === 'ArrowUp' ? -1 : 1)));
      input.value = this.cursor === this.history.length ? this.draft : this.history[this.cursor];
      requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
    } else if (e.key === 'Tab' && !e.shiftKey && input.value.trim()) {
      // with an empty line Tab keeps its normal meaning, so keyboard users can leave the terminal
      e.preventDefault();
      const { value, candidates } = this.registry.complete(input.value);
      input.value = value;
      if (candidates.length) {
        this.print([[{ t: `${this.prompt} `, cls: 'red b' }, { t: value }]]);
        this.print([candidates.flatMap((c, i): Seg[] => [...(i ? [{ t: '  ' }] : []), { t: c }])]);
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      this.clear();
    }
  }

  private render(line: Line): HTMLElement {
    const el = document.createElement('div');
    el.className = 'line';
    const segs: Seg[] = typeof line === 'string' ? [{ t: line }] : line;
    for (const s of segs) {
      let node: HTMLElement;
      if (s.cmd) {
        node = document.createElement('button');
        (node as HTMLButtonElement).type = 'button';
        node.className = 'cmd';
        node.dataset.cmd = s.cmd;
      } else if (s.href && safeHref(s.href)) {
        const a = document.createElement('a');
        a.href = s.href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        node = a;
      } else node = document.createElement('span');
      node.textContent = s.t;
      if (s.cls) node.classList.add(...s.cls.split(/\s+/).filter(Boolean));
      el.append(node);
    }
    return el;
  }
}
