import { DiscoveryError, type RepoRef, type Source } from './github.ts';
import { extractSections, renderMarkdown } from './markdown.ts';
import { renderNotebook } from './notebook.ts';
import { parseSettings, type PortfolioSettings, type RawResource } from './portfolioSettings.ts';
import type { Asset, Catalog, Project, Resource } from './projectMetadata.ts';
import {
  IMAGE_EXT, VIDEO_EXT, blobUrl, hasExt, parseHttps, repoUrl, resolveLocation, slugify,
} from './safeUrl.ts';

export interface BuildOptions {
  source: Source;
  /** persist a vendored asset; slug + repo-relative path */
  writeAsset: (slug: string, repoPath: string, data: Buffer) => void;
  /** returns true if a page may be embedded in an iframe on this site */
  checkEmbed: (url: string) => Promise<boolean>;
  includeForks?: boolean;
  includeArchived?: boolean;
  warn?: (msg: string) => void;
}

const LIMITS = { image: 5_000_000, pdf: 20_000_000, video: 40_000_000, notebook: 5_000_000 };

/** Whether a Content-Security-Policy frame-ancestors directive permits `origin` as the parent. */
export function frameAncestorsAllow(csp: string | null, origin: string): boolean {
  if (!csp) return true;
  const directive = csp
    .split(',')
    .flatMap((policy) => policy.split(';'))
    .map((d) => d.trim())
    .find((d) => d.toLowerCase().startsWith('frame-ancestors'));
  if (!directive) return true;
  const tokens = directive.split(/\s+/).slice(1).map((t) => t.toLowerCase());
  return tokens.some((t) => t === '*' || t === 'https:' || t === origin.toLowerCase());
}

/** Network check used in production builds; tests inject their own. */
export function makeEmbedChecker(origin: string) {
  return async (url: string): Promise<boolean> => {
    try {
      const opts = { redirect: 'follow' as const, signal: AbortSignal.timeout(7000) };
      let res = await fetch(url, { ...opts, method: 'HEAD' });
      if (res.status === 405 || res.status === 501) {
        res = await fetch(url, { ...opts, method: 'GET' });
        await res.body?.cancel();
      }
      if (res.status >= 400) return false;
      if (res.headers.get('x-frame-options')) return false;
      return frameAncestorsAllow(res.headers.get('content-security-policy'), origin);
    } catch {
      return false;
    }
  };
}

const DEFAULT_TITLES: Record<string, string> = {
  webpage: 'Live Demo', pdf: 'Document', notebook: 'Notebook', codespace: 'Open in Codespaces',
  repo: 'Source Code', video: 'Video',
};

export async function buildCatalog(opts: BuildOptions): Promise<Catalog> {
  const warn = opts.warn ?? (() => {});
  const repos = await opts.source.listRepos();
  const projects: Project[] = [];

  for (const repo of repos) {
    if (repo.fork && !opts.includeForks) continue;
    if (repo.archived && !opts.includeArchived) continue;
    const label = `${repo.owner}/${repo.name}`;

    const raw = await opts.source.readText(repo, 'portfolio.settings');
    if (raw === null) continue; // no settings file: ignored by default

    const parsed = parseSettings(raw);
    if (!parsed.ok) {
      if (!parsed.hidden) warn(`${label}: skipped, ${parsed.error}`);
      continue;
    }
    try {
      projects.push(await buildProject(repo, parsed.settings, opts, warn));
    } catch (e) {
      if (e instanceof DiscoveryError) throw e;
      warn(`${label}: skipped, ${(e as Error).message}`);
    }
  }

  projects.sort((a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title));
  return { generatedAt: new Date().toISOString(), source: opts.source.name, projects };
}

async function buildProject(
  repo: RepoRef,
  s: PortfolioSettings,
  opts: BuildOptions,
  warn: (m: string) => void,
): Promise<Project> {
  const slug = slugify(repo.name);
  const label = `${repo.owner}/${repo.name}`;

  /** Fetch a repo file into the site (or accept a remote https URL). */
  async function vendor(
    location: string,
    kind: 'image' | 'pdf' | 'video',
    what: string,
  ): Promise<{ asset?: Asset; openUrl?: string }> {
    const loc = resolveLocation(location);
    if (loc.kind === 'invalid') {
      warn(`${label}: ${what} "${location}" is not a valid repo path or https URL`);
      return {};
    }
    const allowed = kind === 'image' ? IMAGE_EXT : kind === 'video' ? VIDEO_EXT : ['pdf'];
    if (loc.kind === 'remote') {
      if (!hasExt(loc.url, allowed)) return { openUrl: loc.url }; // e.g. a video platform page: link only
      return { asset: { src: loc.url, local: false }, openUrl: loc.url };
    }
    if (!hasExt(loc.path, allowed)) {
      warn(`${label}: ${what} "${loc.path}" must be one of: ${allowed.join(', ')}`);
      return {};
    }
    const data = await opts.source.readBinary(repo, loc.path, LIMITS[kind]);
    if (data === null) {
      warn(`${label}: ${what} "${loc.path}" not found in repository`);
      return {};
    }
    const openUrl = blobUrl(repo, loc.path);
    if (data === 'too-large') {
      warn(`${label}: ${what} "${loc.path}" is over ${LIMITS[kind] / 1e6} MB, linking instead of embedding`);
      return { openUrl };
    }
    opts.writeAsset(slug, loc.path, data);
    return { asset: { src: `projects/${slug}/${loc.path}`, local: true }, openUrl };
  }

  // images
  const images: Project['images'] = [];
  for (const img of s.images) {
    const v = await vendor(img.src, 'image', 'image');
    if (v.asset) images.push({ ...v.asset, alt: img.alt ?? `${s.title} screenshot` });
  }

  // README
  let readmeHtml: string | undefined;
  if (s.content.readme || s.content.sections.length) {
    let md = await opts.source.readme(repo);
    if (md && s.content.sections.length) md = extractSections(md, s.content.sections);
    if (md && md.trim()) readmeHtml = renderMarkdown(md, repo);
  }

  // resources
  const resources: Resource[] = [];
  for (const r of s.resources) {
    const res = await normalizeResource(r, repo, vendor, opts, warn);
    if (res) resources.push(res);
  }

  return {
    slug,
    title: s.title,
    description: s.description,
    category: s.category,
    tags: s.tags,
    featured: s.featured,
    repo: { owner: repo.owner, name: repo.name, branch: repo.branch, url: repoUrl(repo) },
    images,
    readmeHtml,
    resources,
  };
}

type Vendor = (loc: string, kind: 'image' | 'pdf' | 'video', what: string) => Promise<{ asset?: Asset; openUrl?: string }>;

async function normalizeResource(
  r: RawResource,
  repo: RepoRef,
  vendor: Vendor,
  opts: BuildOptions,
  warn: (m: string) => void,
): Promise<Resource | null> {
  const label = `${repo.owner}/${repo.name}`;
  const title = r.title ?? DEFAULT_TITLES[r.type] ?? r.type;
  const need = () => {
    warn(`${label}: resource "${title}" (${r.type}) needs a "url"`);
    return null;
  };

  switch (r.type) {
    case 'webpage': {
      if (!r.url) return need();
      const loc = resolveLocation(r.url);
      if (loc.kind !== 'remote') {
        warn(`${label}: webpage "${title}" must be an https URL`);
        return null;
      }
      const display = r.display ?? 'embed';
      const embedBlocked = display === 'embed' ? !(await opts.checkEmbed(loc.url)) : undefined;
      if (embedBlocked) warn(`${label}: "${title}" does not allow embedding (or is unreachable); showing a link`);
      return { type: 'webpage', title, url: loc.url, display, ...(embedBlocked ? { embedBlocked: true } : {}) };
    }

    case 'pdf': {
      if (!r.url) return need();
      const v = await vendor(r.url, 'pdf', `pdf "${title}"`);
      if (!v.openUrl && !v.asset) return null;
      const display = v.asset ? (r.display ?? 'embed') : 'link';
      return { type: 'pdf', title, display, asset: v.asset, openUrl: v.openUrl ?? v.asset!.src };
    }

    case 'notebook': {
      if (!r.url) return need();
      const loc = resolveLocation(r.url);
      let nbPath: string | null = null;
      if (loc.kind === 'repo') nbPath = loc.path;
      else if (loc.kind === 'remote') {
        const m = loc.url.match(new RegExp(`^https://github\\.com/${repo.owner}/${repo.name}/blob/[^/]+/(.+)$`, 'i'));
        if (m) nbPath = decodeURIComponent(m[1]);
        else return { type: 'link', title, url: loc.url };
      } else {
        warn(`${label}: notebook "${r.url}" is not a valid path or https URL`);
        return null;
      }
      const display = r.display ?? 'preview';
      let html: string | undefined;
      if (display !== 'link') {
        const text = await opts.source.readText(repo, nbPath, LIMITS.notebook);
        if (text === null) warn(`${label}: notebook "${nbPath}" not found or too large; linking only`);
        else {
          try {
            html = renderNotebook(JSON.parse(text)) ?? undefined;
            if (!html) warn(`${label}: notebook "${nbPath}" is not a valid .ipynb; linking only`);
          } catch {
            warn(`${label}: notebook "${nbPath}" is not valid JSON; linking only`);
          }
        }
      }
      return {
        type: 'notebook', title, display, html,
        openUrl: blobUrl(repo, nbPath),
        colabUrl: `https://colab.research.google.com/github/${repo.owner}/${repo.name}/blob/${repo.branch}/${nbPath}`,
      };
    }

    case 'codespace': {
      const url = r.url ? parseHttps(r.url)?.toString() : `https://codespaces.new/${repo.owner}/${repo.name}`;
      if (!url) {
        warn(`${label}: codespace "${title}" must be an https URL`);
        return null;
      }
      return { type: 'codespace', title, url };
    }

    case 'repo': {
      if (!r.url) return { type: 'repo', title, url: repoUrl(repo) };
      const loc = resolveLocation(r.url);
      if (loc.kind === 'repo') return { type: 'repo', title, url: blobUrl(repo, loc.path) };
      if (loc.kind === 'remote' && new URL(loc.url).hostname === 'github.com') return { type: 'repo', title, url: loc.url };
      warn(`${label}: repo link "${r.url}" must be a repo path or a github.com URL`);
      return null;
    }

    case 'video': {
      if (!r.url) return need();
      const v = await vendor(r.url, 'video', `video "${title}"`);
      if (!v.asset && !v.openUrl) return null;
      const poster = r.poster ? (await vendor(r.poster, 'image', `poster for "${title}"`)).asset : undefined;
      return {
        type: 'video', title,
        display: v.asset ? (r.display ?? 'embed') : 'link',
        asset: v.asset, poster,
        openUrl: v.openUrl ?? v.asset!.src,
        autoplay: r.autoplay ?? true,
        loop: r.loop ?? true,
        controls: r.controls ?? false,
        playsInline: r.playsInline ?? true,
        // muted is intentionally not configurable: preview videos are always silent
      };
    }

    default: {
      // unknown type: graceful fallback link, or an informative omission
      if (!r.url) return need();
      const loc = resolveLocation(r.url);
      if (loc.kind === 'remote') return { type: 'link', title, url: loc.url };
      if (loc.kind === 'repo') return { type: 'link', title, url: blobUrl(repo, loc.path) };
      warn(`${label}: resource "${title}" has an unsupported type "${r.type}" and an invalid url; omitted`);
      return null;
    }
  }
}
