/** Workspace bootstrap: wires the terminal, window manager, taskbar and keyboard model together. */
import { lenis } from '../setup/lenis';
import { contact, site, whoami } from '../config/site';
import { skillsOutput } from '../config/skills';
import type { ProjectSummary } from '../lib/projectMetadata';
import { createRegistry } from './commands';
import { Terminal } from './terminal';
import { WindowManager } from './windows';

const desk = document.getElementById('desk');
const stage = document.getElementById('stage');
const taskbar = document.getElementById('taskbar');

if (desk && stage && taskbar) {
  const projects: ProjectSummary[] = JSON.parse(document.getElementById('portfolio-catalog')?.textContent || '[]');
  const wm = new WindowManager(stage, new Map(projects.map((p) => [p.slug, p.title])));

  const termEl = stage.querySelector<HTMLElement>('[data-win="terminal"]')!;
  wm.register('terminal', termEl, { title: 'terminal', closable: false });

  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const resumeUrl = site.resume ? (site.resume.startsWith('/') ? base + site.resume : site.resume) : '';

  const prompt = `${desk.dataset.user}@${desk.dataset.host}:~$`;
  let term!: Terminal;

  const registry = createRegistry({
    projects,
    wm,
    whoami,
    contact,
    skills: skillsOutput,
    resumeUrl,
    actions: {
      clear: () => term.clear(),
      scrollToAbout() {
        const el = document.getElementById('about');
        if (!el) return false;
        const topbar = document.querySelector('.topbar')?.getBoundingClientRect().height ?? 0;
        lenis.scrollTo(el.getBoundingClientRect().top + window.scrollY - (topbar + 48));
        return true;
      },
      openExternal: (url) => window.open(url, '_blank', 'noopener,noreferrer') !== null,
    },
  });
  term = new Terminal(termEl, registry, prompt);

  term.print([
    [{ t: `${site.name}'s portfolio`, cls: 'b' }],
    [
      { t: 'Type ', cls: 'dim' }, { t: 'help', cmd: 'help' }, { t: ' for commands. Try ', cls: 'dim' },
      { t: 'projects', cmd: 'projects' }, { t: ', ', cls: 'dim' }, { t: 'skills', cmd: 'skills' },
      { t: ' or ', cls: 'dim' }, { t: 'contact', cmd: 'contact' }, { t: '.', cls: 'dim' },
    ],
    '',
  ]);

  // ---- taskbar ----
  const renderTaskbar = () => {
    taskbar.replaceChildren(
      ...wm.list().map((w) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `tb-btn${w.state === 'minimized' ? ' min' : ''}`;
        b.textContent = w.id;
        b.setAttribute('aria-pressed', String(w.focused));
        b.title = w.title;
        b.addEventListener('click', () => {
          wm.activate(w.id);
          if (w.id === 'terminal') term.focus();
        });
        return b;
      }),
    );
  };
  wm.onChange(renderTaskbar);
  renderTaskbar();

  // ---- desktop icons (the non-terminal way in) ----
  desk.querySelectorAll<HTMLElement>('[data-open]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const slug = btn.dataset.open!;
      term.exec(`goto ${slug}`);
      wm.element(slug)?.focus({ preventScroll: true }); // move keyboard focus into the window
    }),
  );

  // ---- keyboard model ----
  // Esc dismisses, in order: terminal input text -> the focused project window. Never both at once.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const splash = document.getElementById('splash');
    if (splash && getComputedStyle(splash).display !== 'none') return; // the boot splash owns Esc until it is gone
    if (term.dismiss()) {
      e.preventDefault();
      return;
    }
    const top = wm.focusedId();
    const info = wm.list().find((w) => w.id === top);
    if (info?.isProject) {
      const hadFocusInside = wm.element(info.id)?.contains(document.activeElement) ?? false;
      wm.close(info.id);
      e.preventDefault();
      if (hadFocusInside || document.activeElement === document.body) term.focus();
    }
  });
}
