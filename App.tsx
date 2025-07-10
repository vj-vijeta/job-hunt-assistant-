
import React, { useState, useCallback, useEffect, ChangeEvent } from 'react';
import type { UserInfo, Experience, GeneratedData, Job, ApiSource, JobType, DocumentStyle, AppliedJob, LanguageCode, CvParsingStatus } from './types';
import { LANGUAGES } from './types';
import { generateAllMaterials, findJobsOnline, parseCvText, suggestJobTitles } from './services/geminiService';

import Header from './components/Header';
import Footer from './components/Footer';
import InputSection from './components/InputSection';
import ExperienceForm from './components/ExperienceForm';
import GeneratedOutput from './components/GeneratedOutput';
import Dashboard from './components/Dashboard';
import BackgroundAnimation from './components/BackgroundAnimation';

import { 
    UserIcon, BriefcaseIcon, FileTextIcon, SearchIcon, WandSparklesIcon, XCircleIcon, UploadCloudIcon, CheckBadgeIcon, InformationCircleIcon
} from './components/icons';

import * as pdfjs from 'pdfjs-dist';
import * as mammoth from 'mammoth';

// Set up the PDF.js worker
try {
    const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
} catch (error) {
    console.error("Error setting up pdf.js worker:", error);
}

const initialUserInfo: UserInfo = {
  fullName: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  skills: '',
  summary: '',
  education: '',
  certifications: '',
};

const getInitialState = <T,>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            return JSON.parse(storedValue);
        }
    } catch (error) {
        console.error(`Error reading from localStorage for key "${key}":`, error);
    }
    return defaultValue;
};

export const App: React.FC = () => {
    const [userInfo, setUserInfo] = useState<UserInfo>(() => getInitialState('userInfo', initialUserInfo));
    const [experiences, setExperiences] = useState<Experience[]>(() => getInitialState('experiences', []));
    const [jobDescription, setJobDescription] = useState<string>('');
    const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [jobSearchQuery, setJobSearchQuery] = useState<string>('');
    const [jobSearchLocation, setJobSearchLocation] = useState<string>('');
    const [isRemote, setIsRemote] = useState<boolean>(false);
    const [jobType, setJobType] = useState<JobType | ''>('');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [jobSearchStatus, setJobSearchStatus] = useState<'idle' | 'searching' | 'success' | 'error'>('idle');
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [apiSource, setApiSource] = useState<ApiSource>('all');
    const [documentStyle, setDocumentStyle] = useState<DocumentStyle>('professional');
    const [languageCode, setLanguageCode] = useState<LanguageCode>('en');
    const [showDashboard, setShowDashboard] = useState(false);
    const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>(() => getInitialState('appliedJobs', []));
    const [importedCv, setImportedCv] = useState<string>('');
    const [pastedCvText, setPastedCvText] = useState<string>('');
    const [cvParsingStatus, setCvParsingStatus] = useState<CvParsingStatus>('idle');
    const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
    const [jobSuggestionStatus, setJobSuggestionStatus] = useState<'idle' | 'suggesting' | 'success'>('idle');


    useEffect(() => { try { localStorage.setItem('userInfo', JSON.stringify(userInfo)); } catch (e) { console.error(e); } }, [userInfo]);
    useEffect(() => { try { localStorage.setItem('experiences', JSON.stringify(experiences)); } catch (e) { console.error(e); } }, [experiences]);
    useEffect(() => { try { localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs)); } catch (e) { console.error(e); } }, [appliedJobs]);

    const executeJobSearch = useCallback(async (query: string) => {
        if (!query.trim()) return;
        setJobSearchStatus('searching');
        setJobs([]);
        try {
            const results = await findJobsOnline({ query, location: jobSearchLocation, api: apiSource, isRemote, jobType });
            setJobs(results);
            setJobSearchStatus('success');
        } catch (err: any) {
            console.error("Error finding jobs:", err);
            setJobSearchStatus('error');
        }
    }, [jobSearchLocation, apiSource, isRemote, jobType]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedData(null);
        try {
            const data = await generateAllMaterials(userInfo, experiences, importedCv, jobDescription, documentStyle, languageCode);
            setGeneratedData(data);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during generation.');
            console.error(err);
        }
        setIsLoading(false);
    };

    const handleJobSearch = () => {
        executeJobSearch(jobSearchQuery);
    };

    const handleSuggestionClick = (title: string) => {
        setJobSearchQuery(title);
        executeJobSearch(title);
    };
    
    const handleSelectJob = (job: Job) => {
        setSelectedJob(job);
        const jobHeader = `Job Title: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\n---\n`;
        setJobDescription(jobHeader + job.description);
        setJobs([]);
        setJobSearchQuery('');
    }

    const handleClearSelectedJob = () => {
        setSelectedJob(null);
    }
    
    const handleMarkAsApplied = () => {
        if (!selectedJob || !generatedData) return;
        const newAppliedJob: AppliedJob = {
            id: new Date().toISOString() + Math.random(),
            job: selectedJob,
            appliedDate: new Date().toLocaleDateString(),
            generatedResume: generatedData.resume,
            generatedCoverLetter: generatedData.coverLetter
        };
        setAppliedJobs([newAppliedJob, ...appliedJobs]);
        alert('Application tracked! You can view it in the dashboard.');
        setSelectedJob(null);
        setJobDescription('');
        setGeneratedData(null);
    };

    const handleDeleteAppliedJob = (id: string) => {
        setAppliedJobs(appliedJobs.filter(job => job.id !== id));
    };

    const handleUserInfoChange = <K extends keyof UserInfo>(field: K, value: UserInfo[K]) => {
        setUserInfo({ ...userInfo, [field]: value });
    };

    const processCvText = async (text: string) => {
        if (!text.trim()) {
            setCvParsingStatus('error');
            console.error("Attempted to process empty CV text.");
            return;
        }

        setImportedCv(text);
        setSuggestedTitles([]);
        setJobSuggestionStatus('idle');
        setCvParsingStatus('analyzing');

        try {
            const parsedData = await parseCvText(text);

            setUserInfo(prev => ({
                ...prev,
                fullName: parsedData.userInfo.fullName || prev.fullName,
                email: parsedData.userInfo.email || prev.email,
                phone: parsedData.userInfo.phone || prev.phone,
                website: parsedData.userInfo.website || prev.website,
                address: parsedData.userInfo.address || prev.address,
                summary: parsedData.userInfo.summary || prev.summary,
                skills: parsedData.userInfo.skills || prev.skills,
                education: parsedData.userInfo.education || prev.education,
                certifications: parsedData.userInfo.certifications || prev.certifications,
            }));
            
            if(parsedData.experiences && parsedData.experiences.length > 0){
                setExperiences(parsedData.experiences);
            }
            
            setCvParsingStatus('success');

            setJobSuggestionStatus('suggesting');
            const titles = await suggestJobTitles(text);
            setSuggestedTitles(titles);
            setJobSuggestionStatus('success');

        } catch (error: any) {
            console.error("Error processing CV text with AI:", error);
            setCvParsingStatus('error');
            setJobSuggestionStatus('idle');
        }
    };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setPastedCvText(''); // Clear other input
        setCvParsingStatus('parsing');

        try {
            let text = '';
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    text += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
                }
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } else {
                throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
            }
            
            if(text.trim()){
                await processCvText(text);
            } else {
                throw new Error("Could not extract any text from the file.");
            }

        } catch (error: any) {
            console.error("Error parsing CV file:", error);
            setCvParsingStatus('error');
        }
        event.target.value = ''; // Reset file input
    };

    const handleParsePastedCv = async () => {
        if (!pastedCvText.trim()) return;
        await processCvText(pastedCvText);
    };

    const classicLabelClasses = "block text-sm font-semibold tracking-wide text-classic-text-secondary dark:text-classic-text-secondary-dark uppercase";
    const commonInputClasses = "mt-1 block w-full rounded-md bg-classic-surface dark:bg-classic-surface-dark text-classic-text-primary dark:text-classic-text-primary-dark border-classic-border dark:border-classic-border-dark shadow-sm focus:border-classic-primary-focus focus:ring focus:ring-classic-primary-focus focus:ring-opacity-20 transition-colors";

    if (showDashboard) {
        return <Dashboard jobs={appliedJobs} onDelete={handleDeleteAppliedJob} onBack={() => setShowDashboard(false)} />;
    }

    return (
        <div className="min-h-screen text-classic-text-primary dark:text-classic-text-primary-dark">
            <BackgroundAnimation />
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <Header />
                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="space-y-6 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
                        
                        <InputSection title="Your Information" icon={<UserIcon className="w-6 h-6 text-classic-primary dark:text-primary-400" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className={classicLabelClasses}>Full Name</label><input type="text" value={userInfo.fullName} onChange={e => handleUserInfoChange('fullName', e.target.value)} className={commonInputClasses} placeholder="e.g., Jane Doe" /></div>
                                <div><label className={classicLabelClasses}>Email</label><input type="email" value={userInfo.email} onChange={e => handleUserInfoChange('email', e.target.value)} className={commonInputClasses} placeholder="e.g., jane.doe@example.com" /></div>
                                <div><label className={classicLabelClasses}>Phone</label><input type="tel" value={userInfo.phone} onChange={e => handleUserInfoChange('phone', e.target.value)} className={commonInputClasses} placeholder="e.g., (123) 456-7890" /></div>
                                <div><label className={classicLabelClasses}>Website/Portfolio</label><input type="url" value={userInfo.website} onChange={e => handleUserInfoChange('website', e.target.value)} className={commonInputClasses} placeholder="e.g., https://janedoe.dev" /></div>
                            </div>
                            <div><label className={classicLabelClasses}>Address</label><input type="text" value={userInfo.address} onChange={e => handleUserInfoChange('address', e.target.value)} className={commonInputClasses} placeholder="e.g., San Francisco, CA" /></div>
                            <div><label className={classicLabelClasses}>Key Skills (comma separated)</label><textarea value={userInfo.skills} onChange={e => handleUserInfoChange('skills', e.target.value)} rows={3} className={commonInputClasses} placeholder="e.g., React, TypeScript, Node.js, Project Management" /></div>
                            <div><label className={classicLabelClasses}>Professional Summary</label><textarea value={userInfo.summary} onChange={e => handleUserInfoChange('summary', e.target.value)} rows={3} className={commonInputClasses} placeholder="A brief professional summary (optional, AI will generate one if left blank)." /></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className={classicLabelClasses}>Education</label><input type="text" value={userInfo.education} onChange={e => handleUserInfoChange('education', e.target.value)} className={commonInputClasses} placeholder="e.g., B.S. in Computer Science" /></div>
                                <div><label className={classicLabelClasses}>Certifications</label><input type="text" value={userInfo.certifications} onChange={e => handleUserInfoChange('certifications', e.target.value)} className={commonInputClasses} placeholder="e.g., AWS Certified Developer" /></div>
                            </div>
                        </InputSection>

                        <InputSection title="Import Your CV" icon={<UploadCloudIcon className="w-6 h-6 text-classic-primary dark:text-primary-400"/>}>
                           <p className="text-sm text-classic-text-secondary dark:text-classic-text-secondary-dark -mt-2 mb-4">Automatically fill your info by uploading your CV (PDF or DOCX).</p>
                           <input type="file" id="cv-upload" onChange={handleFileChange} accept=".pdf,.docx" className="hidden"/>
                           <label htmlFor="cv-upload" className="cursor-pointer w-full text-center px-4 py-3 bg-classic-primary/10 dark:bg-classic-primary/20 text-classic-primary dark:text-primary-400 font-semibold rounded-md border-2 border-dashed border-classic-primary/30 dark:border-primary-400/30 hover:bg-classic-primary/20 dark:hover:bg-classic-primary/30 transition-colors">
                                Choose File to Upload
                           </label>
                           
                            <div className="relative flex py-4 items-center">
                                <div className="flex-grow border-t border-classic-border dark:border-classic-border-dark"></div>
                                <span className="flex-shrink mx-4 text-classic-text-secondary dark:text-classic-text-secondary-dark uppercase text-xs font-semibold">Or Paste CV Text</span>
                                <div className="flex-grow border-t border-classic-border dark:border-classic-border-dark"></div>
                            </div>

                            <textarea
                                value={pastedCvText}
                                onChange={e => setPastedCvText(e.target.value)}
                                rows={8}
                                className={commonInputClasses}
                                placeholder="Paste the full text of your CV here..."
                            />
                            <button
                                onClick={handleParsePastedCv}
                                disabled={!pastedCvText.trim() || cvParsingStatus === 'parsing' || cvParsingStatus === 'analyzing'}
                                className="mt-3 w-full text-center px-4 py-2 bg-classic-primary/80 dark:bg-classic-primary/90 text-white font-semibold rounded-md hover:bg-classic-primary dark:hover:bg-classic-primary/100 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
                            >
                                {cvParsingStatus === 'analyzing' ? 'Analyzing...' : 'Parse Pasted Text'}
                            </button>


                           {cvParsingStatus !== 'idle' &&
                               <div className="mt-4 text-center text-sm font-medium">
                                   {cvParsingStatus === 'parsing' && 'Parsing file...'}
                                   {cvParsingStatus === 'analyzing' && 'Analyzing with AI...'}
                                   {cvParsingStatus === 'success' && '✅ Information extracted and forms populated!'}
                                   {cvParsingStatus === 'error' && '❌ Error processing CV. Please check format or paste manually.'}
                               </div>
                           }
                           <p className="text-xs text-classic-text-secondary dark:text-classic-text-secondary-dark text-center mt-2">Your data is processed locally and with the Gemini API. It is not stored on our servers.</p>
                        </InputSection>

                        <InputSection title="Work Experience" icon={<BriefcaseIcon className="w-6 h-6 text-classic-primary dark:text-primary-400" />}>
                            <ExperienceForm experiences={experiences} setExperiences={setExperiences} />
                        </InputSection>
                        
                         <InputSection title="Find & Select a Job" icon={<SearchIcon className="w-6 h-6 text-classic-primary dark:text-primary-400" />}>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={classicLabelClasses}>Keywords</label>
                                    <input type="text" value={jobSearchQuery} onChange={e => setJobSearchQuery(e.target.value)} className={commonInputClasses} placeholder="e.g., React Developer" />
                                </div>
                                <div>
                                    <label className={classicLabelClasses}>Location</label>
                                    <input type="text" value={jobSearchLocation} onChange={e => setJobSearchLocation(e.target.value)} className={commonInputClasses} placeholder="e.g., Berlin" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                     <label className={classicLabelClasses}>Search Source</label>
                                      <div className="relative group">
                                        <InformationCircleIcon className="w-4 h-4 text-gray-400" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                            <b>All Sources:</b> Searches all available APIs.<br/>
                                            <b>Gemini AI:</b> AI-powered, broad job search.<br/>
                                            <b>JSearch:</b> General purpose job API.<br/>
                                            <b>Germany:</b> Focused search for jobs in Germany.<br/>
                                            <b>Jobicy/Remotive:</b> Remote job specialists.<br/>
                                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                                        </div>
                                      </div>
                                    </div>
                                     <select value={apiSource} onChange={e => setApiSource(e.target.value as ApiSource)} className={commonInputClasses}>
                                        <option value="all">All Sources</option>
                                        <option value="gemini" disabled={!process.env.API_KEY}>Gemini AI Search</option>
                                        <option value="jsearch" disabled={!process.env.JSEARCH_API_KEY}>JSearch</option>
                                        <option value="germany" disabled={!process.env.JSEARCH_API_KEY}>Germany</option>
                                        <option value="jobicy">Jobicy (Remote)</option>
                                        <option value="remotive">Remotive (Remote)</option>
                                     </select>
                                </div>
                                <div>
                                    <label className={classicLabelClasses}>Job Type</label>
                                     <select value={jobType} onChange={e => setJobType(e.target.value as JobType)} className={commonInputClasses}>
                                        <option value="">Any</option>
                                        <option value="FULLTIME">Full-time</option>
                                        <option value="CONTRACTOR">Contractor</option>
                                        <option value="PARTTIME">Part-time</option>
                                        <option value="INTERN">Intern</option>
                                     </select>
                                </div>
                             </div>
                              <div className="mt-4 flex items-center">
                                <input type="checkbox" id="remote-checkbox" checked={isRemote} onChange={e => setIsRemote(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-classic-primary focus:ring-classic-primary"/>
                                <label htmlFor="remote-checkbox" className="ml-2 block text-sm text-classic-text-primary dark:text-classic-text-primary-dark">Remote only</label>
                              </div>
                            <button onClick={handleJobSearch} disabled={jobSearchStatus === 'searching'} className="mt-4 w-full px-4 py-2 bg-classic-primary text-white font-semibold rounded-md hover:bg-opacity-90 disabled:bg-gray-400 transition-colors">
                                {jobSearchStatus === 'searching' ? 'Searching...' : 'Search for Jobs'}
                            </button>
                             
                            {jobSuggestionStatus === 'suggesting' && <p className="text-center mt-4 text-sm text-classic-text-secondary dark:text-classic-text-secondary-dark">Analyzing resume for job suggestions...</p>}
                            {jobSuggestionStatus === 'success' && suggestedTitles.length > 0 && (
                                <div className="mt-6 border-t border-classic-border dark:border-classic-border-dark pt-4">
                                    <h3 className="font-semibold mb-2 text-classic-text-primary dark:text-classic-text-primary-dark">AI Job Title Suggestions</h3>
                                    <p className="text-xs text-classic-text-secondary dark:text-classic-text-secondary-dark mb-3">Click a title to search for it.</p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestedTitles.map((title, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSuggestionClick(title)}
                                                className="px-3 py-1.5 text-xs font-semibold bg-primary-100 dark:bg-classic-primary/20 text-classic-primary dark:text-primary-400 rounded-full hover:bg-primary-200 dark:hover:bg-classic-primary/30 transition-colors"
                                            >
                                                {title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                             {jobSearchStatus === 'success' && jobs.length > 0 && (
                                <div className="mt-6 border-t border-classic-border dark:border-classic-border-dark pt-4">
                                    <h3 className="font-semibold mb-2">Search Results ({jobs.length})</h3>
                                    <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                                        {jobs.map((job, index) => (
                                            <div key={index} className="p-3 border border-classic-border dark:border-classic-border-dark rounded-md bg-classic-bg dark:bg-classic-bg-dark stagger-child" style={{ animationDelay: `${index * 50}ms`}}>
                                                <h4 className="font-bold">{job.title}</h4>
                                                <p className="text-sm text-classic-text-secondary dark:text-classic-text-secondary-dark">{job.company} - {job.location}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <button onClick={() => handleSelectJob(job)} className="px-2 py-1 text-xs font-semibold bg-classic-primary text-white rounded hover:bg-opacity-80">Use this job</button>
                                                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-600 text-classic-text-primary dark:text-classic-text-primary-dark rounded hover:bg-gray-300 dark:hover:bg-gray-500">Apply</a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}
                              {jobSearchStatus === 'success' && jobs.length === 0 && <p className="text-center mt-4 text-classic-text-secondary">No jobs found for this search.</p>}
                              {jobSearchStatus === 'error' && <p className="text-center mt-4 text-red-500">Error fetching jobs. Please try again.</p>}
                        </InputSection>
                        
                        {selectedJob && (
                           <div className="p-4 border-2 border-classic-primary dark:border-primary-400 rounded-lg bg-primary-100/20 dark:bg-classic-primary/10 relative">
                               <h3 className="font-semibold text-classic-primary dark:text-primary-400">Selected Job:</h3>
                               <p className="font-bold text-lg">{selectedJob.title}</p>
                               <p>{selectedJob.company} - {selectedJob.location}</p>
                               <a href={selectedJob.url} target="_blank" rel="noopener noreferrer" className="text-sm text-classic-primary dark:text-primary-400 hover:underline">View Original Post</a>
                               <button onClick={handleClearSelectedJob} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><XCircleIcon className="w-6 h-6"/></button>
                           </div>
                        )}

                        <InputSection title="Job Description" icon={<FileTextIcon className="w-6 h-6 text-classic-primary dark:text-primary-400" />}>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                rows={8}
                                className={commonInputClasses}
                                placeholder="Paste the full job description here..."
                            />
                        </InputSection>

                        <div className="p-6 bg-classic-surface dark:bg-classic-surface-dark rounded-lg border border-classic-border dark:border-classic-border-dark">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className={classicLabelClasses}>Document Language</label>
                                    <select value={languageCode} onChange={e => setLanguageCode(e.target.value as LanguageCode)} className={commonInputClasses}>
                                        {Object.entries(LANGUAGES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label className={classicLabelClasses}>Tone / Style</label>
                                    <select value={documentStyle} onChange={e => setDocumentStyle(e.target.value as DocumentStyle)} className={commonInputClasses}>
                                        <option value="professional">Professional</option>
                                        <option value="creative">Creative</option>
                                        <option value="modern">Modern</option>
                                     </select>
                                </div>
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !jobDescription}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-classic-primary text-white font-bold rounded-lg shadow-md hover:bg-opacity-90 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all text-lg"
                            >
                                <WandSparklesIcon className="w-6 h-6" />
                                {isLoading ? 'Generating...' : 'Generate Application Materials'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="sticky top-8 animate-fadeInUp" style={{ animationDelay: '600ms' }}>
                        <GeneratedOutput
                            data={generatedData}
                            isLoading={isLoading}
                            error={error}
                            onMarkAsApplied={handleMarkAsApplied}
                            canMarkAsApplied={!!selectedJob}
                            selectedJobTitle={selectedJob?.title || null}
                            jobUrl={selectedJob?.url}
                        />
                    </div>
                </main>
                <button onClick={() => setShowDashboard(true)} className="fixed bottom-6 right-6 p-4 bg-classic-primary text-white rounded-full shadow-lg hover:bg-opacity-90 transition-transform hover:scale-105" aria-label="Open Dashboard">
                    <CheckBadgeIcon className="w-8 h-8"/>
                </button>
                <Footer/>
            </div>
        </div>
    );
};
