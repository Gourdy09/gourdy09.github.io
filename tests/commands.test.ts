import { describe, expect, it } from 'vitest';
import type { Line } from '../src/lib/term.ts';
import type { ProjectSummary } from '../src/lib/projectMetadata.ts';
import { createRegistry, type Deps } from '../src/workspace/commands.ts';

const text = (lines: Line[]) => lines.map((l) => (typeof l === 'string' ? l : l.map((s) => s.t).join(''))).join('\n');
const P = (slug: string, featured = false, category = 'Cat'): ProjectSummary => ({ slug, title: slug, description: '', category, featured, compact: false });

function setup(projects: ProjectSummary[], resumeUrl = '') {
  const wins = new Map<string, 'normal' | 'minimized'>();
  const calls: string[] = [];
  const deps: Deps = {
    projects,
    wm: {
      open: (s) => { if (wins.has(s)) { const was = wins.get(s); wins.set(s, 'normal'); return was === 'minimized' ? 'restored' : 'focused'; } wins.set(s, 'normal'); return 'opened'; },
      close: (s) => wins.delete(s),
      minimize: (s) => (!wins.has(s) ? 'missing' : wins.get(s) === 'minimized' ? 'already' : (wins.set(s, 'minimized'), 'ok')),
      restore: (s) => (!wins.has(s) ? 'missing' : wins.get(s) !== 'minimized' ? 'already' : (wins.set(s, 'normal'), 'ok')),
      listProjects: () => [...wins].map(([id, state]) => ({ id, state, focused: false })),
    },
    whoami: ['me'], contact: [], skills: () => ['SKILLS-OUTPUT'], resumeUrl,
    actions: { clear: () => calls.push('clear'), scrollToAbout: () => true, openExternal: () => false },
  };
  const reg = createRegistry(deps);
  return { ...reg, wins, calls, out: (s: string) => text(reg.run(s)) };
}

describe('commands', () => {
  const projects = [P('drone-tracker', true, 'Robotics'), P('thrive'), P('jstatslib', true)];

  it('lists projects and the featured subset from the catalog', () => {
    const t = setup(projects);
    expect(t.out('projects')).toContain('thrive');
    const f = t.out('projects --featured');
    expect(f).toContain('drone-tracker');
    expect(f).not.toContain('thrive');
  });
  it('says so when the catalog is empty and never lists phantom projects', () => {
    const t = setup([]);
    expect(t.out('projects')).toContain('No projects found');
    expect(t.out('goto anything')).toContain('[FAIL]');
  });
  it('goto prints success only when the window actually opens', () => {
    const t = setup(projects);
    expect(t.out('goto drone-tracker')).toContain('Opening project panel');
    expect(t.out('goto drone-tracker')).toContain('already open');
    const miss = t.out('goto drone-trakcer');
    expect(miss).toContain('[FAIL]');
    expect(miss).not.toContain('[ OK ]');
    expect(miss).toContain('drone-tracker'); // suggestion
  });
  it('goto resolves a unique prefix but not an ambiguous one', () => {
    const t = setup([P('alpha'), P('alpine'), P('beta')]);
    expect(t.out('goto bet')).toContain('Project found: beta');
    expect(t.out('goto al')).toContain('[FAIL]');
  });
  it('minimize / restore / close / windows reflect real state', () => {
    const t = setup(projects);
    t.run('goto thrive');
    expect(t.out('restore thrive')).toContain('is not minimized');
    expect(t.out('minimize thrive')).toContain('Minimized thrive');
    expect(t.out('minimize thrive')).toContain('already minimized');
    expect(t.out('windows')).toContain('minimized');
    expect(t.out('restore thrive')).toContain('Restored thrive');
    expect(t.out('close thrive')).toContain('Closed thrive');
    expect(t.out('close thrive')).toContain('[FAIL]');
    expect(t.out('windows')).toContain('No project windows open');
  });
  it('skills prints the configured output', () => {
    expect(setup(projects).out('skills')).toBe('SKILLS-OUTPUT');
  });
  it('resume is honest when unset and when the tab is blocked', () => {
    expect(setup(projects, '').out('resume')).toContain('No résumé configured');
    const blocked = setup(projects, 'https://x.dev/cv.pdf').out('resume');
    expect(blocked).toContain('blocked');
    expect(blocked).toContain('https://x.dev/cv.pdf');
  });
  it('clear delegates to the terminal; unknown commands suggest alternatives', () => {
    const t = setup(projects);
    t.run('clear');
    expect(t.calls).toContain('clear');
    const u = t.out('projcts');
    expect(u).toContain('command not found');
    expect(u).toContain('projects');
  });
  it('has every command required by the spec', () => {
    const names = setup(projects).names;
    for (const n of ['help', 'clear', 'whoami', 'about', 'projects', 'goto', 'close', 'windows', 'minimize', 'restore', 'resume', 'contact', 'skills'])
      expect(names).toContain(n);
  });
});

describe('autocomplete', () => {
  const t = setup([P('drone-tracker'), P('drone-lab'), P('thrive')]);
  it('completes command names', () => {
    expect(t.complete('pro')).toEqual({ value: 'projects ', candidates: [] });
  });
  it('completes unique project names', () => {
    expect(t.complete('goto th').value).toBe('goto thrive ');
  });
  it('extends to the common prefix, then lists candidates', () => {
    expect(t.complete('goto d').value).toBe('goto drone-');
    expect(t.complete('goto drone-').candidates.sort()).toEqual(['drone-lab', 'drone-tracker']);
  });
  it('only offers open windows for close', () => {
    expect(t.complete('close ').candidates).toEqual([]);
  });
});
