import { describe, expect, it } from 'vitest';
import { parseSettings } from '../src/lib/portfolioSettings.ts';
import { cleanRepoPath, parseHttps, resolveLocation } from '../src/lib/safeUrl.ts';

const base = { version: 1, show: true, title: 'T', description: 'D' };

describe('parseSettings', () => {
  it('applies defaults to a minimal file', () => {
    const r = parseSettings(JSON.stringify(base));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.settings.tags).toEqual([]);
      expect(r.settings.featured).toBe(false);
      expect(r.settings.content).toEqual({ readme: false, sections: [] });
      expect(r.settings.resources).toEqual([]);
    }
  });
  it('treats show:false as hidden, not as an error', () => {
    const r = parseSettings(JSON.stringify({ ...base, show: false, title: 123 }));
    expect(r).toMatchObject({ ok: false, hidden: true });
  });
  it('treats a missing show as hidden', () => {
    expect(parseSettings('{"version":1,"title":"x","description":"y"}')).toMatchObject({ ok: false, hidden: true });
  });
  it('reports invalid JSON and bad fields without throwing', () => {
    expect(parseSettings('{ nope')).toMatchObject({ ok: false, hidden: false });
    expect(parseSettings('[]')).toMatchObject({ ok: false, hidden: false });
    const r = parseSettings(JSON.stringify({ ...base, version: 2 }));
    expect(r).toMatchObject({ ok: false, hidden: false });
    expect(parseSettings(JSON.stringify({ ...base, title: '' }))).toMatchObject({ ok: false });
    expect(parseSettings(JSON.stringify({ ...base, resources: [{ type: 'pdf', url: 'x'.repeat(3000) }] }))).toMatchObject({ ok: false });
  });
});

describe('url safety', () => {
  it('accepts only plain https', () => {
    expect(parseHttps('https://example.com/a')).not.toBeNull();
    for (const bad of ['javascript:alert(1)', 'http://example.com', 'data:text/html,hi', 'ftp://x.y', 'https://u:p@example.com', '//evil.com'])
      expect(parseHttps(bad)).toBeNull();
  });
  it('cleans repo paths and rejects traversal', () => {
    expect(cleanRepoPath('./assets/a.png')).toBe('assets/a.png');
    expect(cleanRepoPath('/docs//paper.pdf')).toBe('docs/paper.pdf');
    for (const bad of ['../x.png', 'a/../../x', 'a\\b', 'file:///etc/passwd', '//evil.com/x.png', '']) expect(cleanRepoPath(bad)).toBeNull();
  });
  it('classifies locations', () => {
    expect(resolveLocation('assets/a.png')).toEqual({ kind: 'repo', path: 'assets/a.png' });
    expect(resolveLocation('https://x.dev/a.mp4').kind).toBe('remote');
    expect(resolveLocation('javascript:alert(1)').kind).toBe('invalid');
    expect(resolveLocation('http://x.dev/a.mp4').kind).toBe('invalid');
  });
});
