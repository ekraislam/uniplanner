import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  TrendingUp,
  Calculator,
  Settings,
  GraduationCap,
  X,
  Smartphone,
  Download,
  Check,
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

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'courses', label: 'Courses', icon: BookOpen, showCount: true },
  { id: 'assessments', label: 'Assessments', icon: CalendarCheck, showCount: true },
  { id: 'results', label: 'Results Analysis', icon: TrendingUp },
  { id: 'gpa-calculator', label: 'GPA Calculator', icon: Calculator },
  { id: 'settings', label: 'Settings', icon: Settings },
];

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
  } = usePlanner();
  const { isInstalled, isInstallable, promptInstall } = usePwa();

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
              <GraduationCap size={22} strokeWidth={2.4} />
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
          {NAV_ITEMS.map((item) => {
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
                    <span className="install-label-main">Install App</span>
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
