import React, { useState, useEffect } from 'react';
import type { AppliedJob, StructuredResume } from '../types';
import { ArrowLeftIcon, BriefcaseIcon, ChevronDownIcon, FileTextIcon, TrashIcon, KeyIcon, EyeIcon, EyeOffIcon, ExclamationTriangleIcon } from './icons';
import InputSection from './InputSection';

interface DashboardProps {
    jobs: AppliedJob[];
    onDelete: (id: string) => void;
    onBack: () => void;
}

const ResumeDisplay: React.FC<{ resume: StructuredResume }> = ({ resume }) => (
    <div className="p-4 bg-white dark:bg-classic-bg-dark rounded-md border border-classic-border dark:border-classic-border-dark font-serif text-sm">
        <h3 className="text-center text-xl font-bold mb-1">{resume.name}</h3>
        <p className="text-center text-xs text-classic-text-secondary dark:text-classic-text-secondary-dark border-b border-classic-border dark:border-classic-border-dark pb-2 mb-2">
            {resume.email} | {resume.phone} | {resume.website}
        </p>

        <h4 className="font-bold text-sm uppercase tracking-wider mt-3 mb-1">Summary</h4>
        <p className="text-xs">{resume.summary}</p>
        
        <h4 className="font-bold text-sm uppercase tracking-wider mt-3 mb-1">Experience</h4>
        {resume.experiences.map((exp, i) => (
            <div key={i} className="mb-2 text-xs">
                <div className="flex justify-between">
                    <p><strong>{exp.role},</strong> <em>{exp.company}</em></p>
                    <p><em>{exp.dates}</em></p>
                </div>
                <ul className="list-disc list-inside pl-2 mt-1">
                    {exp.description && typeof exp.description === 'string' && exp.description.split('\n').map((line, j) => line.trim() && <li key={j}>{line.trim().replace(/^- /, '')}</li>)}
                </ul>
            </div>
        ))}
        
        <h4 className="font-bold text-sm uppercase tracking-wider mt-3 mb-1">Skills</h4>
        <p className="text-xs">{resume.skills.join(', ')}</p>

        <h4 className="font-bold text-sm uppercase tracking-wider mt-3 mb-1">Education</h4>
        <p className="text-xs">{resume.education}</p>
        
        <h4 className="font-bold text-sm uppercase tracking-wider mt-3 mb-1">Certifications</h4>
        <p className="text-xs">{resume.certifications}</p>
    </div>
);


const AppliedJobItem: React.FC<{ item: AppliedJob, onDelete: () => void, isDeleting: boolean }> = ({ item, onDelete, isDeleting }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`bg-classic-surface dark:bg-classic-surface-dark rounded-lg border border-classic-border dark:border-classic-border-dark transition-all duration-300 ${isDeleting ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'}`}>
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-4 overflow-hidden">
                     <div className="bg-primary-100 dark:bg-classic-primary/20 p-3 rounded-lg flex-shrink-0">
                        <BriefcaseIcon className="w-6 h-6 text-classic-primary dark:text-primary-400" />
                    </div>
                    <div>
                        <h3 className="font-bold font-serif text-lg text-classic-text-primary dark:text-classic-text-primary-dark truncate">{item.job.title}</h3>
                        <p className="text-classic-text-secondary dark:text-classic-text-secondary-dark">{item.job.company} - {item.job.location}</p>
                        <p className="text-sm text-classic-text-secondary dark:text-classic-text-secondary-dark mt-1">Applied on: {item.appliedDate}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                     <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20"
                        aria-label="Delete application"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                    <ChevronDownIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-screen' : 'max-h-0'}`}>
                <div className="border-t border-classic-border dark:border-classic-border-dark p-4 sm:p-6 space-y-6 bg-classic-bg dark:bg-classic-bg-dark">
                    <div>
                        <h4 className="font-semibold font-serif text-classic-text-primary dark:text-classic-text-primary-dark mb-2">Job Description</h4>
                        <p className="text-sm text-classic-text-secondary dark:text-classic-text-secondary-dark whitespace-pre-wrap font-mono bg-white dark:bg-black/20 p-3 rounded-md border border-classic-border dark:border-classic-border-dark">{item.job.description}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold font-serif text-classic-text-primary dark:text-classic-text-primary-dark mb-2">Generated Resume</h4>
                        <div className="text-sm text-classic-text-secondary dark:text-classic-text-secondary-dark bg-white dark:bg-black/20 p-3 rounded-md border border-classic-border dark:border-classic-border-dark">
                          {typeof item.generatedResume === 'string' ? (
                                <p className="whitespace-pre-wrap font-mono">{item.generatedResume}</p>
                            ) : (
                                <ResumeDisplay resume={item.generatedResume} />
                            )}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold font-serif text-classic-text-primary dark:text-classic-text-primary-dark mb-2">Generated Cover Letter</h4>
                        <p className="text-sm text-classic-text-secondary dark:text-classic-text-secondary-dark whitespace-pre-wrap font-mono bg-white dark:bg-black/20 p-3 rounded-md border border-classic-border dark:border-classic-border-dark">{item.generatedCoverLetter}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

const Dashboard: React.FC<DashboardProps> = ({ jobs, onDelete, onBack }) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [currentApiKey, setCurrentApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        try { const storedKey = localStorage.getItem('geminiApiKey') || ''; setCurrentApiKey(storedKey); } catch (e) { console.error("Failed to read API key from localStorage", e); }
    }, []);

    const handleSaveKey = () => {
        if (!currentApiKey.trim()) { setSaveMessage('API Key cannot be empty.'); setTimeout(() => setSaveMessage(''), 3000); return; }
        try { localStorage.setItem('geminiApiKey', currentApiKey); setSaveMessage('API Key saved successfully!'); setTimeout(() => setSaveMessage(''), 3000); } catch (e) {
            setSaveMessage('Failed to save API Key.'); console.error("Failed to save API key", e);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm(`Are you sure you want to delete this application?`)) {
            setDeletingId(id); setTimeout(() => { onDelete(id); setDeletingId(null); }, 300);
        }
    };

    const commonInputClasses = "block w-full rounded-md bg-classic-surface dark:bg-classic-surface-dark text-classic-text-primary dark:text-classic-text-primary-dark border-classic-border dark:border-classic-border-dark shadow-sm focus:border-classic-primary-focus focus:ring focus:ring-classic-primary-focus focus:ring-opacity-20 transition-colors pr-10";
    const classicLabelClasses = "block text-sm font-semibold tracking-wide text-classic-text-secondary dark:text-classic-text-secondary-dark uppercase";

    return (
        <div className="max-w-4xl mx-auto animate-fadeInUp">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-classic-text-primary dark:text-classic-text-primary-dark font-serif">Dashboard</h1>
                <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 font-semibold text-classic-primary dark:text-primary-400 rounded-lg hover:bg-gray-200/50 dark:hover:bg-classic-surface-dark transition-colors">
                    <ArrowLeftIcon className="w-5 h-5"/> Back to App
                </button>
            </div>

            <div className="mb-8">
                <InputSection title="API Key Management" icon={<KeyIcon className="w-6 h-6 text-classic-primary dark:text-primary-400" />}>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-300 p-4 rounded-r-lg mb-4 flex gap-3 items-start">
                        <ExclamationTriangleIcon className="w-8 h-8 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold font-serif">Security Warning</h4>
                            <p className="text-sm">Storing your API key in the browser is insecure and only intended for demonstration. For production apps, always handle API keys on a secure backend server.</p>
                        </div>
                    </div>
                    <div>
                        <label className={classicLabelClasses}>Gemini API Key</label>
                        <div className="relative mt-1">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={currentApiKey}
                                onChange={e => setCurrentApiKey(e.target.value)}
                                className={commonInputClasses}
                                placeholder="Enter your Gemini API Key"
                            />
                            <button onClick={() => setShowKey(!showKey)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label={showKey ? 'Hide API Key' : 'Show API Key'}>
                                {showKey ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 flex-wrap gap-4">
                        <button onClick={handleSaveKey} className="px-5 py-2 bg-classic-primary text-white font-semibold rounded-md hover:bg-opacity-90 disabled:bg-gray-400 transition-colors">
                            Save Key
                        </button>
                         {saveMessage && <p className={`text-sm transition-opacity duration-300 ${saveMessage.includes('Failed') || saveMessage.includes('empty') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{saveMessage}</p>}
                    </div>
                </InputSection>
            </div>
            
            <h2 className="text-3xl font-bold text-classic-text-primary dark:text-classic-text-primary-dark mb-6 font-serif">Applied Jobs</h2>

            {jobs.length === 0 ? (
                <div className="text-center p-12 bg-classic-surface dark:bg-classic-surface-dark rounded-lg border border-classic-border dark:border-classic-border-dark">
                    <FileTextIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" />
                    <h2 className="mt-4 text-2xl font-bold font-serif text-classic-text-primary dark:text-classic-text-primary-dark">No applications tracked yet.</h2>
                    <p className="mt-2 text-classic-text-secondary dark:text-classic-text-secondary-dark">Generate materials for a job and click "Mark as Applied" to add it here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.map((job, index) => (
                        <div key={job.id} className="stagger-child" style={{animationDelay: `${index * 100}ms`}}>
                            <AppliedJobItem
                                item={job}
                                onDelete={() => handleDelete(job.id)}
                                isDeleting={deletingId === job.id}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;