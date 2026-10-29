import { Marked, type Token, type Tokens } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { blobUrl, cleanRepoPath, looksAbsolute, parseHttps, rawUrl, type RepoLinks } from './safeUrl.ts';

/** Markdown parser with raw HTML disabled. */
const md = new Marked({ gfm: true, breaks: false });
md.use({ renderer: { html: () => '' } });

/**
 * Keeps only the requested headings (and their content).
 * Missing headings are skipped. Matching is case-insensitive.
 */
export function extractSections(source: string, wanted: string[]): string {
  const want = new Set(wanted.map((w) => w.trim().toLowerCase()));
  const tokens = md.lexer(source);
  const keep: Token[] = [];
  let depth: number | null = null;
  for (const tok of tokens) {
    if (tok.type === 'heading') {
      const h = tok as Tokens.Heading;
      if (depth !== null && h.depth <= depth) depth = null;
      if (depth === null && want.has(h.text.trim().toLowerCase())) depth = h.depth;
    }
    if (depth !== null) keep.push(tok);
  }
  return keep.map((t) => t.raw).join('');
}

/**
 * Renders markdown to sanitized HTML. Relative image paths point at the repo's raw files,
 * relative links at its GitHub pages. Scripts, raw HTML and non-https URLs never survive.
 */
export function renderMarkdown(source: string, repo: RepoLinks): string {
  const html = md.parse(source, { async: false }) as string;

  const resolve = (value: string | undefined, as: 'img' | 'link'): string | undefined => {
    if (!value) return undefined;
    if (value.startsWith('#')) return undefined;
    if (looksAbsolute(value)) {
      if (as === 'link' && /^mailto:/i.test(value)) return value;
      return parseHttps(value)?.toString();
    }
    const path = cleanRepoPath(value.split('#')[0].split('?')[0]);
    if (!path) return undefined;
    return as === 'img' ? rawUrl(repo, path) : blobUrl(repo, path);
  };

  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'em', 'strong', 'del', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'input',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      img: ['src', 'alt', 'title', 'loading'],
      th: ['align'],
      td: ['align'],
      input: ['type', 'checked', 'disabled'],
    },
    allowedSchemes: ['https', 'mailto'],
    allowProtocolRelative: false,
    // headings are demoted so panel markup keeps a sane outline
    transformTags: {
      h1: 'h3', h2: 'h3', h3: 'h4', h4: 'h5', h5: 'h6',
      a: (tag, attribs) => {
        const href = resolve(attribs.href, 'link');
        const out: Record<string, string> = {};
        if (attribs.title) out.title = attribs.title;
        if (href) Object.assign(out, { href, rel: 'noopener noreferrer', target: '_blank' });
        return { tagName: 'a', attribs: out };
      },
      img: (tag, attribs) => {
        const src = resolve(attribs.src, 'img');
        const out: Record<string, string> = { alt: attribs.alt ?? '', loading: 'lazy' };
        if (attribs.title) out.title = attribs.title;
        if (src) out.src = src;
        return { tagName: 'img', attribs: out };
      },
      input: (tag, attribs) => ({
        tagName: 'input',
        attribs: { type: 'checkbox', disabled: 'disabled', ...(attribs.checked !== undefined ? { checked: 'checked' } : {}) },
      }),
    },
    exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
  });
}
