import type { Assessment, AssessmentPriority, AssessmentType, Language } from '../types';

/**
 * Returns a sensible default priority based on assessment type.
 * Heavy-weight milestones (Finals, Midterms, Projects) default to 'high',
 * regular coursework to 'medium', and quick tests to 'low'.
 */
export function getDefaultPriorityForType(type: AssessmentType): AssessmentPriority {
  switch (type) {
    case 'Final Exam':
    case 'Midterm':
    case 'Project':
      return 'high';
    case 'Assignment':
    case 'Presentation':
    case 'Lab':
    case 'Class Test (CT)':
    case 'Other':
      return 'medium';
    case 'Quiz':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Priority rank value for mathematical comparison.
 */
export const PRIORITY_WEIGHTS: Record<AssessmentPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export interface PriorityMeta {
  priority: AssessmentPriority;
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
  accent: string;
  description: string;
}

export const PRIORITY_CONFIG: Record<AssessmentPriority, PriorityMeta> = {
  high: {
    priority: 'high',
    label: 'High Priority',
    shortLabel: 'High',
    color: '#e11d48',
    bg: 'rgba(225, 29, 72, 0.09)',
    border: 'rgba(225, 29, 72, 0.28)',
    accent: '#e11d48',
    description: 'Critical exams & major deliverables (Finals, Midterms, Projects)',
  },
  medium: {
    priority: 'medium',
    label: 'Medium Priority',
    shortLabel: 'Medium',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.09)',
    border: 'rgba(217, 119, 6, 0.28)',
    accent: '#d97706',
    description: 'Regular coursework & presentations (Assignments, Labs, CTs)',
  },
  low: {
    priority: 'low',
    label: 'Low Priority',
    shortLabel: 'Low',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.09)',
    border: 'rgba(5, 150, 105, 0.28)',
    accent: '#059669',
    description: 'Minor milestones & practice tests (Quizzes, Quick tasks)',
  },
};

export const PRIORITY_CONFIG_BN: Record<AssessmentPriority, { label: string; shortLabel: string; description: string }> = {
  high: {
    label: 'হাই প্রায়োরিটি (জরুরি)',
    shortLabel: 'জরুরি',
    description: 'বড় পরীক্ষা ও মূল প্রজেক্ট (ফাইনাল, মিডটার্ম, প্রজেক্ট)',
  },
  medium: {
    label: 'মিডিয়াম প্রায়োরিটি',
    shortLabel: 'মিডিয়াম',
    description: 'ক্লাসওয়ার্ক ও প্রেজেন্টেশন (অ্যাসাইনমেন্ট, ল্যাব, সিটি)',
  },
  low: {
    label: 'লো প্রায়োরিটি',
    shortLabel: 'সাধারণ',
    description: 'ছোটখাটো কুইজ ও অনুশীলন কাজ',
  },
};

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/**
 * Converts Western Arabic digits (0-9) to standard Bengali digits (০-৯).
 */
export function toBengaliNumber(val: string | number): string {
  return String(val).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/**
 * Returns priority metadata for an assessment, falling back to type-based default if not set.
 */
export function getAssessmentPriorityMeta(assessment: Assessment, lang: Language = 'en'): PriorityMeta {
  const priority = assessment.priority || getDefaultPriorityForType(assessment.type);
  const base = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  if (lang === 'bn') {
    const bnMeta = PRIORITY_CONFIG_BN[priority] || PRIORITY_CONFIG_BN.medium;
    return {
      ...base,
      label: bnMeta.label,
      shortLabel: bnMeta.shortLabel,
      description: bnMeta.description,
    };
  }
  return base;
}

export type UrgencyLevel =
  | 'overdue'
  | 'today'
  | 'tomorrow'
  | 'within-3-days'
  | 'within-week'
  | 'later'
  | 'no-date';

export interface UrgencyInfo {
  level: UrgencyLevel;
  label: string;
  badgeLabel: string;
  daysDiff: number | null;
  isUrgent: boolean;
  color: string;
  bg: string;
  border: string;
}

/**
 * Computes calendar days between two dates (ignoring time-of-day offsets).
 */
export function getDaysDifference(targetDateStr: string, baseDate = new Date()): number | null {
  if (!targetDateStr || !targetDateStr.trim()) return null;
  const parts = targetDateStr.trim().split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const targetUtc = Date.UTC(year, month, day);
  const baseUtc = Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((targetUtc - baseUtc) / msPerDay);
}

/**
 * Evaluates urgency status of an assessment due date.
 */
export function getAssessmentUrgency(
  dueDateStr?: string,
  baseDate?: Date,
  lang: Language = 'en'
): UrgencyInfo {
  const isBn = lang === 'bn';
  const effectiveBaseDate = baseDate || new Date();

  if (!dueDateStr || !dueDateStr.trim()) {
    return {
      level: 'no-date',
      label: isBn ? 'তারিখ নির্ধারিত নেই' : 'No deadline',
      badgeLabel: '',
      daysDiff: null,
      isUrgent: false,
      color: 'var(--text-dim)',
      bg: 'var(--bg-subtle)',
      border: 'transparent',
    };
  }

  const days = getDaysDifference(dueDateStr, effectiveBaseDate);
  if (days === null) {
    return {
      level: 'no-date',
      label: dueDateStr,
      badgeLabel: '',
      daysDiff: null,
      isUrgent: false,
      color: 'var(--text-dim)',
      bg: 'var(--bg-subtle)',
      border: 'transparent',
    };
  }

  if (days < 0) {
    const absDays = Math.abs(days);
    const bnAbsDays = toBengaliNumber(absDays);
    const label = isBn
      ? absDays === 1 ? '১ দিন পার হয়ে গেছে' : `${bnAbsDays} দিন পার হয়ে গেছে`
      : absDays === 1 ? 'Overdue by 1 day' : `Overdue by ${absDays} days`;
    const badgeLabel = isBn ? `${bnAbsDays} দিন পার` : `-${absDays}d`;
    return {
      level: 'overdue',
      label,
      badgeLabel,
      daysDiff: days,
      isUrgent: true,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.1)',
      border: 'rgba(220, 38, 38, 0.25)',
    };
  }

  if (days === 0) {
    return {
      level: 'today',
      label: isBn ? 'আজকের ডেডলাইন' : 'Due Today',
      badgeLabel: isBn ? 'আজকে' : 'Today',
      daysDiff: 0,
      isUrgent: true,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.12)',
      border: 'rgba(220, 38, 38, 0.3)',
    };
  }

  if (days === 1) {
    return {
      level: 'tomorrow',
      label: isBn ? 'আগামীকাল শেষ দিন' : 'Due Tomorrow',
      badgeLabel: isBn ? 'কালকে' : 'Tomorrow',
      daysDiff: 1,
      isUrgent: true,
      color: '#ea580c',
      bg: 'rgba(234, 88, 12, 0.12)',
      border: 'rgba(234, 88, 12, 0.3)',
    };
  }

  const bnDays = toBengaliNumber(days);

  if (days <= 3) {
    return {
      level: 'within-3-days',
      label: isBn ? `${bnDays} দিন বাকি` : `Due in ${days} days`,
      badgeLabel: isBn ? `${bnDays} দিন` : `${days}d`,
      daysDiff: days,
      isUrgent: true,
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.1)',
      border: 'rgba(217, 119, 6, 0.25)',
    };
  }

  if (days <= 7) {
    return {
      level: 'within-week',
      label: isBn ? `${bnDays} দিন বাকি` : `Due in ${days} days`,
      badgeLabel: isBn ? `${bnDays} দিন` : `${days}d`,
      daysDiff: days,
      isUrgent: false,
      color: 'var(--accent)',
      bg: 'rgba(37, 99, 235, 0.08)',
      border: 'rgba(37, 99, 235, 0.2)',
    };
  }

  return {
    level: 'later',
    label: isBn ? `${bnDays} দিন পর` : `In ${days} days`,
    badgeLabel: isBn ? `${bnDays} দিন` : `${days}d`,
    daysDiff: days,
    isUrgent: false,
    color: 'var(--text-muted)',
    bg: 'var(--bg-subtle)',
    border: 'transparent',
  };
}

export type AssessmentSortOption =
  | 'dueDateAsc' // Earliest deadline first (Default balance)
  | 'priorityDesc' // Highest Priority first (High -> Medium -> Low), secondary sort by Date
  | 'dueDateDesc' // Latest deadline first
  | 'marksDesc' // Highest maximum marks first
  | 'titleAsc'; // Title alphabetically

/**
 * Pure and robust sorting function balancing Date and Priority.
 */
export function sortAssessments(
  assessments: Assessment[],
  sortBy: AssessmentSortOption
): Assessment[] {
  const cloned = [...assessments];

  return cloned.sort((a, b) => {
    const priorityA = a.priority || getDefaultPriorityForType(a.type);
    const priorityB = b.priority || getDefaultPriorityForType(b.type);
    const weightA = PRIORITY_WEIGHTS[priorityA] || 2;
    const weightB = PRIORITY_WEIGHTS[priorityB] || 2;

    const dateA = a.dueDate || '';
    const dateB = b.dueDate || '';

    switch (sortBy) {
      case 'dueDateAsc': {
        // Items with due dates come first; if both have dates, earliest first
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
        if (dateA && dateB) {
          const comp = dateA.localeCompare(dateB);
          if (comp !== 0) return comp;
        }
        // Secondary tie-breaker: Higher priority first
        if (weightA !== weightB) return weightB - weightA;
        return a.title.localeCompare(b.title);
      }

      case 'priorityDesc': {
        // Higher priority first
        if (weightA !== weightB) {
          return weightB - weightA;
        }
        // Secondary tie-breaker: Earliest due date first
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
        if (dateA && dateB) {
          const comp = dateA.localeCompare(dateB);
          if (comp !== 0) return comp;
        }
        return a.title.localeCompare(b.title);
      }

      case 'dueDateDesc': {
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
        if (dateA && dateB) {
          const comp = dateB.localeCompare(dateA);
          if (comp !== 0) return comp;
        }
        return weightB - weightA;
      }

      case 'marksDesc': {
        if (b.maxMarks !== a.maxMarks) {
          return b.maxMarks - a.maxMarks;
        }
        return weightB - weightA;
      }

      case 'titleAsc':
        return a.title.localeCompare(b.title);

      default:
        return 0;
    }
  });
}
