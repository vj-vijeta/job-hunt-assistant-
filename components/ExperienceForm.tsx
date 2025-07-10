
import React from 'react';
import type { Experience } from '../types';
import { PlusCircleIcon, TrashIcon } from './icons';

interface ExperienceFormProps {
  experiences: Experience[];
  setExperiences: React.Dispatch<React.SetStateAction<Experience[]>>;
}

const ExperienceForm: React.FC<ExperienceFormProps> = ({ experiences, setExperiences }) => {
  const addExperience = () => {
    setExperiences([
      ...experiences,
      { id: Date.now().toString(), company: '', role: '', startDate: '', endDate: '', responsibilities: '' },
    ]);
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const handleChange = <K extends keyof Experience>(id: string, field: K, value: Experience[K]) => {
    setExperiences(
      experiences.map(exp => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  const commonInputClasses = "mt-1 block w-full rounded-md bg-classic-surface dark:bg-classic-surface-dark text-classic-text-primary dark:text-classic-text-primary-dark border-classic-border dark:border-classic-border-dark shadow-sm focus:border-classic-primary-focus focus:ring focus:ring-classic-primary-focus focus:ring-opacity-20 transition-colors";
  const classicLabelClasses = "block text-sm font-semibold tracking-wide text-classic-text-secondary dark:text-classic-text-secondary-dark uppercase";


  return (
    <div className="space-y-6">
      {experiences.map((exp, index) => (
        <div key={exp.id} className="p-4 border border-classic-border dark:border-classic-border-dark rounded-lg relative bg-classic-bg dark:bg-classic-bg-dark">
          <h3 className="font-semibold text-lg mb-4 text-classic-text-primary dark:text-classic-text-primary-dark font-serif">Experience #{index + 1}</h3>
          
          <button
            onClick={() => removeExperience(exp.id)}
            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            aria-label="Remove experience"
          >
            <TrashIcon className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className={classicLabelClasses}>Role / Title</label>
              <input type="text" value={exp.role} onChange={e => handleChange(exp.id, 'role', e.target.value)} className={commonInputClasses} placeholder="e.g., Senior Frontend Developer" />
            </div>
            <div>
              <label className={classicLabelClasses}>Company</label>
              <input type="text" value={exp.company} onChange={e => handleChange(exp.id, 'company', e.target.value)} className={commonInputClasses} placeholder="e.g., Acme Inc." />
            </div>
            <div>
              <label className={classicLabelClasses}>Start Date</label>
              <input type="text" value={exp.startDate} onChange={e => handleChange(exp.id, 'startDate', e.target.value)} className={commonInputClasses} placeholder="e.g., Jan 2020" />
            </div>
            <div>
              <label className={classicLabelClasses}>End Date</label>
              <input type="text" value={exp.endDate} onChange={e => handleChange(exp.id, 'endDate', e.target.value)} className={commonInputClasses} placeholder="e.g., Present" />
            </div>
          </div>
          <div className="mt-4">
            <label className={classicLabelClasses}>Responsibilities & Achievements</label>
            <textarea
              value={exp.responsibilities}
              onChange={e => handleChange(exp.id, 'responsibilities', e.target.value)}
              rows={4}
              className={commonInputClasses}
              placeholder="Describe your key responsibilities and accomplishments in this role."
            />
          </div>
        </div>
      ))}
      <button
        onClick={addExperience}
        className="flex items-center gap-2 text-classic-primary dark:text-primary-400 hover:opacity-80 font-semibold transition-colors"
      >
        <PlusCircleIcon className="w-5 h-5" />
        Add Experience
      </button>
    </div>
  );
};

export default ExperienceForm;