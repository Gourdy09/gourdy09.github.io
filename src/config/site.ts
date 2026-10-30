import type { Line } from '../lib/term.ts';

/** Site-wide settings */
export const site = {
  name: 'Om Patel',
  tagline: 'doing cool machine learning shit.',

  /** shown in the terminal prompt: user@host:~$ */
  user: 'ompatel',
  host: 'portfolio',

  github: {
    /** repositories owned by this account are scanned for a portfolio.settings file */
    username: 'Gourdy09',
    includeForks: false,
    includeArchived: false,
  },

  /**
   * Origin this site is served from. Used to check whether a project's demo
   * site allows being embedded here (frame-ancestors)
   */
  origin: 'https://gourdy09.github.io',

  /** Resume: a URL, or a path to a file in /public */
  resume: '/resume.pdf',
};

/** Output of the `whoami` command. */
export const whoami: Line[] = [
  [{ t: site.name, cls: 'b' }, { t: `  (${site.user})`, cls: 'dim' }],
  site.tagline,
  [{ t: 'college:  ', cls: 'dim' }, { t: `Carnegie Mellon University`, href: `https://www.cmu.edu/` }],
  [{ t: '  - degree:  ', cls: 'dim' }, { t: `BS Artificial Intelligence + Robotics (2030)`}],
  [{ t: '  - clubs:  ', cls: 'dim' }, { t: `Roboclub, CMIMC, ACM@CMU`}],
  [{ t: 'currently at:  ', cls: 'dim' }, { t: `Lavoro AI`, href: `https://lavoro.bot/` }],
];

/** Output of the `contact` command */
export const contact: Line[] = [
  [{ t: 'github    ', cls: 'dim' }, { t: `github.com/${site.github.username}`, href: `https://github.com/${site.github.username}` }],
  [{ t: 'email     ', cls: 'dim' }, { t: 'patel.omtx@gmail.com', href: 'mailto:patel.omtx@gmail.com' }],
  [{ t: 'linkedin  ', cls: 'dim' }, { t: 'linkedin.com/in/om-patel', href: 'https://linkedin.com/in/om-patel09' }],
  [{ t: 'instagram  ', cls: 'dim' }, { t: '@not.ompatel', href: 'https://instagram.com/not.ompatel' }],
];
