import { describe, expect, it } from 'vitest';
import { extractSections, renderMarkdown } from '../src/lib/markdown.ts';
import { renderNotebook } from '../src/lib/notebook.ts';

const repo = { owner: 'me', name: 'proj', branch: 'main' };

describe('renderMarkdown', () => {
  it('strips scripts, raw html, event handlers and unsafe schemes', () => {
    const html = renderMarkdown(
      '<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1)) [y](data:text/html,hi) ![z](http://insecure/a.png)\n\n**ok**',
      repo,
    );
    expect(html).not.toMatch(/<script|onerror|javascript:|data:text|http:\/\//i);
    expect(html).toContain('<strong>ok</strong>');
  });
  it('resolves relative links and images against the repo', () => {
    const html = renderMarkdown('![a](assets/a.png) [b](docs/b.md) [c](#frag)', repo);
    expect(html).toContain('https://raw.githubusercontent.com/me/proj/main/assets/a.png');
    expect(html).toContain('https://github.com/me/proj/blob/main/docs/b.md');
    expect(html).not.toContain('href="#frag"');
  });
  it('rejects traversal in relative paths', () => {
    expect(renderMarkdown('![a](../../secret.png)', repo)).not.toContain('<img');
  });
  it('demotes headings', () => {
    expect(renderMarkdown('# Title', repo)).toContain('<h3');
  });
});

describe('extractSections', () => {
  const md = '# T\n\nintro\n\n## Overview\n\nA\n\n### Sub\n\nB\n\n## Other\n\nC\n\n## Results\n\nD\n';
  it('keeps requested sections including subsections, skips missing ones', () => {
    const out = extractSections(md, ['overview', 'Results', 'Missing']);
    expect(out).toContain('Overview');
    expect(out).toContain('Sub');
    expect(out).toContain('Results');
    expect(out).not.toContain('Other');
    expect(out).not.toContain('intro');
  });
  it('returns nothing when no section matches', () => {
    expect(extractSections(md, ['Nope']).trim()).toBe('');
  });
});

describe('renderNotebook', () => {
  const nb = (cells: unknown[]) => ({ cells });
  it('renders markdown, code, stream output and png output', () => {
    const html = renderNotebook(nb([
      { cell_type: 'markdown', source: ['# Hi'] },
      { cell_type: 'code', source: ['print(1)'], outputs: [{ output_type: 'stream', text: ['1\n'] }, { output_type: 'display_data', data: { 'image/png': 'iVBORw0KGgo=' } }] },
    ]))!;
    expect(html).toContain('print(1)');
    expect(html).toContain('data:image/png;base64,iVBORw0KGgo=');
  });
  it('never emits html outputs, scripts or malformed images', () => {
    const html = renderNotebook(nb([
      { cell_type: 'markdown', source: '<script>alert(1)</script> text' },
      { cell_type: 'code', source: '<b>x</b>', outputs: [
        { output_type: 'display_data', data: { 'text/html': '<script>alert(2)</script>', 'text/plain': 'plain' } },
        { output_type: 'display_data', data: { 'image/png': '"><script>alert(3)</script>' } },
      ] },
    ]))!;
    expect(html).not.toMatch(/<script|alert\(/i);
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
  it('returns null for non-notebooks', () => {
    expect(renderNotebook({})).toBeNull();
    expect(renderNotebook(null)).toBeNull();
  });
});
