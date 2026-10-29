import fs from 'node:fs';
import path from 'node:path';

/** Build-time sources of repositories. Never imported by client code. */

export interface RepoRef {
  owner: string;
  name: string;
  branch: string;
  fork: boolean;
  archived: boolean;
}

export type Binary = Buffer | 'too-large' | null;

export interface Source {
  name: 'github' | 'fixtures';
  listRepos(): Promise<RepoRef[]>;
  /** null when the file does not exist */
  readText(repo: RepoRef, path: string, maxBytes?: number): Promise<string | null>;
  readBinary(repo: RepoRef, path: string, maxBytes: number): Promise<Binary>;
  readme(repo: RepoRef, maxBytes?: number): Promise<string | null>;
}

/** Discovery could not complete (rate limit, network, API failure). Not the same as "file missing". */
export class DiscoveryError extends Error {}

const API = 'https://api.github.com';
const TIMEOUT_MS = 20_000;

export class GitHubSource implements Source {
  name = 'github' as const;
  private username: string;
  private token?: string;
  constructor(username: string, token?: string) {
    this.username = username;
    this.token = token;
  }

  private async request(url: string, retry = true): Promise<Response | null> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'portfolio-sync',
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    let res: Response;
    try {
      res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
      if (retry) return this.request(url, false);
      throw new DiscoveryError(`network error for ${url}: ${(e as Error).message}`);
    }
    if (res.status === 404) return null;
    if (res.status === 403 || res.status === 429) {
      if (res.headers.get('x-ratelimit-remaining') === '0' || res.status === 429) {
        const reset = Number(res.headers.get('x-ratelimit-reset'));
        const when = reset ? ` (resets ${new Date(reset * 1000).toISOString()})` : '';
        throw new DiscoveryError(
          `GitHub API rate limit reached${when}. Set PORTFOLIO_GITHUB_TOKEN to raise the limit.`,
        );
      }
    }
    if (res.status >= 500 && retry) return this.request(url, false);
    if (!res.ok) throw new DiscoveryError(`GitHub API ${res.status} for ${url}`);
    return res;
  }

  async listRepos(): Promise<RepoRef[]> {
    const out: RepoRef[] = [];
    for (let page = 1; page <= 20; page++) {
      const res = await this.request(
        `${API}/users/${encodeURIComponent(this.username)}/repos?type=owner&per_page=100&page=${page}`,
      );
      if (!res) throw new DiscoveryError(`GitHub user "${this.username}" not found`);
      const rows = (await res.json()) as any[];
      for (const r of rows) {
        out.push({
          owner: r.owner.login,
          name: r.name,
          branch: r.default_branch ?? 'main',
          fork: !!r.fork,
          archived: !!r.archived,
        });
      }
      if (rows.length < 100) break;
    }
    return out;
  }

  private contents(repo: RepoRef, filePath: string) {
    const p = filePath.split('/').map(encodeURIComponent).join('/');
    return this.request(`${API}/repos/${repo.owner}/${repo.name}/contents/${p}?ref=${encodeURIComponent(repo.branch)}`);
  }

  async readText(repo: RepoRef, filePath: string, maxBytes = 1_000_000) {
    const res = await this.contents(repo, filePath);
    if (!res) return null;
    const len = Number(res.headers.get('content-length'));
    if (len && len > maxBytes) return null;
    const text = await res.text();
    return text.length > maxBytes ? null : text;
  }

  async readBinary(repo: RepoRef, filePath: string, maxBytes: number): Promise<Binary> {
    const res = await this.contents(repo, filePath);
    if (!res) return null;
    const len = Number(res.headers.get('content-length'));
    if (len && len > maxBytes) {
      await res.body?.cancel();
      return 'too-large';
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > maxBytes ? 'too-large' : buf;
  }

  async readme(repo: RepoRef, maxBytes = 500_000) {
    const res = await this.request(`${API}/repos/${repo.owner}/${repo.name}/readme?ref=${encodeURIComponent(repo.branch)}`);
    if (!res) return null;
    const text = await res.text();
    return text.length > maxBytes ? text.slice(0, maxBytes) : text;
  }
}

/**
 * Local test source: every folder in fixtures/repos/ behaves like a repository root.
 * Lets you develop and test without creating any real GitHub repositories.
 */
export class FixtureSource implements Source {
  name = 'fixtures' as const;
  private root: string;
  private owner: string;
  constructor(root: string, owner: string) {
    this.root = root;
    this.owner = owner;
  }

  async listRepos(): Promise<RepoRef[]> {
    if (!fs.existsSync(this.root)) return [];
    return fs
      .readdirSync(this.root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => ({ owner: this.owner, name: d.name, branch: 'main', fork: false, archived: false }));
  }

  private file(repo: RepoRef, rel: string): string | null {
    const base = path.resolve(this.root, repo.name);
    const full = path.resolve(base, rel);
    if (full !== base && !full.startsWith(base + path.sep)) return null;
    return fs.existsSync(full) && fs.statSync(full).isFile() ? full : null;
  }

  async readText(repo: RepoRef, rel: string, maxBytes = 1_000_000) {
    const f = this.file(repo, rel);
    if (!f || fs.statSync(f).size > maxBytes) return null;
    return fs.readFileSync(f, 'utf8');
  }

  async readBinary(repo: RepoRef, rel: string, maxBytes: number): Promise<Binary> {
    const f = this.file(repo, rel);
    if (!f) return null;
    return fs.statSync(f).size > maxBytes ? 'too-large' : fs.readFileSync(f);
  }

  async readme(repo: RepoRef) {
    const dir = path.join(this.root, repo.name);
    if (!fs.existsSync(dir)) return null;
    const name = fs.readdirSync(dir).find((n) => /^readme(\.(md|markdown|txt))?$/i.test(n));
    return name ? fs.readFileSync(path.join(dir, name), 'utf8') : null;
  }
}
