import React from 'react';
import { Menu, Plus, Wifi, WifiOff, Download, RefreshCw, Globe } from 'lucide-react';
import { usePlanner } from '../../context/usePlanner';
import { usePwa } from '../../hooks/usePwa';
import type { NavSection } from '../../types';

export const Header: React.FC = () => {
  const {
    activeSection,
    toggleSidebar,
    settings,
    openAddCourseModal,
    openInstallModal,
    language,
    setLanguage,
    t,
  } = usePlanner();
  const { isOnline, isInstallable, isInstalled, hasUpdate, promptInstall, applyUpdate } = usePwa();

  const sectionMeta: Record<NavSection, { title: string; subtitle: string }> = {
    dashboard: {
      title: t('nav.overview'),
      subtitle: t('nav.overviewSubtitle'),
    },
    courses: {
      title: t('nav.courses'),
      subtitle: t('nav.coursesSubtitle'),
    },
    assessments: {
      title: t('nav.assessments'),
      subtitle: t('nav.assessmentsSubtitle'),
    },
    results: {
      title: t('nav.results'),
      subtitle: t('nav.resultsSubtitle'),
    },
    'gpa-calculator': {
      title: t('nav.gpaCalculator'),
      subtitle: t('nav.gpaSubtitle'),
    },
    settings: {
      title: t('nav.settings'),
      subtitle: t('nav.settingsSubtitle'),
    },
  };

  const currentMeta = sectionMeta[activeSection] || {
    title: t('nav.dashboard'),
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
        {/* Language Switcher Pill */}
        <button
          type="button"
          className="lang-toggle-btn"
          onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
          title={language === 'en' ? 'বাংলা মোড চালু করুন' : 'Switch to English'}
          aria-label="Toggle language mode"
        >
          <Globe size={14} color="var(--accent)" />
          <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
        </button>

        {/* Offline / Online Status Indicator */}
        <div
          className={`network-status-pill ${isOnline ? 'online' : 'offline'}`}
          role="status"
          aria-live="polite"
          title={isOnline ? t('nav.onlineTitle') : t('nav.offlineTitle')}
        >
          {isOnline ? (
            <>
              <Wifi size={13} className="network-icon" />
              <span>{t('nav.online')}</span>
            </>
          ) : (
            <>
              <WifiOff size={13} className="network-icon" />
              <span>{t('nav.offline')}</span>
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
            <span>{t('nav.updateReady')}</span>
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
            <span>{t('nav.installApp')}</span>
          </button>
        )}

        <div className="term-indicator-pill">
          <span className="indicator-dot" />
          <span>{settings.currentTerm || t('nav.currentTerm')}</span>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => openAddCourseModal()}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>{t('nav.addCourse')}</span>
        </button>
      </div>
    </header>
  );
};
