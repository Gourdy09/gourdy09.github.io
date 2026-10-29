import sanitizeHtml from 'sanitize-html';
import { Marked } from 'marked';

/**
 * Renders a saved .ipynb to safe, static HTML. Nothing is ever executed.
 * Supports markdown cells, code cells, text/stream/error outputs and embedded png/jpeg outputs.
 */

const md = new Marked({ gfm: true });
md.use({ renderer: { html: () => '' } });

const MAX_CELLS = 80;
const MAX_TEXT = 4000;
const MAX_IMAGE_B64 = 1_500_000;
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const join = (v: unknown): string => (Array.isArray(v) ? v.join('') : typeof v === 'string' ? v : '');

function clip(s: string): string {
  const clean = s.replace(ANSI, '');
  return clean.length > MAX_TEXT ? clean.slice(0, MAX_TEXT) + '\n… (output truncated)' : clean;
}

function renderOutput(o: any): string {
  if (!o || typeof o !== 'object') return '';
  if (o.output_type === 'stream') return `<pre class="nb-out">${esc(clip(join(o.text)))}</pre>`;
  if (o.output_type === 'error') {
    const msg = `${o.ename ?? 'Error'}: ${o.evalue ?? ''}`;
    return `<pre class="nb-out nb-err">${esc(clip(msg))}</pre>`;
  }
  if (o.output_type === 'execute_result' || o.output_type === 'display_data') {
    const data = o.data ?? {};
    for (const mime of ['image/png', 'image/jpeg']) {
      const b64 = join(data[mime]).replace(/\s/g, '');
      if (b64 && b64.length <= MAX_IMAGE_B64 && /^[A-Za-z0-9+/=]+$/.test(b64)) {
        return `<img class="nb-img" alt="Notebook output" loading="lazy" src="data:${mime};base64,${b64}">`;
      }
    }
    const plain = join(data['text/plain']);
    if (plain) return `<pre class="nb-out">${esc(clip(plain))}</pre>`;
  }
  return '';
}

export function renderNotebook(input: unknown): string | null {
  const nb = input as any;
  if (!nb || !Array.isArray(nb.cells)) return null;
  const out: string[] = [];
  for (const cell of nb.cells.slice(0, MAX_CELLS)) {
    const src = join(cell?.source);
    if (cell?.cell_type === 'markdown') {
      const html = sanitizeHtml(md.parse(src, { async: false }) as string, {
        allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'em', 'strong', 'del', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
        allowedAttributes: {},
        transformTags: { h1: 'h4', h2: 'h4', h3: 'h5', h4: 'h5', h5: 'h6' },
      });
      out.push(`<div class="nb-cell nb-md">${html}</div>`);
    } else if (cell?.cell_type === 'code') {
      const outputs = (Array.isArray(cell.outputs) ? cell.outputs : []).map(renderOutput).join('');
      out.push(
        `<div class="nb-cell nb-code"><pre class="nb-src"><code>${esc(src)}</code></pre>${outputs}</div>`,
      );
    }
  }
  if (nb.cells.length > MAX_CELLS) out.push(`<p class="nb-more">… ${nb.cells.length - MAX_CELLS} more cells not shown</p>`);
  return out.join('\n');
}
