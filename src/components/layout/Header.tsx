import React from 'react';
import { Menu, Plus, Wifi, WifiOff, Download, RefreshCw } from 'lucide-react';
import { usePlanner } from '../../context/usePlanner';
import { usePwa } from '../../hooks/usePwa';
import type { NavSection } from '../../types';

const SECTION_TITLES: Record<NavSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Overview',
    subtitle: 'Your study summary and term progress',
  },
  courses: {
    title: 'Courses',
    subtitle: 'Your subjects, credits, and target grades',
  },
  assessments: {
    title: 'Exams & Tasks',
    subtitle: 'Quizzes, midterms, assignments & finals',
  },
  results: {
    title: 'Grade Analytics',
    subtitle: 'Marks breakdown and academic performance',
  },
  'gpa-calculator': {
    title: 'GPA Calculator',
    subtitle: 'Calculate your term GPA and target CGPA',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Grading scale, profile, and system settings',
  },
};


export const Header: React.FC = () => {
  const { activeSection, toggleSidebar, settings, openAddCourseModal, openInstallModal } = usePlanner();
  const { isOnline, isInstallable, isInstalled, hasUpdate, promptInstall, applyUpdate } = usePwa();

  const currentMeta = SECTION_TITLES[activeSection] || {
    title: 'Dashboard',
    subtitle: 'Academic planning workspace',
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="header-title-wrap">
          <h1 className="header-title">{currentMeta.title}</h1>
          <span className="header-subtitle">{currentMeta.subtitle}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Offline / Online Status Indicator */}
        <div
          className={`network-status-pill ${isOnline ? 'online' : 'offline'}`}
          role="status"
          aria-live="polite"
          title={
            isOnline
              ? 'Online: UniPlanner is connected. Local changes are saved in this browser.'
              : 'Offline Mode: UniPlanner is running completely offline with local storage.'
          }
        >
          {isOnline ? (
            <>
              <Wifi size={13} className="network-icon" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff size={13} className="network-icon" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Update Available notification */}
        {hasUpdate && (
          <button
            type="button"
            className="pwa-update-btn"
            onClick={applyUpdate}
            title="A new application update is ready. Click to refresh."
          >
            <RefreshCw size={13} />
            <span>Update Ready</span>
          </button>
        )}

        {/* Install PWA button when not installed */}
        {!isInstalled && (
          <button
            type="button"
            className="pwa-install-btn"
            onClick={async () => {
              if (isInstallable) {
                const outcome = await promptInstall();
                if (outcome === 'unsupported') {
                  openInstallModal();
                }
              } else {
                openInstallModal();
              }
            }}
            title="Install UniPlanner for offline standalone mobile or desktop use"
          >
            <Download size={14} />
            <span>Install App</span>
          </button>
        )}

        <div className="term-indicator-pill">
          <span className="indicator-dot" />
          <span>{settings.currentTerm || 'Current Term'}</span>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => openAddCourseModal()}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Course</span>
        </button>
      </div>
    </header>
  );
};
