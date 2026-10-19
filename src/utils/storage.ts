import type {
  Course,
  Assessment,
  AssessmentType,
  AssessmentPriority,
  StudentSettings,
  CourseGradingConfig,
  MarksCategory,
  GradeBoundary,
  GpaGradingConfig,
  GpaScaleRule,
  Language,
} from '../types';
import { getDefaultGpaConfig } from './gpaCalculation';

export const STORAGE_KEYS = {
  COURSES: 'uniplanner_courses_v1',
  ASSESSMENTS: 'uniplanner_assessments_v1',
  SETTINGS: 'uniplanner_settings_v1',
  LAST_BACKUP_EXPORT: 'uniplanner_last_backup_export_v1',
  LANGUAGE: 'uniplanner_language_v1',
  NOTIFICATIONS_ENABLED: 'uniplanner_notifications_enabled_v1',
};

export const DEFAULT_SETTINGS: StudentSettings = {
  universityName: 'Green University of Bangladesh',
  studentName: '',
  degreeProgram: '',
  gradingScale: '4.0_ugc',
  currentTerm: 'Fall 2026',
  targetGpa: 3.75,
  language: 'en',
  notificationsEnabled: false,
  gpaConfig: getDefaultGpaConfig('4.0_ugc'),
};

export const VALID_ASSESSMENT_TYPES: AssessmentType[] = [
  'Class Test (CT)',
  'Quiz',
  'Midterm',
  'Assignment',
  'Presentation',
  'Project',
  'Lab',
  'Final Exam',
  'Other',
];

/**
 * Safely parse JSON from localStorage with validation and fallback.
 */
export function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[UniPlanner] Corrupted or invalid JSON in localStorage for key "${key}". Resetting to fallback.`, err);
    return fallback;
  }
}

/**
 * Safely save data to localStorage.
 */
export function safeSetItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`[UniPlanner] Failed to save data to localStorage for key "${key}".`, err);
  }
}

/**
 * Validates whether an unknown item is a valid Course object.
 */
function isValidCourse(item: unknown): item is Course {
  if (!item || typeof item !== 'object') return false;
  const c = item as Record<string, unknown>;

  return (
    typeof c.id === 'string' &&
    c.id.trim().length > 0 &&
    typeof c.code === 'string' &&
    c.code.trim().length > 0 &&
    typeof c.name === 'string' &&
    c.name.trim().length > 0 &&
    typeof c.credits === 'number' &&
    !isNaN(c.credits) &&
    c.credits > 0 &&
    typeof c.semester === 'string' &&
    c.semester.trim().length > 0
  );
}

/**
 * Loads courses safely from storage, discarding corrupted items without crashing.
 */
export function loadCourses(): Course[] {
  const rawData = safeGetItem<unknown>(STORAGE_KEYS.COURSES, []);
  if (!Array.isArray(rawData)) {
    console.warn('[UniPlanner] Stored courses is not an array. Recovering with empty list.');
    return [];
  }

  const validCourses: Course[] = [];
  for (const item of rawData) {
    if (isValidCourse(item)) {
      // Safely deserialize gradingConfig if present
      let gradingConfig: CourseGradingConfig | undefined = undefined;
      const rawGc = (item as unknown as Record<string, unknown>).gradingConfig;
      if (rawGc && typeof rawGc === 'object') {
        const gc = rawGc as Record<string, unknown>;
        const total = typeof gc.totalCourseMarks === 'number' && gc.totalCourseMarks > 0 ? gc.totalCourseMarks : 100;
        const categories: MarksCategory[] = [];
        if (Array.isArray(gc.categories)) {
          for (const c of gc.categories) {
            if (c && typeof c === 'object' && typeof c.id === 'string' && typeof c.name === 'string' && typeof c.maxMarks === 'number') {
              categories.push({ id: c.id, name: c.name.trim(), maxMarks: Math.max(0, c.maxMarks) });
            }
          }
        }
        const gradeBoundaries: GradeBoundary[] = [];
        if (Array.isArray(gc.gradeBoundaries)) {
          for (const gb of gc.gradeBoundaries) {
            if (gb && typeof gb === 'object' && typeof gb.grade === 'string' && typeof gb.minMarks === 'number') {
              gradeBoundaries.push({ grade: gb.grade.trim(), minMarks: Math.max(0, gb.minMarks) });
            }
          }
        }
        const passingMarks = typeof gc.passingMarks === 'number' && !isNaN(gc.passingMarks) ? gc.passingMarks : undefined;
        const isComplete = Boolean(gc.isComplete && categories.length > 0 && gradeBoundaries.length > 0);
        gradingConfig = {
          totalCourseMarks: total,
          categories,
          gradeBoundaries,
          passingMarks,
          isComplete,
        };
      }

      validCourses.push({
        id: item.id,
        code: item.code.trim().toUpperCase(),
        name: item.name.trim(),
        credits: item.credits,
        semester: item.semester.trim(),
        color: typeof item.color === 'string' && item.color ? item.color : '#2563eb',
        instructor: typeof item.instructor === 'string' && item.instructor.trim() ? item.instructor.trim() : undefined,
        targetGrade: typeof item.targetGrade === 'string' && item.targetGrade.trim() ? item.targetGrade.trim() : undefined,
        gradingConfig,
        finalGrade: typeof item.finalGrade === 'string' && item.finalGrade.trim() ? item.finalGrade.trim() : undefined,
        finalGradePoint: typeof item.finalGradePoint === 'number' && !isNaN(item.finalGradePoint) ? item.finalGradePoint : undefined,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      });
    } else {
      console.warn('[UniPlanner] Skipped corrupted or malformed course record:', item);
    }
  }

  return validCourses;
}

/**
 * Validates whether an unknown item is a valid Assessment object.
 */
function isValidAssessment(item: unknown): item is Record<string, unknown> {
  if (!item || typeof item !== 'object') return false;
  const a = item as Record<string, unknown>;

  const hasMax =
    (typeof a.maxMarks === 'number' && !isNaN(a.maxMarks) && a.maxMarks > 0) ||
    (typeof a.maxScore === 'number' && !isNaN(a.maxScore) && a.maxScore > 0);

  return (
    typeof a.id === 'string' &&
    a.id.trim().length > 0 &&
    typeof a.courseId === 'string' &&
    a.courseId.trim().length > 0 &&
    typeof a.title === 'string' &&
    a.title.trim().length > 0 &&
    hasMax
  );
}

/**
 * Loads assessments safely from storage, migrating legacy schema if needed.
 */
export function loadAssessments(): Assessment[] {
  const rawData = safeGetItem<unknown>(STORAGE_KEYS.ASSESSMENTS, []);
  if (!Array.isArray(rawData)) {
    console.warn('[UniPlanner] Stored assessments is not an array. Recovering with empty list.');
    return [];
  }

  const validAssessments: Assessment[] = [];
  for (const item of rawData) {
    if (isValidAssessment(item)) {
      const maxMarks = typeof item.maxMarks === 'number' ? item.maxMarks : Number(item.maxScore) || 100;
      
      // Handle obtained marks: preserve null / undefined when results not released yet
      let obtainedMarks: number | null | undefined = undefined;
      const rawObtained = item.obtainedMarks !== undefined ? item.obtainedMarks : item.score;
      if (typeof rawObtained === 'number' && !isNaN(rawObtained)) {
        obtainedMarks = Math.max(0, Math.min(rawObtained, maxMarks));
      } else if (rawObtained === null) {
        obtainedMarks = null;
      }

      // Type normalization
      let type: AssessmentType = 'Assignment';
      if (typeof item.type === 'string') {
        const found = VALID_ASSESSMENT_TYPES.find((t) => t.toLowerCase() === (item.type as string).toLowerCase());
        if (found) {
          type = found;
        } else if (item.type === 'Midterm Exam') {
          type = 'Midterm';
        } else {
          type = 'Other';
        }
      }

      // Priority normalization
      let priority: AssessmentPriority | undefined = undefined;
      if (item.priority === 'high' || item.priority === 'medium' || item.priority === 'low') {
        priority = item.priority;
      }

      validAssessments.push({
        id: item.id as string,
        courseId: item.courseId as string,
        courseCode: typeof item.courseCode === 'string' ? item.courseCode.trim().toUpperCase() : 'COURSE',
        categoryId: typeof item.categoryId === 'string' && item.categoryId.trim() ? item.categoryId.trim() : undefined,
        title: (item.title as string).trim(),
        type,
        customType: typeof item.customType === 'string' && item.customType.trim() ? item.customType.trim() : undefined,
        priority,
        maxMarks,
        obtainedMarks,
        dueDate: typeof item.dueDate === 'string' && item.dueDate.trim() ? item.dueDate.trim() : undefined,
        description: typeof item.description === 'string' && item.description.trim() ? item.description.trim() : undefined,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      });
    } else {
      console.warn('[UniPlanner] Skipped corrupted or malformed assessment record:', item);
    }
  }

  return validAssessments;
}

/**
 * Checks if an assessment has a valid future due date (today or later).
 * Does not count assessments without a due date or overdue assessments.
 */
export function isUpcomingAssessment(assessment: Assessment, now = new Date()): boolean {
  if (!assessment.dueDate || !assessment.dueDate.trim()) {
    return false;
  }

  const parts = assessment.dueDate.trim().split('-');
  if (parts.length !== 3) return false;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

  // Compare end of due date against current time
  const dueDateTime = new Date(year, month, day, 23, 59, 59, 999).getTime();
  return dueDateTime >= now.getTime();
}

/**
 * Formats YYYY-MM-DD into a human-friendly date string (e.g. Nov 14, 2026).
 */
export function formatDueDate(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return 'No deadline';
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  const d = new Date(year, month, day);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Loads settings safely from storage with fallback for any missing fields.
 */
export function loadSettings(): StudentSettings {
  const parsed = safeGetItem<Record<string, unknown>>(STORAGE_KEYS.SETTINGS, {});
  if (!parsed || typeof parsed !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  const gradingScale = (parsed.gradingScale === '4.0_ugc' || parsed.gradingScale === '4.33' || parsed.gradingScale === '5.0' || parsed.gradingScale === 'percentage')
    ? parsed.gradingScale
    : '4.0';

  let gpaConfig: GpaGradingConfig | undefined = undefined;
  const rawGpa = parsed.gpaConfig;
  if (rawGpa && typeof rawGpa === 'object') {
    const g = rawGpa as Record<string, unknown>;
    const scaleMax = typeof g.scaleMax === 'number' && g.scaleMax > 0 ? g.scaleMax : 4.0;
    const rules: GpaScaleRule[] = [];
    if (Array.isArray(g.rules)) {
      for (const r of g.rules) {
        if (r && typeof r === 'object' && typeof r.grade === 'string' && typeof r.gradePoint === 'number') {
          rules.push({
            grade: r.grade.trim(),
            gradePoint: Math.max(0, r.gradePoint),
            minPercentage: typeof r.minPercentage === 'number' && !isNaN(r.minPercentage) ? r.minPercentage : undefined,
          });
        }
      }
    }
    if (rules.length > 0) {
      gpaConfig = {
        scaleMax,
        rules,
        minPassingGrade: typeof g.minPassingGrade === 'string' && g.minPassingGrade.trim() ? g.minPassingGrade.trim() : undefined,
        minPassingGradePoint: typeof g.minPassingGradePoint === 'number' && !isNaN(g.minPassingGradePoint) ? g.minPassingGradePoint : undefined,
      };
    }
  }

  if (!gpaConfig) {
    gpaConfig = getDefaultGpaConfig(gradingScale);
  }

  return {
    universityName: typeof parsed.universityName === 'string' ? parsed.universityName : DEFAULT_SETTINGS.universityName,
    studentName: typeof parsed.studentName === 'string' ? parsed.studentName : DEFAULT_SETTINGS.studentName,
    degreeProgram: typeof parsed.degreeProgram === 'string' ? parsed.degreeProgram : DEFAULT_SETTINGS.degreeProgram,
    gradingScale,
    currentTerm: typeof parsed.currentTerm === 'string' && parsed.currentTerm.trim()
      ? parsed.currentTerm.trim()
      : DEFAULT_SETTINGS.currentTerm,
    targetGpa: typeof parsed.targetGpa === 'number' && !isNaN(parsed.targetGpa)
      ? parsed.targetGpa
      : DEFAULT_SETTINGS.targetGpa,
    language: parsed.language === 'bn' || safeGetItem<Language>(STORAGE_KEYS.LANGUAGE, 'en') === 'bn' ? 'bn' : 'en',
    notificationsEnabled: typeof parsed.notificationsEnabled === 'boolean'
      ? parsed.notificationsEnabled
      : safeGetItem<boolean>(STORAGE_KEYS.NOTIFICATIONS_ENABLED, false),
    gpaConfig,
  };
}

/**
 * Loads currently active language with localStorage priority.
 */
export function loadLanguage(): Language {
  const direct = safeGetItem<string>(STORAGE_KEYS.LANGUAGE, '');
  if (direct === 'bn' || direct === 'en') return direct;
  const settings = safeGetItem<Record<string, unknown>>(STORAGE_KEYS.SETTINGS, {});
  return settings.language === 'bn' ? 'bn' : 'en';
}

/**
 * Persists language preference immediately.
 */
export function saveLanguage(lang: Language): void {
  safeSetItem(STORAGE_KEYS.LANGUAGE, lang);
}
