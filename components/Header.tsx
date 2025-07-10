import React from 'react';
import { WandSparklesIcon } from './icons';

const Header = () => (
  <header className="text-center p-6 border-b border-classic-border dark:border-classic-border-dark mb-8 animate-fadeInUp">
    <div className="flex items-center justify-center gap-4">
      <div className="animate-fadeInUp" style={{ animationDelay: '200ms' }}>
        <WandSparklesIcon className="w-12 h-12 text-classic-primary dark:text-primary-400"/>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-classic-text-primary dark:text-classic-text-primary-dark font-serif">
        AI Job Application Assistant
      </h1>
    </div>
    <p className="mt-4 text-lg text-classic-text-secondary dark:text-classic-text-secondary-dark">
      Crafting professional resumes and cover letters with precision.
    </p>
  </header>
);

export default Header;