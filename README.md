# Portfolio

Astro site with a boot splash, a persistent terminal, and project windows generated from GitHub repositories.

Each repo controls how it appears via a `portfolio.settings` file at its root. See **[docs/portfolio-settings.md](docs/portfolio-settings.md)**.

```sh
npm install
npm run dev:fixtures   # try it with built-in fake repositories (no GitHub needed)
npm run dev            # discover real projects from GitHub
npm run build          # production build (discovery runs first)
npm test
```

Hero carousel: slides and per-image effects are configured in `src/config/carousel.ts` (images in `public/hero/`).

Edit-me files: `src/config/carousel.ts` (slides), `src/styles/theme.css` (colors), `src/config/skills.ts` (the `skills` command), `src/config/site.ts` (name, GitHub user, whoami, contact, résumé).

Deploys to GitHub Pages through `.github/workflows/deploy.yml` (set Settings → Pages → Source to *GitHub Actions*).
