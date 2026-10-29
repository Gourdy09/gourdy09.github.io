import { z } from 'astro/zod';

const text = (max: number) => z.string().trim().min(1).max(max);

const resource = z.object({
  type: z.string().trim().toLowerCase().min(1).max(32),
  title: text(80).optional(),
  /** repo-relative path or absolute https URL (optional for `repo` and `codespace`) */
  url: text(2048).optional(),
  display: z.enum(['embed', 'link', 'preview']).optional(),
  // video options
  autoplay: z.boolean().optional(),
  loop: z.boolean().optional(),
  /** accepted but ignored: preview videos are always muted */
  muted: z.boolean().optional(),
  controls: z.boolean().optional(),
  playsInline: z.boolean().optional(),
  poster: text(2048).optional(),
});

export const settingsSchema = z.object({
  version: z.literal(1),
  show: z.boolean(),
  title: text(80),
  description: text(400),
  category: text(40).optional(),
  tags: z.array(text(30)).max(20).default([]),
  featured: z.boolean().default(false),
  images: z
    .array(z.object({ src: text(2048), alt: text(200).optional() }))
    .max(12)
    .default([]),
  content: z
    .object({
      readme: z.boolean().default(false),
      sections: z.array(text(80)).max(20).default([]),
    })
    .default({ readme: false, sections: [] }),
  resources: z.array(resource).max(12).default([]),
});

export type PortfolioSettings = z.infer<typeof settingsSchema>;
export type RawResource = z.infer<typeof resource>;

export type ParseResult =
  | { ok: true; settings: PortfolioSettings }
  | { ok: false; hidden: boolean; error: string };

/**
 * Parses the text of a portfolio.settings file.
 * `hidden: true` means the file is valid JSON with show !== true, which is
 * silently skipped rather than reported as an error.
 */
export function parseSettings(source: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(source);
  } catch (e) {
    return { ok: false, hidden: false, error: `invalid JSON (${(e as Error).message})` };
  }
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { ok: false, hidden: false, error: 'settings must be a JSON object' };
  }
  if ((json as { show?: unknown }).show !== true) {
    return { ok: false, hidden: true, error: 'show is not true' };
  }
  const parsed = settingsSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .slice(0, 4)
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    return { ok: false, hidden: false, error: msg };
  }
  return { ok: true, settings: parsed.data };
}
