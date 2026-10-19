export type NavSection =
  | 'dashboard'
  | 'courses'
  | 'assessments'
  | 'results'
  | 'gpa-calculator'
  | 'settings';

export interface MarksCategory {
  id: string;
  name: string;
  maxMarks: number;
}

export interface GradeBoundary {
  grade: string;
  minMarks: number;
}

export interface CourseGradingConfig {
  totalCourseMarks: number;
  categories: MarksCategory[];
  gradeBoundaries: GradeBoundary[];
  passingMarks?: number;
  isComplete: boolean;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: string;
  color: string;
  instructor?: string;
  targetGrade?: string;
  gradingConfig?: CourseGradingConfig;
  finalGrade?: string; // Officially confirmed final grade (e.g. 'A', 'B+')
  finalGradePoint?: number; // Confirmed grade point
  createdAt: string;
}

export type AssessmentType =
  | 'Class Test (CT)'
  | 'Quiz'
  | 'Midterm'
  | 'Assignment'
  | 'Presentation'
  | 'Project'
  | 'Lab'
  | 'Final Exam'
  | 'Other';

export type AssessmentPriority = 'high' | 'medium' | 'low';

export interface Assessment {
  id: string;
  courseId: string;
  courseCode: string;
  categoryId?: string; // Links to MarksCategory.id if configured
  title: string;
  type: AssessmentType;
  customType?: string; // Used when type === 'Other'
  priority?: AssessmentPriority; // 'high' | 'medium' | 'low'
  maxMarks: number;
  obtainedMarks?: number | null; // Optional; empty/null means results not released yet
  dueDate?: string; // Optional: YYYY-MM-DD
  description?: string;
  createdAt: string;
}

export interface Semester {
  id: string;
  name: string;
  isCurrent: boolean;
}

export interface GpaScaleRule {
  grade: string;
  gradePoint: number;
  minPercentage?: number;
}

export interface GpaGradingConfig {
  scaleMax: number;
  rules: GpaScaleRule[];
  minPassingGrade?: string;
  minPassingGradePoint?: number;
}

export type Language = 'en' | 'bn';

export interface StudentSettings {
  universityName: string;
  studentName: string;
  degreeProgram: string;
  gradingScale: '4.0' | '4.0_ugc' | '4.33' | '5.0' | 'percentage';
  currentTerm: string;
  targetGpa: number;
  language?: Language;
  notificationsEnabled?: boolean;
  gpaConfig?: GpaGradingConfig;
}

export interface GradeScaleEntry {
  letter: string;
  minPercentage: number;
  gradePoint: number;
}

export interface CourseGpaItem {
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  semester: string;
  color: string;
  confirmedGrade?: string;
  confirmedGradePoint?: number;
  isPending: boolean;
  isIncluded: boolean;
  simulatedGrade?: string;
  simulatedGradePoint?: number;
  effectiveGradePoint?: number;
  estimatedGradeFromMarks?: string;
  estimatedPercentageFromMarks?: number;
}

export interface SemesterGpaResult {
  semester: string;
  totalCourses: number;
  includedCourses: number;
  pendingCourses: number;
  totalCredits: number;
  includedCredits: number;
  pendingCredits: number;
  totalQualityPoints: number;
  gpa: number | null;
  gpaFormatted: string;
  // Simulation comparison
  simulatedGpa: number | null;
  simulatedGpaFormatted: string;
  isSimulating: boolean;
  simulatedCoursesCount: number;
  items: CourseGpaItem[];
}

export interface CumulativeGpaResult {
  totalCourses: number;
  confirmedCourses: number;
  pendingCourses: number;
  totalCredits: number;
  confirmedCredits: number;
  pendingCredits: number;
  totalQualityPoints: number;
  gpa: number | null;
  gpaFormatted: string;
}

export type TargetGradeStatus =
  | 'achieved'
  | 'achievable'
  | 'impossible'
  | 'pending'
  | 'insufficient_info';

export interface TargetGradeAnalysis {
  status: TargetGradeStatus;
  targetGrade: string;
  targetMinMarks: number;
  marksNeeded: number;
  remainingAvailableMarks: number;
  requiredRemainingPercentage: number | null;
  message: string;
}

export interface CategoryAnalysisItem {
  category: MarksCategory;
  assessments: Assessment[];
  confirmedMarks: number;
  assessedMaxMarks: number;
  pendingCapacity: number;
  lostMarks: number;
  hasConflict: boolean;
}

export interface CourseGradeAnalysis {
  totalCourseMarks: number;
  totalConfirmedMarks: number;
  totalAssessedMarks: number;
  totalPendingOrUnassessedMarks: number;
  maxMarksStillAvailable: number;
  confirmedAssessedPercentage: number | null;
  confirmedTotalPercentage: number;
  maxPossiblePercentage: number;
  categoryBreakdown: CategoryAnalysisItem[];
  isGradingConfigured: boolean;
  hasConflicts: boolean;
  targetAnalysis?: TargetGradeAnalysis;
}

export interface UniPlannerBackupData {
  app: 'UniPlanner';
  schemaVersion: 1;
  exportedAt: string;
  metadata?: {
    appName: string;
    version: string;
    totalCourses: number;
    totalAssessments: number;
  };
  courses: Course[];
  assessments: Assessment[];
  settings: StudentSettings;
}

export interface BackupPreviewInfo {
  exportedAt: string;
  schemaVersion: number;
  courseCount: number;
  assessmentCount: number;
  courseCodes: string[];
  universityName?: string;
  gradingScale: string;
  confirmedCoursesCount: number;
}

export interface BackupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: UniPlannerBackupData;
  preview?: BackupPreviewInfo;
}
