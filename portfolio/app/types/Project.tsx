export interface Project {
    id: number;
    title: string;
    description: string;
    shortDescription: string;
    technologies: string[];
    timeframe: string;
    githubLink?: string;
    liveLink?: string;
    stats?: { label: string; value: string }[];
    images?: string[];
    category: string;
}