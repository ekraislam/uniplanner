import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  iconBg = '#eff6ff',
  iconColor = '#2563eb',
}) => {
  return (
    <div className="stat-card">
      <div
        className="stat-icon-wrap"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        <span className="stat-subtext">{subtext}</span>
      </div>
    </div>
  );
};
