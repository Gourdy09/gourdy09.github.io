/** URL and path safety helpers. Repository content is untrusted. */

/** Returns the URL if it is a plain https URL without credentials, else null. */
export function parseHttps(input: string): URL | null {
  try {
    const u = new URL(input);
    if (u.protocol !== 'https:') return null;
    if (u.username || u.password) return null;
    return u;
  } catch {
    return null;
  }
}

/** True for anything that looks like a URL (scheme or protocol-relative) rather than a repo path. */
export const looksAbsolute = (s: string) => /^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith('//');

/**
 * Normalizes a repo-relative path ("./assets/a.png" -> "assets/a.png").
 * Rejects traversal, absolute paths, backslashes and control characters.
 */
export function cleanRepoPath(input: string): string | null {
  if (looksAbsolute(input) || input.includes('\\') || /[\u0000-\u001f]/.test(input)) return null;
  const parts: string[] = [];
  for (const part of input.replace(/^\.\//, '').replace(/^\/+/, '').split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') return null;
    parts.push(part);
  }
  return parts.length ? parts.join('/') : null;
}

export type Resolved =
  | { kind: 'repo'; path: string }
  | { kind: 'remote'; url: string }
  | { kind: 'invalid' };

/** Classifies a configured location as a repo path, a safe https URL, or invalid. */
export function resolveLocation(input: string): Resolved {
  const s = input.trim();
  if (looksAbsolute(s)) {
    const u = parseHttps(s);
    return u ? { kind: 'remote', url: u.toString() } : { kind: 'invalid' };
  }
  const path = cleanRepoPath(s);
  return path ? { kind: 'repo', path } : { kind: 'invalid' };
}

export const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');

const ext = (p: string) => p.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() ?? '';
export const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'];
export const VIDEO_EXT = ['mp4', 'webm'];
export const hasExt = (p: string, list: string[]) => list.includes(ext(p));

export interface RepoLinks {
  owner: string;
  name: string;
  branch: string;
}
export const repoUrl = (r: RepoLinks) => `https://github.com/${r.owner}/${r.name}`;
export const blobUrl = (r: RepoLinks, path: string) =>
  `${repoUrl(r)}/${path.endsWith('/') ? 'tree' : 'blob'}/${r.branch}/${path}`;
export const rawUrl = (r: RepoLinks, path: string) =>
  `https://raw.githubusercontent.com/${r.owner}/${r.name}/${r.branch}/${path}`;
