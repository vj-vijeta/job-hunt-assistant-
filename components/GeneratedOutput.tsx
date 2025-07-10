
import React, { useState, useEffect, useCallback } from 'react';
import type { GeneratedData, GroundingChunk, JobMatchAnalysis, StructuredResume, StructuredResumeExperience } from '../types';
import { CheckBadgeIcon, DownloadIcon, ChevronDownIcon, LightbulbIcon, FileTextIcon } from './icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

interface GeneratedOutputProps {
  data: GeneratedData | null;
  isLoading: boolean;
  error: string | null;
  onMarkAsApplied?: () => void;
  canMarkAsApplied: boolean;
  selectedJobTitle: string | null;
  jobUrl?: string;
}

type Tab = 'resume' | 'coverLetter' | 'insights' | 'jobMatch';

const commonInputClasses = "block w-full rounded-md bg-classic-bg dark:bg-classic-bg-dark text-classic-text-primary dark:text-classic-text-primary-dark border-classic-border dark:border-classic-border-dark shadow-sm focus:border-classic-primary-focus focus:ring focus:ring-classic-primary-focus focus:ring-opacity-20 transition-colors text-sm";
const classicLabelClasses = "block text-xs font-semibold tracking-wide text-classic-text-secondary dark:text-classic-text-secondary-dark uppercase";

const PageContainer: React.FC<{children: React.ReactNode}> = ({children}) => (
    <div className="bg-white dark:bg-classic-surface-dark p-6 sm:p-8 rounded-lg border border-gray-200 dark:border-classic-border-dark shadow-md">
        {children}
    </div>
);

const ResumeEditor: React.FC<{ resume: StructuredResume, setResume: (r: StructuredResume) => void }> = ({ resume, setResume }) => {
    
    const handleFieldChange = <K extends keyof StructuredResume>(field: K, value: StructuredResume[K]) => {
        setResume({ ...resume, [field]: value });
    };

    const handleExperienceChange = <K extends keyof StructuredResumeExperience>(index: number, field: K, value: StructuredResumeExperience[K]) => {
        const newExperiences = [...resume.experiences];
        newExperiences[index] = { ...newExperiences[index], [field]: value };
        setResume({ ...resume, experiences: newExperiences });
    };

    const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setResume({ ...resume, skills: e.target.value.split(',').map(s => s.trim()) });
    };

    return (
        <PageContainer>
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-classic-text-primary dark:text-classic-text-primary-dark font-serif text-center">Edit Resume</h3>
                
                <div className="p-4 rounded-lg bg-classic-bg dark:bg-classic-bg-dark border border-classic-border dark:border-classic-border-dark">
                    <label className={classicLabelClasses}>Full Name</label>
                    <input type="text" value={resume.name} onChange={e => handleFieldChange('name', e.target.value)} className={commonInputClasses} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-classic-bg dark:bg-classic-bg-dark border border-classic-border dark:border-classic-border-dark">
                        <label className={classicLabelClasses}>Email</label>
                        <input type="email" value={resume.email} onChange={e => handleFieldChange('email', e.target.value)} className={commonInputClasses} />
                    </div>
                    <div className="p-4 rounded-lg bg-classic-bg dark:bg-classic-bg-dark border border-classic-border dark:border-classic-border-dark">
                        <label className={classicLabelClasses}>Phone</label>
                        <input type="tel" value={resume.phone} onChange={e => handleFieldChange('phone', e.target.value)} className={commonInputClasses} />
                    </div>
                    <div className="p-4 rounded-lg bg-classic-bg dark:bg-classic-bg-dark border border-classic-border dark:border-classic-border-dark">
                        <label className={classicLabelClasses}>Website/Portfolio</label>
                        <input type="url" value={resume.website} onChange={e => handleFieldChange('website', e.target.value)} className={commonInputClasses} />
                    </div>
                    <div className="p-4 rounded-lg bg-classic-bg dark:bg-classic-bg-dark border border-classic-border dark:border-classic-border-dark">
                        <label className={classicLabelClasses}>Address</label>
                        <input type="text" value={resume.address} onChange={e => handleFieldChange('address', e.target.value)} className={commonInputClasses} />
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-classic-bg dark:bg-classic-bg-dark border border-classic-border dark:border-classic-border-dark">
                    <label className={classicLabelClasses}>Professional Summary</label>
                    <textarea value={resume.summary} onChange={e => handleFieldChange('summary', e.target.value)} rows={4} className={commonInputClasses} />
                </div>
                
                <div>
                    <h4 className="font-semibold text-classic-text-primary dark:text-classic-text-primary-dark mb-2 text-center font-serif text-lg">Work Experience</h4>
                    <div className="space-y-4">
                        {resume.experiences.map((exp, index) => (
                            <div key={index} className="p-4 border border-classic-border dark:border-classic-border-dark rounded-lg bg-classic-bg dark:bg-classic-bg-dark">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                    <div>
                                        <label className={classicLabelClasses}>Role</label>
                                        <input type="text" value={exp.role} onChange={e => handleExperienceChange(index, 'role', e.target.value)} className={commonInputClasses} />
                                    </div>
                                     <div>
                                        <label className={classicLabelClasses}>Company</label>
                                        <input type="text" value={exp.company} onChange={e => handleExperienceChange(index, 'company', e.target.value)} className={commonInputClasses} />
                                    </div>
                                </div>
                                <div>
                                    <label className={classicLabelClasses}>Dates</label>
                                    <input type="text" value={exp.dates} onChange={e => handleExperienceChange(index, 'dates', e.target.value)} className={commonInputClasses} />
                                </div>
                                <div className="mt-2">
                                    <label className={classicLabelClasses}>Description (one bullet point per line)</label>
                                    <textarea value={exp.description} onChange={e => handleExperienceChange(index, 'description', e.target.value)} rows={5} className={commonInputClasses} placeholder="- Led the migration of a legacy app...&#10;- Increased user engagement by 20%..."/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                 <div className="p-4 rounded-lg bg-classic-bg dark:bg-classic-bg-dark border border-classic-border dark:border-classic-border-dark">
                    <label className={classicLabelClasses}>Skills (comma-separated)</label>
                    <textarea value={resume.skills.join(', ')} onChange={handleSkillsChange} rows={3} className={commonInputClasses} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-classic-bg dark:bg-classic-bg-dark border border-classic-border dark:border-classic-border-dark">
                        <label className={classicLabelClasses}>Education</label>
                        <input type="text" value={resume.education} onChange={e => handleFieldChange('education', e.target.value)} className={commonInputClasses} />
                    </div>
                    <div className="p-4 rounded-lg bg-classic-bg dark:bg-classic-bg-dark border border-classic-border dark:border-classic-border-dark">
                        <label className={classicLabelClasses}>Certifications</label>
                        <input type="text" value={resume.certifications} onChange={e => handleFieldChange('certifications', e.target.value)} className={commonInputClasses} />
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};

const CoverLetterEditor: React.FC<{ content: string, setContent: (c: string) => void }> = ({ content, setContent }) => (
    <PageContainer>
        <h3 className="text-xl font-bold text-classic-text-primary dark:text-classic-text-primary-dark font-serif mb-4 text-center">Edit Cover Letter</h3>
        <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={25}
            className="w-full p-2 bg-transparent focus:ring-0 border-none text-base leading-relaxed text-classic-text-primary dark:text-classic-text-primary-dark"
        />
    </PageContainer>
);


const InsightsDisplay: React.FC<{ text: string; sources: GroundingChunk[]; jobUrl?: string; }> = ({ text, sources, jobUrl }) => (
  <PageContainer>
     <div className="prose prose-headings:font-serif prose-headings:text-classic-text-primary prose-p:text-classic-text-primary dark:prose-headings:text-classic-text-primary-dark dark:prose-p:text-classic-text-primary-dark max-w-none">
        <div className="whitespace-pre-wrap font-sans">{text}</div>
        {sources.length > 0 && (
          <div className="mt-8">
            <h4 className="font-semibold font-serif text-lg mb-2">Sources</h4>
            <ul className="list-disc list-inside space-y-2">
              {sources.map((source, index) => (
                <li key={index}>
                  <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-classic-primary dark:text-primary-400 hover:underline">
                    {source.web.title || source.web.uri}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {jobUrl && jobUrl !== '#' && (
            <div className="mt-8 pt-6 border-t border-classic-border dark:border-classic-border-dark text-center">
            <a
                href={jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-classic-primary text-white font-semibold rounded-md hover:bg-opacity-90 transition-colors"
            >
                Apply for this Job
            </a>
            </div>
        )}
     </div>
  </PageContainer>
);

const RadialProgress: React.FC<{ score: number }> = ({ score }) => {
    const [displayScore, setDisplayScore] = useState(0);
    const size = 120; const strokeWidth = 10; const center = size / 2; const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        let startTime: number; const duration = 1000;
        const animationFrame = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const currentVal = Math.min(Math.round((progress / duration) * score), score);
            setDisplayScore(currentVal);
            if (progress < duration) { requestAnimationFrame(animationFrame); }
        };
        requestAnimationFrame(animationFrame);
    }, [score]);

    const offset = circumference - (displayScore / 100) * circumference;
    const scoreColor = displayScore > 75 ? 'text-green-600' : displayScore > 50 ? 'text-amber-500' : 'text-red-600';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle className="text-gray-200 dark:text-gray-700" stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={center} cy={center} />
                <circle className={scoreColor} stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" fill="transparent" r={radius} cx={center} cy={center} style={{ transition: 'stroke-dashoffset 0.3s linear' }} />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${scoreColor}`}>
                {displayScore}
            </span>
        </div>
    );
};

const AnalysisDisplay: React.FC<{ analysis: JobMatchAnalysis }> = ({ analysis }) => (
    <PageContainer>
        <div className="flex flex-col items-center text-center">
            <h3 className="text-2xl font-bold text-classic-text-primary dark:text-classic-text-primary-dark mb-2 font-serif">Job Match Analysis</h3>
            <RadialProgress score={analysis.matchScore} />
            <p className="mt-4 text-classic-text-secondary dark:text-classic-text-secondary-dark max-w-prose">{analysis.summary}</p>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-semibold font-serif text-lg text-green-700 dark:text-green-500 mb-2">Strengths</h4>
                <ul className="list-disc list-inside space-y-2 text-classic-text-primary dark:text-classic-text-primary-dark">
                    {analysis.strengths.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>
            <div>
                <h4 className="font-semibold font-serif text-lg text-red-700 dark:text-red-500 mb-2">Potential Gaps</h4>
                <ul className="list-disc list-inside space-y-2 text-classic-text-primary dark:text-classic-text-primary-dark">
                    {analysis.weaknesses.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>
        </div>
    </PageContainer>
);

const robustHandleDownloadPdf = async (elementId: string, fileName: string) => {
    const input = document.getElementById(elementId);
    if (!input) {
        console.error(`Element with ID ${elementId} not found.`);
        return;
    }
    
    // Use a temporary clone to ensure all content is visible for capture
    const clone = input.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.left = '0';
    clone.style.top = '0';
    clone.style.zIndex = '-9999';
    clone.style.height = 'auto'; // Let it expand to its full height
    clone.style.width = input.style.width;
    document.body.appendChild(clone);
    
    try {
        const canvas = await html2canvas(clone, {
            scale: 2, // Higher resolution
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        document.body.removeChild(clone); // Clean up the clone
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const ratio = pdfWidth / canvasWidth;
        const imgHeight = canvasHeight * ratio;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(fileName);
    } catch(err) {
        console.error("Failed to generate PDF:", err);
        if (document.body.contains(clone)) {
            document.body.removeChild(clone);
        }
    }
};


const GeneratedOutput: React.FC<GeneratedOutputProps> = ({ data, isLoading, error, onMarkAsApplied, canMarkAsApplied, selectedJobTitle, jobUrl }) => {
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const [isSwitching, setIsSwitching] = useState(false);

  const [editableResume, setEditableResume] = useState<StructuredResume | null>(null);
  const [editableCoverLetter, setEditableCoverLetter] = useState<string>('');
  const [showResumeDownloadMenu, setShowResumeDownloadMenu] = useState(false);
  const [showCoverLetterDownloadMenu, setShowCoverLetterDownloadMenu] = useState(false);
  
  useEffect(() => { 
    if (data) { 
        setEditableResume(data.resume);
        setEditableCoverLetter(data.coverLetter);
        setActiveTab('resume'); 
    }
  }, [data]);

  const handleTabClick = (tab: Tab) => {
    if (tab === activeTab) return;
    setIsSwitching(true);
    setTimeout(() => { setActiveTab(tab); setIsSwitching(false); }, 150);
  }

  const handleDownloadResumeDocx = useCallback(() => {
    if (!editableResume) return;
    
    const doc = new Document({
        styles: {
            paragraphStyles: [
                { id: "heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Lora" }, paragraph: { spacing: { after: 240 } } },
                { id: "heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, color: "4F81BD", font: "Lora" }, paragraph: { spacing: { before: 240, after: 120 } } },
            ]
        },
        sections: [{
            children: [
                new Paragraph({ text: editableResume.name, heading: HeadingLevel.HEADING_1 }),
                new Paragraph({
                    children: [
                        new TextRun(editableResume.email),
                        new TextRun(" | "),
                        new TextRun(editableResume.phone),
                        new TextRun(" | "),
                        new TextRun(editableResume.website),
                        new TextRun(" | "),
                        new TextRun(editableResume.address),
                    ]
                }),
                new Paragraph({ text: "Professional Summary", heading: HeadingLevel.HEADING_2 }),
                new Paragraph(editableResume.summary),
                new Paragraph({ text: "Work Experience", heading: HeadingLevel.HEADING_2 }),
                ...editableResume.experiences.flatMap(exp => [
                    new Paragraph({
                        children: [
                            new TextRun({ text: exp.role, bold: true }),
                            new TextRun({ text: ` | ${exp.company}`, italics: true }),
                            new TextRun({ text: ` | ${exp.dates}`, italics: true }),
                        ]
                    }),
                    ...exp.description.split('\n').map(d => new Paragraph({ text: d.replace(/^- /, ''), bullet: { level: 0 } }))
                ]),
                new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_2 }),
                new Paragraph(editableResume.skills.join(', ')),
                new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_2 }),
                new Paragraph(editableResume.education),
                new Paragraph({ text: "Certifications", heading: HeadingLevel.HEADING_2 }),
                new Paragraph(editableResume.certifications),
            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "resume.docx";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
    setShowResumeDownloadMenu(false);
  }, [editableResume]);
  
  const handleDownloadCoverLetterDocx = useCallback(() => {
    if (!editableCoverLetter) return;
    const doc = new Document({
      sections: [{
        children: editableCoverLetter.split('\n').map(p => new Paragraph(p)),
      }],
    });

    Packer.toBlob(doc).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cover-letter.docx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
    setShowCoverLetterDownloadMenu(false);
  }, [editableCoverLetter]);


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          {selectedJobTitle && (
            <div className="mb-6 animate-fadeInUp">
              <p className="text-classic-text-secondary dark:text-classic-text-secondary-dark">Generating for:</p>
              <h3 className="text-xl font-bold text-classic-text-primary dark:text-classic-text-primary-dark font-serif">{selectedJobTitle}</h3>
            </div>
          )}
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-classic-primary"></div>
          <p className="mt-4 text-classic-text-secondary dark:text-classic-text-secondary-dark">Crafting your tailored documents...</p>
        </div>
      );
    }
    if (error) { return <div className="p-6 text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded-lg">{error}</div>; }
    if (!data || !editableResume) {
      return (
        <div className="p-12 text-center text-classic-text-secondary dark:text-classic-text-secondary-dark">
            <div className="p-8 bg-white dark:bg-classic-surface-dark rounded-lg border border-gray-200 dark:border-classic-border-dark shadow-md">
                <FileTextIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600"/>
                <h3 className="text-xl font-semibold font-serif mt-4 text-classic-text-primary dark:text-classic-text-primary-dark">Your tailored documents will appear here.</h3>
                <p>Fill out the forms on the left and click "Generate" to start.</p>
            </div>
        </div>
      );
    }
    const contentMap: Record<Tab, React.ReactNode> = {
        'resume': <ResumeEditor resume={editableResume} setResume={setEditableResume} />,
        'coverLetter': <CoverLetterEditor content={editableCoverLetter} setContent={setEditableCoverLetter} />,
        'insights': data.companyInsights ? <InsightsDisplay text={data.companyInsights.text} sources={data.companyInsights.sources} jobUrl={jobUrl} /> : <div className="p-6">Could not retrieve company insights.</div>,
        'jobMatch': data.jobMatchAnalysis ? <AnalysisDisplay analysis={data.jobMatchAnalysis} /> : <div className="p-6">Could not retrieve job match analysis.</div>
    };
    return contentMap[activeTab] || null;
  };

  const TabButton:React.FC<{tabName: Tab, label: string, icon?: React.ReactNode}> = ({tabName, label, icon}) => (
    <button
        onClick={() => handleTabClick(tabName)}
        disabled={!data && !isLoading}
        className={`px-4 py-2 text-sm md:text-base font-semibold transition-all duration-200 flex items-center gap-2 border-b-2 ${
            activeTab === tabName
            ? 'border-classic-primary text-classic-primary dark:text-primary-400'
            : 'text-classic-text-secondary dark:text-classic-text-secondary-dark border-transparent hover:border-gray-300 dark:hover:border-gray-600'
        } ${(!data && !isLoading) ? 'cursor-not-allowed opacity-50' : ''}`}
    >
        {icon} {label}
    </button>
  )

  return (
    <>
      {editableResume && <PrintableResume resume={editableResume} />}
      {editableCoverLetter && editableResume && <PrintableCoverLetter content={editableCoverLetter} name={editableResume.name} />}
      <div className="bg-classic-surface dark:bg-classic-surface-dark/80 backdrop-blur-sm border border-classic-border dark:border-classic-border-dark rounded-lg h-full flex flex-col">
        <div className="p-2 border-b border-classic-border dark:border-classic-border-dark flex justify-between items-center flex-wrap">
          <div className="flex items-center justify-start flex-wrap gap-2">
            <TabButton tabName="resume" label="Resume" />
            <TabButton tabName="coverLetter" label="Cover Letter" />
            <TabButton tabName="insights" label="Insights" icon={<LightbulbIcon className="w-5 h-5"/>} />
            {data?.jobMatchAnalysis && <TabButton tabName="jobMatch" label="Job Match" icon={<CheckBadgeIcon className="w-5 h-5"/>} />}
          </div>
           {data && (
            <div className="relative">
             {activeTab === 'resume' && (
              <button
                onClick={() => setShowResumeDownloadMenu(!showResumeDownloadMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-classic-primary dark:text-primary-400 rounded-md hover:bg-gray-200/50 dark:hover:bg-classic-surface-dark transition-colors"
                aria-label="Download resume"
              >
                <DownloadIcon className="w-4 h-4" /> Download <ChevronDownIcon className={`w-4 h-4 transition-transform ${showResumeDownloadMenu ? 'rotate-180' : ''}`} />
              </button>
             )}
              {activeTab === 'coverLetter' && (
              <button
                onClick={() => setShowCoverLetterDownloadMenu(!showCoverLetterDownloadMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-classic-primary dark:text-primary-400 rounded-md hover:bg-gray-200/50 dark:hover:bg-classic-surface-dark transition-colors"
                aria-label="Download cover letter"
              >
                <DownloadIcon className="w-4 h-4" /> Download <ChevronDownIcon className={`w-4 h-4 transition-transform ${showCoverLetterDownloadMenu ? 'rotate-180' : ''}`} />
              </button>
             )}
              {showResumeDownloadMenu && (
                <div onMouseLeave={() => setShowResumeDownloadMenu(false)} className="absolute right-0 mt-2 w-32 origin-top-right rounded-md shadow-lg bg-classic-surface dark:bg-classic-surface-dark ring-1 ring-black ring-opacity-5 z-20">
                  <div className="py-1">
                    <button onClick={() => { robustHandleDownloadPdf('resume-for-pdf', 'resume.pdf'); setShowResumeDownloadMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-classic-text-primary dark:text-classic-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer">PDF</button>
                    <button onClick={handleDownloadResumeDocx} className="block w-full text-left px-4 py-2 text-sm text-classic-text-primary dark:text-classic-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer">DOCX</button>
                  </div>
                </div>
              )}
               {showCoverLetterDownloadMenu && (
                <div onMouseLeave={() => setShowCoverLetterDownloadMenu(false)} className="absolute right-0 mt-2 w-32 origin-top-right rounded-md shadow-lg bg-classic-surface dark:bg-classic-surface-dark ring-1 ring-black ring-opacity-5 z-20">
                  <div className="py-1">
                    <button onClick={() => { robustHandleDownloadPdf('cover-letter-for-pdf', 'cover-letter.pdf'); setShowCoverLetterDownloadMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-classic-text-primary dark:text-classic-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer">PDF</button>
                    <button onClick={handleDownloadCoverLetterDocx} className="block w-full text-left px-4 py-2 text-sm text-classic-text-primary dark:text-classic-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer">DOCX</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={`p-4 flex-grow overflow-y-auto transition-opacity duration-150 ${isSwitching ? 'opacity-0' : 'opacity-100'}`}>
          {renderContent()}
        </div>
        {data && onMarkAsApplied && (
          <div className="p-4 border-t border-classic-border dark:border-classic-border-dark">
            <button
              onClick={onMarkAsApplied}
              disabled={!canMarkAsApplied}
              className="w-full px-4 py-2.5 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              Mark as Applied & Add to Dashboard
            </button>
            {!canMarkAsApplied && <p className="text-xs text-center mt-2 text-classic-text-secondary dark:text-classic-text-secondary-dark">You must select a job from the search results to add it to the dashboard.</p>}
          </div>
        )}
      </div>
    </>
  );
};

// Hidden component styled for PDF generation
const PrintableResume: React.FC<{ resume: StructuredResume }> = ({ resume }) => (
  <div id="resume-for-pdf" style={{ position: 'absolute', zIndex: -9999, left: '0px', top: '0px', width: '210mm', backgroundColor: 'white', color: 'black', fontFamily: 'Garamond, serif', fontSize: '12pt', padding: '20mm' }}>
      <style>{`
          #resume-for-pdf h1, #resume-for-pdf h2, #resume-for-pdf h3 { font-family: 'Garamond', serif; color: #111; }
          #resume-for-pdf h1 { font-size: 24pt; text-align: center; margin-bottom: 4px; letter-spacing: 2px; text-transform: uppercase; }
          #resume-for-pdf p.contact { text-align: center; font-size: 10pt; margin-bottom: 12px; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
          #resume-for-pdf h2 { font-size: 14pt; border-bottom: 2px solid #333; padding-bottom: 2px; margin-top: 16px; margin-bottom: 8px; }
          #resume-for-pdf p { margin: 0; line-height: 1.4; }
          #resume-for-pdf ul { margin: 0; padding-left: 18px; }
          #resume-for-pdf li { margin-bottom: 4px; line-height: 1.4; }
          #resume-for-pdf .exp-heading { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px; }
      `}</style>
      <h1>{resume.name}</h1>
      <p className="contact">
          {resume.email} | {resume.phone} | {resume.website} | {resume.address}
      </p>

      <h2>PROFESSIONAL SUMMARY</h2>
      <p>{resume.summary}</p>
      
      <h2>WORK EXPERIENCE</h2>
      {resume.experiences.map((exp, i) => (
          <div key={i} style={{ marginBottom: '12px' }}>
              <div className="exp-heading">
                  <span><strong>{exp.role}</strong>, <em>{exp.company}</em></span>
                  <span>{exp.dates}</span>
              </div>
              <ul>
                  {exp.description.split('\n').map((line, j) => line.trim() && <li key={j}>{line.trim().replace(/^- /, '')}</li>)}
              </ul>
          </div>
      ))}

      <h2>SKILLS</h2>
      <p>{resume.skills.join(' • ')}</p>

      <h2>EDUCATION</h2>
      <p>{resume.education}</p>
      
      <h2>CERTIFICATIONS</h2>
      <p>{resume.certifications}</p>
  </div>
);

const PrintableCoverLetter: React.FC<{ content: string; name: string }> = ({ content, name }) => (
  <div id="cover-letter-for-pdf" style={{ position: 'absolute', zIndex: -9999, left: '0px', top: '0px', width: '210mm', backgroundColor: 'white', color: 'black', fontFamily: 'Garamond, serif', fontSize: '12pt', padding: '20mm' }}>
    <style>{'#cover-letter-for-pdf p { white-space: pre-wrap; margin-bottom: 1em; line-height: 1.5; }'}</style>
    <h1 style={{fontSize: '20pt', marginBottom: '24px', borderBottom: '1px solid #333', paddingBottom: '8px'}}>{name}</h1>
    {content.split('\n').map((p, i) => <p key={i}>{p || ' '}</p>)}
  </div>
);


export default GeneratedOutput;