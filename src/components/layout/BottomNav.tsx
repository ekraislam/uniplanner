import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  TrendingUp,
  Calculator,
  Settings,
} from 'lucide-react';
import { usePlanner } from '../../context/usePlanner';
import type { NavSection } from '../../types';

interface BottomNavItem {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

export const BottomNav: React.FC = () => {
  const { activeSection, setActiveSection, courses, assessments } = usePlanner();

  const items: BottomNavItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen, badge: courses.length > 0 ? courses.length : undefined },
    { id: 'assessments', label: 'Tasks', icon: CalendarCheck, badge: assessments.length > 0 ? assessments.length : undefined },
    { id: 'results', label: 'Results', icon: TrendingUp },
    { id: 'gpa-calculator', label: 'GPA', icon: Calculator },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNav = (section: NavSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-bottom-nav-inner">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNav(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="mobile-nav-icon-wrap">
                <Icon size={20} />
                {item.badge !== undefined && (
                  <span className="mobile-nav-badge">{item.badge}</span>
                )}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
