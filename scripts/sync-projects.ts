/**
 * Discovers projects and writes:
 *   src/generated/catalog.json   normalized project catalog
 *   public/projects/<slug>/...   repo assets (images, pdfs, videos) copied into the site
 *
 * Runs automatically before `npm run dev` and `npm run build`.
 *   --fixtures                      read fixtures/repos/ instead of GitHub
 *   PORTFOLIO_SOURCE=fixtures       same, via environment
 *   PORTFOLIO_GITHUB_TOKEN          optional token (raises the API rate limit)
 *   PORTFOLIO_STRICT=1              fail the build if GitHub discovery fails (used in CI)
 */
import fs from 'node:fs';
import path from 'node:path';
import { site } from '../src/config/site.ts';
import { DiscoveryError, FixtureSource, GitHubSource } from '../src/lib/github.ts';
import { buildCatalog, makeEmbedChecker } from '../src/lib/projectRegistry.ts';

const root = path.resolve(import.meta.dirname, '..');
const outCatalog = path.join(root, 'src/generated/catalog.json');
const outAssets = path.join(root, 'public/projects');
const tmpAssets = path.join(root, '.cache/projects-tmp');

const useFixtures = process.argv.includes('--fixtures') || process.env.PORTFOLIO_SOURCE === 'fixtures';
const strict = process.env.PORTFOLIO_STRICT === '1';
const token = process.env.PORTFOLIO_GITHUB_TOKEN || process.env.GITHUB_TOKEN || undefined;

const warnings: string[] = [];
const warn = (m: string) => {
  warnings.push(m);
  console.warn(`  ! ${m}`);
};

fs.rmSync(tmpAssets, { recursive: true, force: true });

const source = useFixtures
  ? new FixtureSource(path.join(root, 'fixtures/repos'), site.github.username)
  : new GitHubSource(site.github.username, token);

console.log(`[portfolio] discovering projects from ${source.name}${useFixtures ? '' : ` (${site.github.username})`}`);

try {
  const catalog = await buildCatalog({
    source,
    includeForks: site.github.includeForks,
    includeArchived: site.github.includeArchived,
    checkEmbed: makeEmbedChecker(site.origin),
    warn,
    writeAsset(slug, repoPath, data) {
      const dest = path.join(tmpAssets, slug, repoPath);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, data);
    },
  });

  fs.mkdirSync(path.dirname(outCatalog), { recursive: true });
  fs.writeFileSync(outCatalog, JSON.stringify(catalog, null, 2));
  fs.rmSync(outAssets, { recursive: true, force: true });
  if (fs.existsSync(tmpAssets)) fs.renameSync(tmpAssets, outAssets);

  console.log(`[portfolio] ${catalog.projects.length} project(s): ${catalog.projects.map((p) => p.slug).join(', ') || '(none)'}`);
  if (warnings.length) console.log(`[portfolio] ${warnings.length} warning(s)`);
} catch (e) {
  fs.rmSync(tmpAssets, { recursive: true, force: true });
  if (!(e instanceof DiscoveryError)) throw e;
  const kept = fs.existsSync(outCatalog);
  console.error(`[portfolio] discovery failed: ${e.message}`);
  if (strict) process.exit(1);
  console.error(kept ? '[portfolio] keeping the previous catalog.' : '[portfolio] continuing with an empty catalog.');
}
