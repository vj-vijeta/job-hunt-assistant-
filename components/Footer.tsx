import React from 'react';

const Footer = () => (
  <footer className="text-center py-8 mt-16 border-t border-classic-border dark:border-classic-border-dark text-sm text-classic-text-secondary dark:text-classic-text-secondary-dark animate-fadeInUp" style={{ animationDelay: '800ms' }}>
    <p> Copyright vijeta &copy; {new Date().getFullYear()} AI Job Application Assistant. All Rights Reserved.</p>
    <p className="mt-2"></p>
  </footer>
);

export default Footer;
