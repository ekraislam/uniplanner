/**
 * UniPlanner — Visual Course Coding & Theming System
 * Deterministic color palettes and visual styling tokens for courses.
 */

export interface CourseVisualTheme {
  primary: string; // Vibrant accent color
  gradient: string; // Complementary gradient endpoint
  bgSubtle: string; // Light background wash
  badgeBg: string; // Distinct badge pill background
  border: string; // Soft border tint
  text: string; // High-contrast accessible text
  glow: string; // Ambient glow shadow
}

// 8 Curated, high-contrast, premium academic themes
export const COURSE_PALETTES: CourseVisualTheme[] = [
  {
    primary: '#7c3aed', // Royal Violet / Purple
    gradient: '#a855f7',
    bgSubtle: '#faf5ff',
    badgeBg: '#ede9fe',
    border: '#ddd6fe',
    text: '#5b21b6',
    glow: 'rgba(124, 58, 237, 0.16)',
  },
  {
    primary: '#059669', // Emerald Mint
    gradient: '#10b981',
    bgSubtle: '#f0fdf4',
    badgeBg: '#dcfce7',
    border: '#bbf7d0',
    text: '#166534',
    glow: 'rgba(5, 150, 105, 0.16)',
  },
  {
    primary: '#2563eb', // Royal Cobalt
    gradient: '#3b82f6',
    bgSubtle: '#eff6ff',
    badgeBg: '#dbeafe',
    border: '#bfdbfe',
    text: '#1e40af',
    glow: 'rgba(37, 99, 235, 0.16)',
  },
  {
    primary: '#d97706', // Warm Amber
    gradient: '#f59e0b',
    bgSubtle: '#fffbeb',
    badgeBg: '#fef3c7',
    border: '#fde68a',
    text: '#92400e',
    glow: 'rgba(217, 119, 6, 0.16)',
  },
  {
    primary: '#e11d48', // Crimson Rose
    gradient: '#f43f5e',
    bgSubtle: '#fff1f2',
    badgeBg: '#ffe4e6',
    border: '#fecdd3',
    text: '#9f1239',
    glow: 'rgba(225, 29, 72, 0.16)',
  },
  {
    primary: '#0284c7', // Ocean Cyan
    gradient: '#0ea5e9',
    bgSubtle: '#f0f9ff',
    badgeBg: '#e0f2fe',
    border: '#bae6fd',
    text: '#0369a1',
    glow: 'rgba(2, 132, 199, 0.16)',
  },
  {
    primary: '#4f46e5', // Deep Indigo
    gradient: '#6366f1',
    bgSubtle: '#eef2ff',
    badgeBg: '#e0e7ff',
    border: '#c7d2fe',
    text: '#3730a3',
    glow: 'rgba(79, 70, 229, 0.16)',
  },
  {
    primary: '#0d9488', // Teal Sage
    gradient: '#14b8a6',
    bgSubtle: '#f0fdfa',
    badgeBg: '#ccfbf1',
    border: '#99f6e4',
    text: '#115e59',
    glow: 'rgba(13, 148, 136, 0.16)',
  },
];

export const PRESET_COURSE_COLORS = COURSE_PALETTES.map((p) => p.primary);

/**
 * Returns a complete visual theme for a given course.
 * Matches existing color if set, or deterministically hashes the course code.
 */
export function getCourseTheme(course?: {
  code?: string;
  color?: string;
  id?: string;
}): CourseVisualTheme {
  if (!course) return COURSE_PALETTES[0];

  // If the course has an exact matching primary color
  if (course.color) {
    const matched = COURSE_PALETTES.find(
      (p) => p.primary.toLowerCase() === course.color?.toLowerCase()
    );
    if (matched) return matched;
  }

  // Fallback to deterministic hash based on course code or ID
  const key = (course.code || course.id || 'default').trim().toUpperCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COURSE_PALETTES.length;
  return COURSE_PALETTES[index];
}
