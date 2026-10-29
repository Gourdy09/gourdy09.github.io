import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DiscoveryError, FixtureSource, type RepoRef, type Source } from '../src/lib/github.ts';
import { buildCatalog, frameAncestorsAllow } from '../src/lib/projectRegistry.ts';

const root = path.resolve(import.meta.dirname, '../fixtures/repos');
const run = async (source: Source, checkEmbed = async () => true) => {
  const warnings: string[] = [];
  const assets: string[] = [];
  const catalog = await buildCatalog({ source, checkEmbed, warn: (m) => warnings.push(m), writeAsset: (s, p) => assets.push(`${s}/${p}`) });
  return { catalog, warnings, assets };
};

describe('buildCatalog (fixtures)', () => {
  const src = new FixtureSource(root, 'me');

  it('includes only repos whose settings are valid and show:true', async () => {
    const { catalog } = await run(src);
    const slugs = catalog.projects.map((p) => p.slug).sort();
    expect(slugs).toEqual(['demo-compact', 'demo-embed-blocked', 'demo-full']);
  });
  it('excludes hidden, invalid and settings-less repos, warning only about invalid ones', async () => {
    const { warnings } = await run(src);
    expect(warnings.some((w) => w.includes('demo-invalid'))).toBe(true);
    expect(warnings.some((w) => w.includes('demo-hidden') || w.includes('demo-no-settings'))).toBe(false);
  });
  it('sorts featured projects first', async () => {
    const { catalog } = await run(src);
    expect(catalog.projects[0].slug).toBe('demo-full');
  });
  it('vendors repo assets and rewrites them to site paths', async () => {
    const { catalog, assets } = await run(src);
    expect(assets).toContain('demo-full/assets/preview.svg');
    expect(assets).toContain('demo-full/docs/paper.pdf');
    const full = catalog.projects.find((p) => p.slug === 'demo-full')!;
    expect(full.images[0]).toMatchObject({ src: 'projects/demo-full/assets/preview.svg', local: true });
    expect(full.readmeHtml).toContain('Results');
    expect(full.readmeHtml).not.toContain('Architecture');
    expect(full.readmeHtml).not.toMatch(/<script|javascript:/i);
  });
  it('keeps a notebook preview and never includes html outputs', async () => {
    const { catalog } = await run(src);
    const nb = catalog.projects.find((p) => p.slug === 'demo-full')!.resources.find((r) => r.type === 'notebook');
    expect(nb && 'html' in nb && nb.html).toBeTruthy();
    expect(JSON.stringify(nb)).not.toMatch(/<script/i);
  });
  it('forces preview videos silent and defaults to autoplay + loop, no controls', async () => {
    const { catalog } = await run(src);
    const v = catalog.projects.find((p) => p.slug === 'demo-full')!.resources.find((r) => r.type === 'video')!;
    expect(v).toMatchObject({ autoplay: true, loop: true, controls: false, playsInline: true, display: 'embed' });
    expect(v).not.toHaveProperty('muted');
  });
  it('degrades bad resources instead of failing', async () => {
    const { catalog, warnings } = await run(src, async () => false);
    const p = catalog.projects.find((x) => x.slug === 'demo-embed-blocked')!;
    expect(p.images).toEqual([]);
    expect(p.resources.map((r) => r.type)).toEqual(['webpage', 'link']); // bad scheme + traversal dropped, unknown -> link
    expect(p.resources[0]).toMatchObject({ embedBlocked: true });
    expect(warnings.some((w) => w.includes('Traversal'))).toBe(true);
  });
  it('a compact project has no optional content', async () => {
    const { catalog } = await run(src);
    const c = catalog.projects.find((p) => p.slug === 'demo-compact')!;
    expect(c).toMatchObject({ images: [], resources: [], readmeHtml: undefined, tags: [] });
  });
});

describe('discovery rules', () => {
  const make = (repos: RepoRef[], files: Record<string, string>, fail = false): Source => ({
    name: 'fixtures',
    listRepos: async () => repos,
    readText: async (r, p) => {
      if (fail) throw new DiscoveryError('boom');
      return files[`${r.name}/${p}`] ?? null;
    },
    readBinary: async () => null,
    readme: async () => null,
  });
  const ok = JSON.stringify({ version: 1, show: true, title: 'T', description: 'D' });
  const repo = (name: string, extra: Partial<RepoRef> = {}): RepoRef => ({ owner: 'me', name, branch: 'main', fork: false, archived: false, ...extra });

  it('skips forks and archived repos by default, includes them when configured', async () => {
    const s = make([repo('a'), repo('f', { fork: true }), repo('z', { archived: true })], { 'a/portfolio.settings': ok, 'f/portfolio.settings': ok, 'z/portfolio.settings': ok });
    const base = { source: s, checkEmbed: async () => true, writeAsset: () => {} };
    expect((await buildCatalog(base)).projects.map((p) => p.slug)).toEqual(['a']);
    expect((await buildCatalog({ ...base, includeForks: true, includeArchived: true })).projects).toHaveLength(3);
  });
  it('propagates discovery failures instead of silently producing an empty catalog', async () => {
    const s = make([repo('a')], {}, true);
    await expect(buildCatalog({ source: s, checkEmbed: async () => true, writeAsset: () => {} })).rejects.toBeInstanceOf(DiscoveryError);
  });
});

describe('frameAncestorsAllow', () => {
  const origin = 'https://me.github.io';
  it('allows when absent, wildcard, https: or the exact origin', () => {
    expect(frameAncestorsAllow(null, origin)).toBe(true);
    expect(frameAncestorsAllow("default-src 'self'", origin)).toBe(true);
    expect(frameAncestorsAllow('frame-ancestors *', origin)).toBe(true);
    expect(frameAncestorsAllow(`frame-ancestors 'self' ${origin}`, origin)).toBe(true);
  });
  it('blocks none/self/other origins', () => {
    expect(frameAncestorsAllow("frame-ancestors 'none'", origin)).toBe(false);
    expect(frameAncestorsAllow("frame-ancestors 'self'", origin)).toBe(false);
    expect(frameAncestorsAllow('frame-ancestors https://other.dev', origin)).toBe(false);
  });
});
