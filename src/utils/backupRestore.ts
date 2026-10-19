import type {
  Course,
  Assessment,
  AssessmentPriority,
  StudentSettings,
  UniPlannerBackupData,
  BackupValidationResult,
  BackupPreviewInfo,
  AssessmentType,
} from '../types';
import { STORAGE_KEYS, safeSetItem, safeGetItem, VALID_ASSESSMENT_TYPES } from './storage';
import { validateGradingConfig } from './gradeAnalysis';
import { validateGpaConfig, getDefaultGpaConfig } from './gpaCalculation';

export const BACKUP_SCHEMA_VERSION = 1;
export const BACKUP_APP_IDENTIFIER = 'UniPlanner';

/**
 * Constructs a clean, typed UniPlanner backup payload.
 */
export function createBackupData(
  courses: Course[],
  assessments: Assessment[],
  settings: StudentSettings
): UniPlannerBackupData {
  return {
    app: 'UniPlanner',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    metadata: {
      appName: 'UniPlanner Academic Workspace',
      version: '1.0.0',
      totalCourses: courses.length,
      totalAssessments: assessments.length,
    },
    courses: courses.map((c) => ({
      id: c.id,
      code: c.code.trim().toUpperCase(),
      name: c.name.trim(),
      credits: c.credits,
      semester: c.semester.trim(),
      color: c.color,
      instructor: c.instructor ? c.instructor.trim() : undefined,
      targetGrade: c.targetGrade ? c.targetGrade.trim() : undefined,
      gradingConfig: c.gradingConfig,
      finalGrade: c.finalGrade ? c.finalGrade.trim() : undefined,
      finalGradePoint: c.finalGradePoint,
      createdAt: c.createdAt || new Date().toISOString(),
    })),
    assessments: assessments.map((a) => ({
      id: a.id,
      courseId: a.courseId,
      courseCode: a.courseCode.trim().toUpperCase(),
      categoryId: a.categoryId,
      title: a.title.trim(),
      type: a.type,
      customType: a.customType ? a.customType.trim() : undefined,
      priority: a.priority,
      maxMarks: a.maxMarks,
      obtainedMarks: a.obtainedMarks !== undefined ? a.obtainedMarks : null,
      dueDate: a.dueDate ? a.dueDate.trim() : undefined,
      description: a.description ? a.description.trim() : undefined,
      createdAt: a.createdAt || new Date().toISOString(),
    })),
    settings: {
      universityName: settings.universityName || '',
      studentName: settings.studentName || '',
      degreeProgram: settings.degreeProgram || '',
      gradingScale: settings.gradingScale || '4.0',
      currentTerm: settings.currentTerm || 'Fall 2026',
      targetGpa: settings.targetGpa || 3.8,
      gpaConfig: settings.gpaConfig || getDefaultGpaConfig(settings.gradingScale || '4.0'),
    },
  };
}

/**
 * Triggers a client-side browser file download containing the UniPlanner backup JSON.
 * Returns the ISO export timestamp string.
 */
export function exportBackupFile(
  courses: Course[],
  assessments: Assessment[],
  settings: StudentSettings
): string {
  const backupData = createBackupData(courses, assessments, settings);
  const jsonContent = JSON.stringify(backupData, null, 2);
  const timestamp = backupData.exportedAt;

  // Format date for filename: YYYY-MM-DD
  const dateStr = timestamp.split('T')[0] || 'backup';
  const fileName = `uniplanner-backup-${dateStr}.json`;

  try {
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Persist reliable last export timestamp
    safeSetItem(STORAGE_KEYS.LAST_BACKUP_EXPORT, timestamp);
  } catch (err) {
    console.error('[UniPlanner] Failed to initiate backup download:', err);
  }

  return timestamp;
}

/**
 * Retrieves the last export timestamp if it has been recorded.
 */
export function getLastExportTime(): string | null {
  return safeGetItem<string | null>(STORAGE_KEYS.LAST_BACKUP_EXPORT, null);
}

/**
 * Formats an ISO date string into a user-friendly readable format.
 */
export function formatBackupDate(isoString?: string | null): string {
  if (!isoString) return 'Never';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

/**
 * Validates the uploaded backup JSON structure, schema version, field types,
 * course references, and assessment referential integrity.
 */
export function validateBackupJson(rawJson: string): BackupValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      isValid: false,
      errors: [
        'Invalid JSON format: The selected file could not be parsed. Please ensure the file is a valid JSON document.',
      ],
      warnings: [],
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      isValid: false,
      errors: ['Invalid backup structure: The backup root must be a JSON object.'],
      warnings: [],
    };
  }

  const root = parsed as Record<string, unknown>;

  // Check application identifier
  if (root.app !== BACKUP_APP_IDENTIFIER) {
    errors.push(
      `Unrecognized backup file: Expected app identifier "${BACKUP_APP_IDENTIFIER}", but found "${root.app ?? 'unknown'}". Only files exported by UniPlanner can be restored.`
    );
  }

  // Check schema version
  if (typeof root.schemaVersion !== 'number' || root.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    errors.push(
      `Unsupported schema version: File uses schema version ${root.schemaVersion ?? 'unspecified'}, but this version of UniPlanner only supports schema version ${BACKUP_SCHEMA_VERSION}.`
    );
  }

  // Check export timestamp
  if (typeof root.exportedAt !== 'string' || !root.exportedAt.trim() || isNaN(Date.parse(root.exportedAt))) {
    warnings.push('Export timestamp in backup file is missing or invalid.');
  }

  // Validate settings
  let validSettings: StudentSettings;
  if (!root.settings || typeof root.settings !== 'object' || Array.isArray(root.settings)) {
    errors.push('Settings record is missing or corrupted in the backup file.');
    validSettings = {
      universityName: '',
      studentName: '',
      degreeProgram: '',
      gradingScale: '4.0',
      currentTerm: 'Fall 2026',
      targetGpa: 3.8,
      gpaConfig: getDefaultGpaConfig('4.0'),
    };
  } else {
    const s = root.settings as Record<string, unknown>;
    const scale = (s.gradingScale === '4.0_ugc' || s.gradingScale === '4.33' || s.gradingScale === '5.0' || s.gradingScale === 'percentage')
      ? s.gradingScale
      : '4.0';

    validSettings = {
      universityName: typeof s.universityName === 'string' ? s.universityName.trim() : '',
      studentName: typeof s.studentName === 'string' ? s.studentName.trim() : '',
      degreeProgram: typeof s.degreeProgram === 'string' ? s.degreeProgram.trim() : '',
      gradingScale: scale,
      currentTerm: typeof s.currentTerm === 'string' && s.currentTerm.trim() ? s.currentTerm.trim() : 'Fall 2026',
      targetGpa: typeof s.targetGpa === 'number' && !isNaN(s.targetGpa) ? s.targetGpa : 3.8,
      gpaConfig: undefined,
    };

    if (s.gpaConfig && typeof s.gpaConfig === 'object') {
      const gpaValidation = validateGpaConfig(s.gpaConfig as any);
      if (!gpaValidation.isValid) {
        errors.push(`Invalid GPA grading rules in backup settings: ${gpaValidation.errors.join('; ')}`);
      } else {
        validSettings.gpaConfig = s.gpaConfig as any;
      }
    } else {
      validSettings.gpaConfig = getDefaultGpaConfig(scale);
    }
  }

  // Validate courses
  const validCourses: Course[] = [];
  const courseIdSet = new Set<string>();
  const seenCourseKeys = new Set<string>();

  if (!Array.isArray(root.courses)) {
    errors.push('Courses record is missing or not an array in the backup file.');
  } else {
    for (let i = 0; i < root.courses.length; i++) {
      const c = root.courses[i];
      if (!c || typeof c !== 'object') {
        errors.push(`Course at index ${i} is not a valid object.`);
        continue;
      }

      const item = c as Record<string, unknown>;
      const courseId = typeof item.id === 'string' ? item.id.trim() : '';
      const code = typeof item.code === 'string' ? item.code.trim().toUpperCase() : '';
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      const semester = typeof item.semester === 'string' ? item.semester.trim() : '';
      const credits = typeof item.credits === 'number' && !isNaN(item.credits) ? item.credits : -1;

      if (!courseId) {
        errors.push(`Course #${i + 1} is missing a unique ID.`);
      } else if (courseIdSet.has(courseId)) {
        errors.push(`Duplicate course ID "${courseId}" found in backup file.`);
      } else {
        courseIdSet.add(courseId);
      }

      if (!code) {
        errors.push(`Course #${i + 1} is missing a course code.`);
      }

      if (!name) {
        errors.push(`Course "${code || `#${i + 1}`}" is missing a name.`);
      }

      if (!semester) {
        errors.push(`Course "${code || `#${i + 1}`}" is missing an academic term/semester.`);
      }

      if (credits <= 0) {
        errors.push(`Course "${code || `#${i + 1}`}" credits must be a positive number (found: ${item.credits}).`);
      }

      // Duplicate check within same semester
      if (code && semester) {
        const key = `${code.toUpperCase()}::${semester.toLowerCase()}`;
        if (seenCourseKeys.has(key)) {
          errors.push(`Duplicate course code "${code}" in term "${semester}" in backup file.`);
        }
        seenCourseKeys.add(key);
      }

      // Validate gradingConfig if present
      if (item.gradingConfig && typeof item.gradingConfig === 'object') {
        const gc = item.gradingConfig as any;
        if (gc.isComplete) {
          const gcValidation = validateGradingConfig(gc);
          if (!gcValidation.isValid) {
            errors.push(`Course "${code}" grading configuration is invalid: ${gcValidation.errors.join('; ')}`);
          }
        }
      }

      validCourses.push({
        id: courseId,
        code,
        name,
        credits: Math.max(0.5, credits),
        semester,
        color: typeof item.color === 'string' && item.color ? item.color : '#2563eb',
        instructor: typeof item.instructor === 'string' && item.instructor.trim() ? item.instructor.trim() : undefined,
        targetGrade: typeof item.targetGrade === 'string' && item.targetGrade.trim() ? item.targetGrade.trim() : undefined,
        gradingConfig: item.gradingConfig as any,
        finalGrade: typeof item.finalGrade === 'string' && item.finalGrade.trim() ? item.finalGrade.trim() : undefined,
        finalGradePoint: typeof item.finalGradePoint === 'number' && !isNaN(item.finalGradePoint) ? item.finalGradePoint : undefined,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      });
    }
  }

  // Validate assessments & Referential Integrity
  const validAssessments: Assessment[] = [];
  const assessmentIdSet = new Set<string>();

  if (!Array.isArray(root.assessments)) {
    errors.push('Assessments record is missing or not an array in the backup file.');
  } else {
    for (let i = 0; i < root.assessments.length; i++) {
      const a = root.assessments[i];
      if (!a || typeof a !== 'object') {
        errors.push(`Assessment at index ${i} is not a valid object.`);
        continue;
      }

      const item = a as Record<string, unknown>;
      const asmId = typeof item.id === 'string' ? item.id.trim() : '';
      const courseId = typeof item.courseId === 'string' ? item.courseId.trim() : '';
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const maxMarks = typeof item.maxMarks === 'number' && !isNaN(item.maxMarks) ? item.maxMarks : -1;

      if (!asmId) {
        errors.push(`Assessment #${i + 1} is missing a unique ID.`);
      } else if (assessmentIdSet.has(asmId)) {
        errors.push(`Duplicate assessment ID "${asmId}" found in backup file.`);
      } else {
        assessmentIdSet.add(asmId);
      }

      if (!title) {
        errors.push(`Assessment #${i + 1} is missing a title.`);
      }

      if (!courseId) {
        errors.push(`Assessment "${title || `#${i + 1}`}" is not linked to any course.`);
      } else if (!courseIdSet.has(courseId)) {
        // STRICT REFERENTIAL INTEGRITY CHECK
        errors.push(
          `Referential Integrity Error: Assessment "${title || `#${i + 1}`}" references course ID "${courseId}", which does not exist in the backup courses.`
        );
      }

      if (maxMarks <= 0) {
        errors.push(`Assessment "${title || `#${i + 1}`}" maximum marks must be greater than zero.`);
      }

      // Check obtained marks
      let obtainedMarks: number | null | undefined = undefined;
      if (item.obtainedMarks !== undefined && item.obtainedMarks !== null) {
        if (typeof item.obtainedMarks === 'number' && !isNaN(item.obtainedMarks)) {
          if (item.obtainedMarks < 0) {
            errors.push(`Assessment "${title}" obtained marks cannot be negative.`);
          } else if (maxMarks > 0 && item.obtainedMarks > maxMarks) {
            errors.push(
              `Assessment "${title}" obtained marks (${item.obtainedMarks}) cannot exceed maximum marks (${maxMarks}).`
            );
          } else {
            obtainedMarks = item.obtainedMarks;
          }
        } else {
          errors.push(`Assessment "${title}" obtained marks must be a valid number or null.`);
        }
      } else if (item.obtainedMarks === null) {
        obtainedMarks = null;
      }

      // Type normalization
      let type: AssessmentType = 'Assignment';
      if (typeof item.type === 'string') {
        const found = VALID_ASSESSMENT_TYPES.find((t) => t.toLowerCase() === (item.type as string).toLowerCase());
        if (found) {
          type = found;
        } else {
          type = 'Other';
        }
      }

      const parentCourse = validCourses.find((c) => c.id === courseId);
      const courseCode = parentCourse ? parentCourse.code : (typeof item.courseCode === 'string' ? item.courseCode : 'COURSE');

      let priority: AssessmentPriority | undefined = undefined;
      if (item.priority === 'high' || item.priority === 'medium' || item.priority === 'low') {
        priority = item.priority;
      }

      validAssessments.push({
        id: asmId,
        courseId,
        courseCode,
        categoryId: typeof item.categoryId === 'string' && item.categoryId.trim() ? item.categoryId.trim() : undefined,
        title,
        type,
        customType: typeof item.customType === 'string' && item.customType.trim() ? item.customType.trim() : undefined,
        priority,
        maxMarks: Math.max(1, maxMarks),
        obtainedMarks,
        dueDate: typeof item.dueDate === 'string' && item.dueDate.trim() ? item.dueDate.trim() : undefined,
        description: typeof item.description === 'string' && item.description.trim() ? item.description.trim() : undefined,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      });
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
    };
  }

  const cleanData: UniPlannerBackupData = {
    app: 'UniPlanner',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: typeof root.exportedAt === 'string' ? root.exportedAt : new Date().toISOString(),
    courses: validCourses,
    assessments: validAssessments,
    settings: validSettings,
  };

  const preview: BackupPreviewInfo = {
    exportedAt: cleanData.exportedAt,
    schemaVersion: cleanData.schemaVersion,
    courseCount: validCourses.length,
    assessmentCount: validAssessments.length,
    courseCodes: validCourses.map((c) => c.code),
    universityName: validSettings.universityName || undefined,
    gradingScale: validSettings.gradingScale,
    confirmedCoursesCount: validCourses.filter((c) => !!c.finalGrade).length,
  };

  return {
    isValid: true,
    errors: [],
    warnings,
    data: cleanData,
    preview,
  };
}
