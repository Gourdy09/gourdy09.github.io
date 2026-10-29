# `portfolio.settings`

Every project on the site is described by a file named exactly `portfolio.settings` at the **root of a GitHub repository** owned by the account in `src/config/site.ts` (`site.github.username`). The file is JSON (no `.json` extension needed).

- No file → the repo is ignored.
- `"show": false` → ignored everywhere (listings, autocomplete, `goto`).
- Invalid file → that repo is skipped with a warning in the build log; the rest of the site is unaffected.
- Forks and archived repos are skipped unless enabled in `site.github`.

## Minimal file

```json
{
  "version": 1,
  "show": true,
  "title": "Drone Tracker",
  "description": "A computer vision system for tracking drones with an actively controlled camera."
}
```

This produces a compact panel: title, description and a repository link. Nothing else is rendered.

## All fields

| Field | Required | Notes |
|---|---|---|
| `version` | yes | Must be `1`. |
| `show` | yes | `true` to publish. |
| `title` | yes | ≤ 80 chars. |
| `description` | yes | ≤ 400 chars. |
| `category` | no | Shown in the project list, e.g. `Robotics`. |
| `tags` | no | Up to 20 short labels. |
| `featured` | no | Included in `projects --featured`, sorted first. |
| `images` | no | `[{ "src": "assets/a.png", "alt": "…" }]`. `src` is a repo path or an https URL. png, jpg, gif, webp, svg, avif; ≤ 5 MB. |
| `content.readme` | no | `true` shows the repo README. |
| `content.sections` | no | README headings to show (case-insensitive, subsections included). Missing headings are skipped. Setting this implies `readme`. |
| `resources` | no | See below. Up to 12. |

The project's **slug** (used by `goto`) is the repository name, lowercased.

## Resources

Every resource has `type`, optional `title`, and usually `url` (a repo-relative path, or an **https** URL). Optional `display`: `embed`, `preview` or `link`.

| `type` | What it does |
|---|---|
| `webpage` | `embed` shows an iframe **only if** the site permits it (checked at build time via `X-Frame-Options` / CSP `frame-ancestors`); otherwise a link. Always sandboxed. |
| `notebook` | A `.ipynb` in the repo, rendered as a **static preview** (markdown, code, saved text/image outputs). Nothing is executed. Includes a Google Colab link to run it. |
| `pdf` | Repo PDF (≤ 20 MB) embedded with a viewer, or an https URL. Some mobile browsers can't show PDFs inline; the “open” link is always there. |
| `video` | `.mp4` / `.webm` from the repo (≤ 40 MB) or a direct https URL. Autoplays, loops, **always muted**, no controls by default, inline on mobile, loaded lazily, paused when minimized/closed/offscreen. Options: `autoplay`, `loop`, `controls`, `playsInline`, `poster`. `muted` is ignored: previews are always silent. Platform links (YouTube etc.) are shown as links. |
| `codespace` | Link to GitHub Codespaces (never embedded). `url` optional; defaults to `https://codespaces.new/OWNER/REPO`. |
| `repo` | A link to the repo, or to a file/directory (`"url": "src/"`). |
| anything else | Shown as a plain link if it has a valid URL, otherwise omitted with a warning. |

Files from the repo (images, PDFs, videos) are **copied into the site at build time**, so they are served from your domain and not hotlinked from GitHub. Larger files are linked instead of embedded.

## Security model

Repositories are treated as untrusted. Only `https:` URLs are accepted; `javascript:`/`data:`/`http:` and path traversal (`../`) are rejected. README and notebook content is sanitized (raw HTML, scripts and event handlers are removed). Notebook outputs of type `text/html` are never rendered. Iframes are sandboxed. No repository code is ever executed, and the GitHub token is only used in the build script.

## Adding a new project

1. Add `portfolio.settings` to the repo root and push.
2. Wait for the next scheduled rebuild (every 6 hours), or trigger one: **Actions → Deploy to GitHub Pages → Run workflow**.
3. It appears in `projects`, autocomplete and `goto` automatically. No code changes.

Optional instant rebuilds: in the project repo add this workflow and a secret `PORTFOLIO_DISPATCH_TOKEN` (a fine-grained PAT with *Actions: write* / *Contents: read* on the portfolio repo):

```yaml
# .github/workflows/notify-portfolio.yml
on:
  push:
    branches: [main]
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - run: >
          curl -fsS -X POST
          -H "Authorization: Bearer ${{ secrets.PORTFOLIO_DISPATCH_TOKEN }}"
          -H "Accept: application/vnd.github+json"
          https://api.github.com/repos/Gourdy09/gourdy09.github.io/dispatches
          -d '{"event_type":"portfolio-update"}'
```

## Local development

| Command | Does |
|---|---|
| `npm run dev` | Discovers from GitHub, then starts the dev server. |
| `npm run dev:fixtures` | Uses `fixtures/repos/*` as fake repositories. No network or GitHub needed. |
| `npm run build` / `build:fixtures` | Same, as production builds. |
| `npm test` | Unit tests (schema, sanitizers, discovery rules, commands). |

Fixtures: each folder in `fixtures/repos/` behaves like a repository root. They cover compact, full, hidden, invalid, settings-less and fallback cases. Fixture links point at `github.com/<your-username>/<folder>`, which don't exist. That's expected.

Discovery is build-time only (GitHub Pages is static). If GitHub is unreachable: locally the previous catalog is kept; in CI (`PORTFOLIO_STRICT=1`) the build fails so the live site is never replaced by an empty one. Set `PORTFOLIO_GITHUB_TOKEN` (see `.env.example`) to avoid the 60 requests/hour anonymous limit. Private repositories are intentionally unsupported: their content would be published on a public site.

## Terminal content you can edit

- `src/config/skills.ts`: output of `skills`.
- `src/config/site.ts`: `whoami`, `contact`, résumé path, prompt name.
- `src/styles/theme.css`: all colors.
