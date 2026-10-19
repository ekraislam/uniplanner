import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  TrendingUp,
  Calculator,
  Settings,
  X,
  Smartphone,
  Download,
  Check,
  Globe,
} from 'lucide-react';
import { usePlanner } from '../../context/usePlanner';
import { usePwa } from '../../hooks/usePwa';
import type { NavSection } from '../../types';

interface NavItemConfig {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  showCount?: boolean;
}

export const Sidebar: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    courses,
    assessments,
    settings,
    isSidebarOpen,
    closeSidebar,
    openInstallModal,
    language,
    setLanguage,
    t,
  } = usePlanner();
  const { isInstalled, isInstallable, promptInstall } = usePwa();

  const navItems: NavItemConfig[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'courses', label: t('nav.courses'), icon: BookOpen, showCount: true },
    { id: 'assessments', label: t('nav.assessments'), icon: CalendarCheck, showCount: true },
    { id: 'results', label: t('nav.results'), icon: TrendingUp },
    { id: 'gpa-calculator', label: t('nav.gpaCalculator'), icon: Calculator },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  const handleNavClick = (section: NavSection) => {
    setActiveSection(section);
    closeSidebar();
  };

  const handleInstallClick = async () => {
    closeSidebar();
    if (isInstallable) {
      const outcome = await promptInstall();
      if (outcome === 'unsupported') {
        openInstallModal();
      }
    } else {
      openInstallModal();
    }
  };

  const totalAssessmentsCount = assessments.length;

  return (
    <>
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-link" onClick={() => handleNavClick('dashboard')}>
            <div className="brand-icon-wrapper">
              <img src="/icons/icon-192.png" alt="UniPlanner Logo" className="brand-icon-img" />
            </div>
            <div>
              <div className="brand-title">UniPlanner</div>
              <span className="brand-badge">Academic Global</span>
            </div>
          </div>

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            let countBadge: number | null = null;

            if (item.id === 'courses') {
              countBadge = courses.length;
            } else if (item.id === 'assessments') {
              countBadge = totalAssessmentsCount;
            }

            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <div className="nav-item-left">
                  <Icon className="nav-item-icon" size={19} />
                  <span>{item.label}</span>
                </div>
                {item.showCount && (
                  <span className="nav-count-badge">
                    {countBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {/* Quick Language Toggle in Sidebar */}
          <div style={{ marginBottom: '10px' }}>
            <button
              type="button"
              className="lang-toggle-btn"
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              style={{ width: '100%', justifyContent: 'center' }}
              title={language === 'en' ? 'বাংলা মোড চালু করুন' : 'Switch to English'}
            >
              <Globe size={14} color="var(--accent)" />
              <span>{language === 'en' ? 'বাংলা মোড' : 'English Mode'}</span>
            </button>
          </div>

          {!isInstalled ? (
            <div className="sidebar-install-banner">
              <button
                type="button"
                className="sidebar-install-btn"
                onClick={handleInstallClick}
                title="Install UniPlanner app on this device"
              >
                <div className="sidebar-install-left">
                  <Smartphone size={16} className="sidebar-install-icon" />
                  <div className="sidebar-install-labels">
                    <span className="install-label-main">{t('nav.installApp')}</span>
                    <span className="install-label-sub">Offline • 0 MB</span>
                  </div>
                </div>
                <Download size={15} className="sidebar-install-arrow" />
              </button>
            </div>
          ) : (
            <div className="sidebar-installed-badge">
              <Check size={12} />
              <span>Installed • Standalone</span>
            </div>
          )}

          <div className="student-card-snippet">
            <div className="student-avatar">
              {settings.studentName ? settings.studentName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="student-info">
              <span className="student-name">
                {settings.studentName || 'Student Account'}
              </span>
              <span className="student-term">
                {settings.universityName || settings.currentTerm || 'Academic Term'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
