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
  {
    title: 'Languages',
    items: [
      'Python',
      'Java',
      'JavaScript',
      'TypeScript',
      'C++',
      'C#',
    ],
  },
  {
    title: 'Web & App Development',
    items: [
      'React',
      'Next.js',
      'Astro',
      'React Native',
      'Node.js',
      'Tailwind CSS',
      'GSAP',
    ],
  },
  {
    title: 'Machine Learning',
    items: [
      'TensorFlow',
      'PyTorch',
      'Keras'
    ],
  },
  {
    title: 'Robotics',
    items: [
      'Arduino',
      'ESP32',
      'ROS2'
    ],
  },
  {
    title: 'Tools',
    items: [
      'Unity',
      'Blender',
      'Fusion 360',
    ],
  },
];

export function skillsOutput(columns = 80): Line[] {
  const width = Math.max(...groups.map((g) => g.title.length)) + 2;
  const contentWidth = columns - width;

  return groups.flatMap((g) => {
    const items = g.items.join(' · ').split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of items) {
      const next = current ? `${current} ${word}` : word;

      if (next.length > contentWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }

    if (current) lines.push(current);

    return lines.map((line, i) => [
      {
        t: i === 0 ? g.title.padEnd(width) : ' '.repeat(width),
        cls: 'red b',
      },
      { t: line },
    ]);
  });
}
