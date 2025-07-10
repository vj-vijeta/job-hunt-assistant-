import React from 'react';

interface InputSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  titleAction?: React.ReactNode;
}

const InputSection: React.FC<InputSectionProps> = ({ title, icon, children, titleAction }) => {
  return (
    <div className="bg-classic-surface dark:bg-classic-surface-dark rounded-lg border border-classic-border dark:border-classic-border-dark p-6 mb-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-classic-border dark:border-classic-border-dark">
        <div className="flex items-center">
            <div className="bg-primary-100 dark:bg-classic-primary/20 p-2 rounded-lg mr-4">
            {icon}
            </div>
            <h2 className="text-2xl font-bold text-classic-text-primary dark:text-classic-text-primary-dark font-serif">{title}</h2>
        </div>
        {titleAction}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
};

export default InputSection;