/** Normalized shapes stored in the generated catalog and consumed by the UI. */

export interface Asset {
  /** vendored file (path relative to site root) or absolute https URL */
  src: string;
  local: boolean;
}

export type Resource =
  | { type: 'webpage'; title: string; url: string; display: 'embed' | 'link' | 'preview'; embedBlocked?: boolean }
  | { type: 'pdf'; title: string; display: 'embed' | 'link' | 'preview'; asset?: Asset; openUrl: string }
  | { type: 'notebook'; title: string; display: 'embed' | 'link' | 'preview'; html?: string; openUrl: string; colabUrl?: string }
  | { type: 'codespace'; title: string; url: string }
  | { type: 'repo'; title: string; url: string }
  | {
      type: 'video';
      title: string;
      display: 'embed' | 'link' | 'preview';
      asset?: Asset;
      poster?: Asset;
      openUrl: string;
      autoplay: boolean;
      loop: boolean;
      controls: boolean;
      playsInline: boolean;
    }
  | { type: 'link'; title: string; url: string };

export interface Project {
  slug: string;
  title: string;
  description: string;
  category?: string;
  tags: string[];
  featured: boolean;
  repo: { owner: string; name: string; branch: string; url: string };
  images: (Asset & { alt: string })[];
  readmeHtml?: string;
  resources: Resource[];
}

export interface Catalog {
  generatedAt: string;
  source: 'github' | 'fixtures';
  projects: Project[];
}

/** What the terminal needs to know about a project. */
export type ProjectSummary = Pick<Project, 'slug' | 'title' | 'description' | 'category' | 'featured'> & {
  compact: boolean;
};

export const isCompact = (p: Project) => p.images.length === 0 && !p.readmeHtml && p.resources.length === 0;

export const toSummary = (p: Project): ProjectSummary => ({
  slug: p.slug,
  title: p.title,
  description: p.description,
  category: p.category,
  featured: p.featured,
  compact: isCompact(p),
});
