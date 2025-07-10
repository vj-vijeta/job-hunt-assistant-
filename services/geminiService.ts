
import { GoogleGenAI, Type, GenerateContentResponse, GroundingMetadata } from "@google/genai";
import type { UserInfo, Experience, CompanyInsights, GroundingChunk, Job, JobMatchAnalysis, GeneratedData, ApiSource, JobType, DocumentStyle, LanguageCode, StructuredResume, StructuredResumeExperience } from '../types';
import { LANGUAGES } from '../types';

const getApiKey = (): string | null => {
    try {
        const storedKey = localStorage.getItem('geminiApiKey');
        if (storedKey && storedKey.trim() !== '') {
            return storedKey;
        }
    } catch (e) {
        console.warn('Could not access localStorage for API key.');
    }
    if (process.env.API_KEY && process.env.API_KEY.trim() !== '') {
        return process.env.API_KEY;
    }
    return null;
};

const getAiClient = (): GoogleGenAI => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please add it in the Dashboard.");
    }
    return new GoogleGenAI({ apiKey });
};

const model = 'gemini-2.5-flash';
const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY;

export interface JobSearchParams {
    query: string;
    location: string;
    api: ApiSource;
    jobType: JobType | '';
    isRemote: boolean;
}

interface InternalSearchParams {
    query: string;
    location: string;
    jobType: JobType | '';
    isRemote: boolean;
}


const findJobsWithGemini = async (params: InternalSearchParams): Promise<Job[]> => {
    const ai = getAiClient();
    try {
        let prompt = `Based on the query "${params.query}"`;
        if (params.location) prompt += ` in "${params.location}"`;
        if (params.jobType) prompt += ` for a ${params.jobType.toLowerCase()} position`;
        if (params.isRemote) prompt += `, that is a remote role`;

        prompt += `. Find up to 5 relevant and recent job postings. Provide the result as a JSON array of objects. Each object should have keys "title", "company", "location", "description", "url", "postedDate", and "source". The "postedDate" should be a human-readable string like "3 days ago" or "2023-10-27". The "source" should be 'AI-Powered Search'. IMPORTANT: Respond with ONLY the raw JSON array string. Do not include any other text, markdown formatting, or explanations.`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        
        const textResponse = response.text.trim();
        const jsonString = textResponse.replace(/^```json\s*/, '').replace(/```$/, '');
        
        return JSON.parse(jsonString) as Job[];
    } catch (error) {
        console.error("Error finding jobs with Gemini:", error);
        throw new Error("Failed to parse job search results from the AI. The format was unexpected.");
    }
};

const findJobsWithApi = async (params: InternalSearchParams, sourceName: string = 'JSearch API'): Promise<Job[]> => {
    if (!JSEARCH_API_KEY) {
        console.warn("JSearch API key is not configured. Skipping API job search.");
        return [];
    }

    const url = new URL('https://jsearch.p.rapidapi.com/search');
    const finalQuery = params.location ? `${params.query}, ${params.location}` : params.query;
    url.searchParams.append('query', finalQuery);
    url.searchParams.append('num_pages', '1');
    url.searchParams.append('page', '1');
    if (params.jobType) {
        url.searchParams.append('employment_types', params.jobType);
    }
    if(params.isRemote) {
        url.searchParams.append('remote_jobs_only', 'true');
    }


    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': JSEARCH_API_KEY,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
        });

        if (!response.ok) {
             const errorBody = await response.text();
            console.error("JSearch API Error Body:", errorBody);
            throw new Error(`JSearch API responded with status ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.data) {
            return [];
        }

        return result.data.map((item: any): Job => ({
            title: item.job_title || 'N/A',
            company: item.employer_name || 'N/A',
            location: item.job_city ? `${item.job_city}, ${item.job_state}` : item.job_country || 'Remote',
            description: item.job_description || 'No description available.',
            url: item.job_google_link || '#',
            postedDate: item.job_posted_at_datetime_utc ? new Date(item.job_posted_at_datetime_utc).toLocaleDateString() : 'N/A',
            source: sourceName,
        }));

    } catch (error) {
        console.error("Error fetching jobs from JSearch API:", error);
        return []; 
    }
};

const findJobsWithJobicy = async (params: InternalSearchParams): Promise<Job[]> => {
    const url = new URL('https://jobicy.com/api/v2/remote-jobs');
    url.searchParams.append('count', '10');
    if (params.query) {
        const tag = params.query.replace(/\s+/g, '-').toLowerCase();
        url.searchParams.append('tag', tag);
    }

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Jobicy API responded with status ${response.status}`);
        }
        const result = await response.json();

        if (!result.jobs || result.jobs.length === 0) {
            return [];
        }

        return result.jobs.map((item: any): Job => ({
            title: item.jobTitle || 'N/A',
            company: item.companyName || 'N/A',
            location: item.jobGeo || 'Remote',
            description: item.jobDescription?.replace(/<[^>]*>?/gm, '') || 'No description available.',
            url: item.url || '#',
            postedDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : 'N/A',
            source: 'Jobicy API'
        }));
    } catch (error) {
        console.error("Error fetching jobs from Jobicy API:", error);
        return [];
    }
};

const findJobsWithRemotive = async (params: InternalSearchParams): Promise<Job[]> => {
    const url = new URL('https://remotive.com/api/remote-jobs');
    url.searchParams.append('limit', '10');
    if (params.query) {
        url.searchParams.append('search', params.query);
    }

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Remotive API responded with status ${response.status}`);
        }
        const result = await response.json();

        if (!result.jobs || result.jobs.length === 0) {
            return [];
        }

        return result.jobs.map((item: any): Job => ({
            title: item.title || 'N/A',
            company: item.company_name || 'N/A',
            location: item.candidate_required_location || 'Remote',
            description: item.description?.replace(/<[^>]*>?/gm, '') || 'No description available.',
            url: item.url || '#',
            postedDate: item.publication_date ? new Date(item.publication_date).toLocaleDateString() : 'N/A',
            source: 'Remotive API'
        }));
    } catch (error) {
        console.error("Error fetching jobs from Remotive API:", error);
        return [];
    }
};

export const findJobsOnline = async (params: JobSearchParams): Promise<Job[]> => {
    const internalParams: InternalSearchParams = { query: params.query, location: params.location, jobType: params.jobType, isRemote: params.isRemote };
    let promises: Promise<Job[]>[] = [];

    switch (params.api) {
        case 'gemini': promises.push(findJobsWithGemini(internalParams)); break;
        case 'jsearch': promises.push(findJobsWithApi(internalParams)); break;
        case 'germany': promises.push(findJobsWithApi({ ...internalParams, location: `${internalParams.location || ''} Germany`.trim()}, 'JSearch (Germany)')); break;
        case 'jobicy': promises.push(findJobsWithJobicy(internalParams)); break;
        case 'remotive': promises.push(findJobsWithRemotive(internalParams)); break;
        case 'all': default:
            promises.push(findJobsWithGemini(internalParams));
            if (JSEARCH_API_KEY) { promises.push(findJobsWithApi(internalParams)); }
            promises.push(findJobsWithJobicy(internalParams));
            promises.push(findJobsWithRemotive(internalParams));
            break;
    }
    const results = await Promise.all(promises);
    return results.flat().filter((job, index, self) => index === self.findIndex((j) => j.title === job.title && j.company === job.company));
};

export const parseCvText = async (cvText: string): Promise<{ userInfo: UserInfo, experiences: Experience[] }> => {
    const ai = getAiClient();
    const prompt = `Parse the following resume text and extract the user's information and work experience. Provide the result as a JSON object. Ensure experience IDs are unique timestamp strings.
    Resume Text:
    ---
    ${cvText}
    ---
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            userInfo: {
                type: Type.OBJECT,
                properties: {
                    fullName: { type: Type.STRING }, email: { type: Type.STRING }, phone: { type: Type.STRING },
                    website: { type: Type.STRING }, address: { type: Type.STRING }, skills: { type: Type.STRING },
                    summary: { type: Type.STRING }, education: { type: Type.STRING }, certifications: { type: Type.STRING },
                }
            },
            experiences: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING, description: "A unique ID, use a timestamp string." },
                        company: { type: Type.STRING }, role: { type: Type.STRING }, startDate: { type: Type.STRING },
                        endDate: { type: Type.STRING }, responsibilities: { type: Type.STRING },
                    }
                }
            }
        }
    };
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text);
};

export const suggestJobTitles = async (cvText: string): Promise<string[]> => {
    if (!cvText.trim()) return [];
    const ai = getAiClient();
    try {
        const prompt = `Based on the following resume text, act as an expert career advisor and suggest 5 relevant job titles.
        Resume Text: --- ${cvText} ---
        Return the job titles as a JSON object with a single key "titles" which is an array of strings.`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.OBJECT, properties: { titles: { type: Type.ARRAY, items: { type: Type.STRING } } } }
            }
        });
        const parsed = JSON.parse(response.text);
        return (parsed && parsed.titles && Array.isArray(parsed.titles)) ? parsed.titles : [];
    } catch (error) {
        console.error("Error suggesting job titles:", error);
        return [];
    }
};

export const generateAllMaterials = async (
    userInfo: UserInfo,
    experiences: Experience[],
    cvText: string,
    jobDescription: string,
    style: DocumentStyle,
    language: LanguageCode
): Promise<GeneratedData> => {
    const ai = getAiClient();
    const languageName = LANGUAGES[language];

    const userProfileString = `
        User Info: ${JSON.stringify(userInfo)}
        Work Experience: ${JSON.stringify(experiences.map(({id, ...rest}) => rest))}
        Full CV Text (if provided, use as primary source): ${cvText}
    `;

    const insightsPromise = ai.models.generateContent({
        model,
        contents: `Based on the following job description, provide deep insights about the company and potential hiring manager using Google Search.
        Job Description: --- ${jobDescription} ---`,
        config: { tools: [{ googleSearch: {} }] },
    }).then(response => ({
        text: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    })).catch(e => {
        console.error("Error fetching company insights:", e);
        return null;
    });

    const mainGenerationPromise = ai.models.generateContent({
        model,
        contents: `
          Act as an expert career coach and resume writer. Your task is to generate a complete set of application materials in ${languageName}.
          The user's profile is: ${userProfileString}
          The target job is: ${jobDescription}
          The desired tone is: ${style}

          Generate the following as a single JSON object:
          1.  'resume': A tailored resume in a structured format.
          2.  'coverLetter': A compelling, personalized cover letter.
          3.  'jobMatchAnalysis': An analysis of how well the user's profile matches the job.

          For the resume, populate ALL fields of the structure. For experiences, rewrite descriptions to be achievement-oriented and tailored to the job, using newline characters for bullet points.
          For the job match analysis, provide a score from 0-100, a brief summary, and lists of strengths and weaknesses.
        `,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    resume: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING }, email: { type: Type.STRING }, phone: { type: Type.STRING }, website: { type: Type.STRING }, address: { type: Type.STRING }, summary: { type: Type.STRING },
                            experiences: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: { role: { type: Type.STRING }, company: { type: Type.STRING }, dates: { type: Type.STRING }, description: { type: Type.STRING, description: "Achievements and responsibilities, separated by newline characters." } },
                                    required: ['role', 'company', 'dates', 'description']
                                }
                            },
                            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                            education: { type: Type.STRING }, certifications: { type: Type.STRING },
                        },
                        required: ['name', 'email', 'phone', 'website', 'address', 'summary', 'experiences', 'skills', 'education', 'certifications']
                    },
                    coverLetter: { type: Type.STRING },
                    jobMatchAnalysis: {
                        type: Type.OBJECT,
                        properties: {
                            matchScore: { type: Type.INTEGER }, summary: { type: Type.STRING }, strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ['matchScore', 'summary', 'strengths', 'weaknesses']
                    }
                }
            }
        }
    });

    const [insightsResult, mainResult] = await Promise.all([insightsPromise, mainGenerationPromise]);
    
    const mainData = JSON.parse(mainResult.text);

    return {
        ...mainData,
        companyInsights: insightsResult,
    };
};
