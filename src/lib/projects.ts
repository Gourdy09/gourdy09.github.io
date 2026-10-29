import type { Catalog, Project } from './projectMetadata.ts';

/**
 * Reads the catalog produced by `npm run sync` (scripts/sync-projects.ts).
 * Missing file => empty catalog, so the site always builds.
 */
const files = import.meta.glob<Catalog>('../generated/catalog.json', { eager: true, import: 'default' });

export function loadCatalog(): Catalog {
  return Object.values(files)[0] ?? { generatedAt: '', source: 'github', projects: [] };
}

export const loadProjects = (): Project[] => loadCatalog().projects;

/** Turns a catalog asset into a URL, respecting the site's base path. */
export function assetUrl(a: { src: string; local: boolean }): string {
  return a.local ? import.meta.env.BASE_URL.replace(/\/?$/, '/') + a.src : a.src;
}
