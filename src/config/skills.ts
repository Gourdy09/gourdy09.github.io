import type { Line } from '../lib/term.ts';

/**
 * Output of the `skills` command. EDIT THIS FILE to change what it prints.
 *
 * The values below are PLACEHOLDERS: replace them with your real skills.
 *
 * Simplest change: edit the groups. For full control, rewrite
 * skillsOutput() and return whatever lines you like. A line is either a
 * string or a list of segments: { t: 'text', cls: 'red b', href?: url, cmd?: 'command' }
 * (classes: red, dim, b, ok, err).
 */
const groups: { title: string; items: string[] }[] = [
  { title: 'Languages', items: ['TypeScript', 'JavaScript', 'Python'] },
  { title: 'Web', items: ['Astro', 'HTML / CSS', 'GSAP'] },
  { title: 'Tools', items: ['Git', 'GitHub Actions', 'Linux'] },
];

export function skillsOutput(): Line[] {
  const width = Math.max(...groups.map((g) => g.title.length)) + 2;
  return groups.map((g) => [
    { t: g.title.padEnd(width), cls: 'red b' },
    { t: g.items.join(' · ') },
  ]);
}
