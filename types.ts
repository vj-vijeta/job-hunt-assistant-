

export interface UserInfo {
  fullName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  skills: string;
  summary?: string;
  education?: string;
  certifications?: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface CompanyInsights {
  text: string;
  sources: GroundingChunk[];
}

export interface Job {
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    postedDate: string;
    source: string;
}

export interface JobMatchAnalysis {
    matchScore: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
}

export interface StructuredResumeExperience {
  role: string;
  company: string;
  dates: string;
  description: string;
}

export interface StructuredResume {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  summary: string;
  experiences: StructuredResumeExperience[];
  skills: string[];
  education: string;
  certifications: string;
}


export interface GeneratedData {
  resume: StructuredResume;
  coverLetter: string;
  companyInsights: CompanyInsights | null;
  jobMatchAnalysis: JobMatchAnalysis | null;
}

export type ApiSource = 'all' | 'gemini' | 'jsearch' | 'jobicy' | 'remotive' | 'germany';
export type JobType = 'FULLTIME' | 'CONTRACTOR' | 'PARTTIME' | 'INTERN';
export type DocumentStyle = 'professional' | 'creative' | 'modern';

export type LanguageCode = 'en' | 'fr' | 'de' | 'es' | 'it' | 'pt' | 'la';

export const LANGUAGES: Record<LanguageCode, string> = {
    en: 'English',
    fr: 'French',
    de: 'German',
    es: 'Spanish',
    it: 'Italian',
    pt: 'Portuguese',
    la: 'Latin',
};

export interface AppliedJob {
    id: string;
    job: Job;
    appliedDate: string;
    generatedResume: StructuredResume | string; // Allow string for backward compatibility
    generatedCoverLetter: string;
}

export type CvParsingStatus = 'idle' | 'parsing' | 'analyzing' | 'success' | 'error';
