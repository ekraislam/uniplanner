import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <span className="app-footer-title">UniPlanner</span>
        <span className="app-footer-sep" aria-hidden="true">•</span>
        <span className="app-footer-copy">© 2026 UniPlanner</span>
        <span className="app-footer-sep" aria-hidden="true">•</span>
        <span className="app-footer-author">Designed & Developed by Ohi</span>
      </div>
    </footer>
  );
};
