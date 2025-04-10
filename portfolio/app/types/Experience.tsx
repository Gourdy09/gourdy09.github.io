export interface Experience {
    id: number;
    title: string;
    company: string;
    location: string;
    type: string;
    startDate: string;
    endDate: string;
    description: string;
    skills: string[];
    achievements?: string[];
    logo?: string;
}