import type { Line, Seg } from '../lib/term.ts';
import type { ProjectSummary } from '../lib/projectMetadata.ts';

/** What the commands need from the window manager (kept narrow so tests can fake it). */
export interface WindowAPI {
  open(slug: string, moveFocus?: boolean): 'opened' | 'focused' | 'restored' | 'missing';
  close(slug: string): boolean;
  minimize(slug: string): 'ok' | 'already' | 'missing' | 'unsupported';
  restore(slug: string): 'ok' | 'already' | 'missing';
  listProjects(): { id: string; state: 'normal' | 'minimized' | 'maximized'; focused: boolean }[];
}

export interface Deps {
  projects: ProjectSummary[];
  wm: WindowAPI;
  whoami: Line[];
  contact: Line[];
  skills: () => Line[];
  /** fully resolved résumé URL, or '' when none is configured */
  resumeUrl: string;
  actions: {
    clear(): void;
    scrollToAbout(): boolean;
    /** returns false if the browser blocked the new tab */
    openExternal(url: string): boolean;
  };
}

export interface Command {
  name: string;
  usage: string;
  summary: string;
  run(args: string[]): Line[];
  /** candidates for the first argument */
  complete?(partial: string): string[];
}

const ok = (t: string): Seg[] => [{ t: '[ OK ] ', cls: 'ok' }, { t }];
const fail = (t: string): Seg[] => [{ t: '[FAIL] ', cls: 'err' }, { t }];
const dim = (t: string): Seg[] => [{ t, cls: 'dim' }];

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const similar = (word: string, pool: string[]) =>
  pool.filter((p) => p.startsWith(word) || p.includes(word) || distance(word, p) <= 2).slice(0, 3);

export function createRegistry(deps: Deps) {
  const slugs = () => deps.projects.map((p) => p.slug);
  const byWindowState = (want: 'open' | 'minimized') =>
    deps.wm.listProjects().filter((w) => (want === 'minimized' ? w.state === 'minimized' : true)).map((w) => w.id);

  const openNotMinimized = () => byWindowState('open').filter((s) => !byWindowState('minimized').includes(s));

  /** exact match, else a unique prefix */
  function findProject(input: string): { project?: ProjectSummary; viaPrefix?: boolean; suggestions: string[] } {
    const q = input.toLowerCase();
    const exact = deps.projects.find((p) => p.slug === q);
    if (exact) return { project: exact, suggestions: [] };
    const prefixed = deps.projects.filter((p) => p.slug.startsWith(q));
    if (prefixed.length === 1) return { project: prefixed[0], viaPrefix: true, suggestions: [] };
    return { suggestions: prefixed.length ? prefixed.map((p) => p.slug) : similar(q, slugs()) };
  }

  const notFound = (q: string): Line[] => {
    const { suggestions } = findProject(q);
    const out: Line[] = [fail(`No project named "${q}"`)];
    if (suggestions.length)
      out.push([{ t: 'Did you mean: ', cls: 'dim' }, ...suggestions.flatMap((s, i): Seg[] => [
        ...(i ? [{ t: ', ', cls: 'dim' }] : []), { t: s, cmd: `goto ${s}` },
      ])]);
    out.push([{ t: 'Run ', cls: 'dim' }, { t: 'projects', cmd: 'projects' }, { t: ' to list what is available.', cls: 'dim' }]);
    return out;
  };

  const listProjects = (title: string, list: ProjectSummary[]): Line[] => {
    const w = Math.max(...list.map((p) => p.slug.length)) + 3;
    return [
      [{ t: title, cls: 'b' }],
      ...list.map((p): Line => [
        { t: '  ' }, { t: p.slug, cmd: `goto ${p.slug}` }, { t: ' '.repeat(w - p.slug.length) },
        { t: p.category ?? '', cls: 'dim' },
      ]),
      [{ t: 'Open one with ', cls: 'dim' }, { t: 'goto <name>', cls: 'dim b' }, { t: ' or click its name.', cls: 'dim' }],
    ];
  };

  const noProjects: Line[] = [
    'No projects found yet.',
    dim('Add a portfolio.settings file to a GitHub repository (see docs/portfolio-settings.md), then rebuild.'),
  ];

  /**
   * Shared by close / minimize / restore. `open` is every open project window (what a name may refer to);
   * `hint` is the subset that makes sense for this command (shown in usage and errors).
   */
  function needSlug(cmd: string, args: string[], open: string[], hint: string[], what: string): { slug?: string; out?: Line[] } {
    const list = hint.length ? dim(`${what}: ${hint.join(', ')}`) : dim(open.length ? `None of the open windows are ${what.toLowerCase()}.` : 'No project windows are open.');
    if (!args[0]) return { out: [fail(`Usage: ${cmd} <project>`), list] };
    const q = args[0].toLowerCase();
    const prefixed = open.filter((s) => s.startsWith(q));
    const hit = open.find((s) => s === q) ?? (prefixed.length === 1 ? prefixed[0] : undefined);
    return hit ? { slug: hit } : { out: [fail(`No open window named "${args[0]}"`), list] };
  }

  const commands: Command[] = [
    {
      name: 'help', usage: 'help', summary: 'Display available commands',
      run: () => [
        [{ t: 'Available commands', cls: 'b' }],
        ...commands.map((c): Line => [
          { t: '  ' }, { t: c.usage, cmd: c.usage.includes('<') || c.usage.includes('[') ? undefined : c.usage },
          { t: ' '.repeat(Math.max(2, 22 - c.usage.length)) }, { t: c.summary, cls: 'dim' },
        ]),
        dim('Tab completes commands and project names · ↑/↓ history · Esc closes the top window'),
      ],
    },
    { name: 'clear', usage: 'clear', summary: 'Clear terminal output', run: () => { deps.actions.clear(); return []; } },
    { name: 'whoami', usage: 'whoami', summary: 'Show developer information', run: () => deps.whoami },
    {
      name: 'about', usage: 'about', summary: 'Jump to the About Me section',
      run: () => (deps.actions.scrollToAbout() ? [ok('Scrolling to About')] : [fail('About section not found on this page')]),
    },
    {
      name: 'skills', usage: 'skills', summary: 'List skills and tools',
      run: () => deps.skills(),
    },
    {
      name: 'projects', usage: 'projects [--featured]', summary: 'List projects',
      complete: () => ['--featured'],
      run: (args) => {
        const unknown = args.find((a) => a.startsWith('-') && a !== '--featured');
        if (unknown) return [fail(`Unknown option "${unknown}"`), dim('Usage: projects [--featured]')];
        if (!deps.projects.length) return noProjects;
        if (args.includes('--featured')) {
          const f = deps.projects.filter((p) => p.featured);
          return f.length ? listProjects('FEATURED PROJECTS', f) : ['No featured projects.', dim('Run projects to see everything.')];
        }
        return listProjects(`PROJECTS (${deps.projects.length})`, deps.projects);
      },
    },
    {
      name: 'goto', usage: 'goto <project>', summary: 'Open or focus a project panel',
      complete: slugs,
      run: (args) => {
        if (!args[0]) return [fail('Usage: goto <project>'), dim('Run projects to list them.')];
        const { project, viaPrefix } = findProject(args[0]);
        if (!project) return notFound(args[0]);
        const found = ok(`Project found${viaPrefix ? `: ${project.slug}` : ''}`);
        const res = deps.wm.open(project.slug, false);
        if (res === 'opened') return [found, ok('Loading portfolio settings'), ok('Opening project panel')];
        if (res === 'restored') return [found, ok('Restoring minimized window')];
        if (res === 'focused') return [found, ok('Window already open: focusing it')];
        return [found, fail(`Could not open a panel for "${project.slug}"`)];
      },
    },
    {
      name: 'close', usage: 'close <project>', summary: 'Close a project panel',
      complete: () => byWindowState('open'),
      run: (args) => {
        const { slug, out } = needSlug('close', args, byWindowState('open'), byWindowState('open'), 'Open');
        if (!slug) return out!;
        return deps.wm.close(slug) ? [ok(`Closed ${slug}`)] : [fail(`Could not close ${slug}`)];
      },
    },
    {
      name: 'windows', usage: 'windows', summary: 'List open project windows',
      run: () => {
        const list = deps.wm.listProjects();
        if (!list.length) return ['No project windows open.', dim('Open one with goto <project>.')];
        const w = Math.max(...list.map((x) => x.id.length)) + 3;
        return [
          [{ t: 'OPEN WINDOWS', cls: 'b' }],
          ...list.map((x): Line => [
            { t: '  ' }, { t: x.id, cmd: `goto ${x.id}` }, { t: ' '.repeat(w - x.id.length) },
            { t: x.state === 'minimized' ? 'minimized' : x.focused ? 'focused' : x.state === 'maximized' ? 'maximized' : 'open', cls: 'dim' },
          ]),
        ];
      },
    },
    {
      name: 'minimize', usage: 'minimize <project>', summary: 'Minimize a project panel',
      complete: openNotMinimized,
      run: (args) => {
        const { slug, out } = needSlug('minimize', args, byWindowState('open'), openNotMinimized(), 'Open');
        if (!slug) return out!;
        const r = deps.wm.minimize(slug);
        return r === 'ok' ? [ok(`Minimized ${slug}`)] : r === 'already' ? [fail(`${slug} is already minimized`)] : [fail(`Could not minimize ${slug}`)];
      },
    },
    {
      name: 'restore', usage: 'restore <project>', summary: 'Restore a minimized panel',
      complete: () => byWindowState('minimized'),
      run: (args) => {
        const { slug, out } = needSlug('restore', args, byWindowState('open'), byWindowState('minimized'), 'Minimized');
        if (!slug) return out!;
        const r = deps.wm.restore(slug);
        return r === 'ok' ? [ok(`Restored ${slug}`)] : r === 'already' ? [fail(`${slug} is not minimized`)] : [fail(`Could not restore ${slug}`)];
      },
    },
    {
      name: 'resume', usage: 'resume', summary: 'Open the résumé',
      run: () => {
        if (!deps.resumeUrl) return [fail('No résumé configured yet.'), dim('Set site.resume in src/config/site.ts.')];
        return deps.actions.openExternal(deps.resumeUrl)
          ? [ok('Opening résumé in a new tab')]
          : [fail('The browser blocked the new tab. Open it here:'), [{ t: deps.resumeUrl, href: deps.resumeUrl }]];
      },
    },
    {
      name: 'contact', usage: 'contact', summary: 'Display contact information',
      run: () => (deps.contact.length ? deps.contact : ['No contact details configured yet.', dim('Edit contact in src/config/site.ts.')]),
    },
  ];

  const byName = new Map(commands.map((c) => [c.name, c]));
  const names = commands.map((c) => c.name);

  /** Runs one input line and returns the output lines. */
  function run(input: string): Line[] {
    const parts = input.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return [];
    const [name, ...args] = parts;
    const cmd = byName.get(name.toLowerCase());
    if (!cmd) {
      const near = similar(name.toLowerCase(), names);
      return [
        fail(`command not found: ${name}`),
        near.length
          ? [{ t: 'Did you mean: ', cls: 'dim' }, ...near.flatMap((n, i): Seg[] => [...(i ? [{ t: ', ', cls: 'dim' }] : []), { t: n, cmd: n }])]
          : [{ t: 'Type ', cls: 'dim' }, { t: 'help', cmd: 'help' }, { t: ' to see what is available.', cls: 'dim' }],
      ];
    }
    return cmd.run(args);
  }

  /** Tab completion for the command name or its first argument. */
  function complete(value: string): { value: string; candidates: string[] } {
    const lead = value.match(/^\s*/)![0];
    const rest = value.slice(lead.length);
    const space = rest.search(/\s/);
    let prefix: string;
    let partial: string;
    let pool: string[];
    if (space === -1) {
      prefix = lead;
      partial = rest;
      pool = names;
    } else {
      const cmd = byName.get(rest.slice(0, space).toLowerCase());
      const tail = rest.slice(space).trimStart();
      if (!cmd?.complete || /\s/.test(tail)) return { value, candidates: [] };
      prefix = value.slice(0, value.length - tail.length);
      partial = tail;
      pool = cmd.complete(partial);
    }
    const hits = pool.filter((p) => p.toLowerCase().startsWith(partial.toLowerCase()));
    if (!hits.length) return { value, candidates: [] };
    if (hits.length === 1) return { value: `${prefix}${hits[0]} `, candidates: [] };
    let common = hits[0];
    for (const h of hits) while (!h.toLowerCase().startsWith(common.toLowerCase())) common = common.slice(0, -1);
    return { value: `${prefix}${common}`, candidates: common.length > partial.length ? [] : hits };
  }

  return { commands, run, complete, names };
}

export type Registry = ReturnType<typeof createRegistry>;
