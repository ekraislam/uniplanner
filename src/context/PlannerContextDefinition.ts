import { createContext } from 'react';
import type {
  Course,
  Assessment,
  NavSection,
  StudentSettings,
  CourseGradingConfig,
  GpaGradingConfig,
  UniPlannerBackupData,
  Language,
} from '../types';

export interface PlannerContextType {
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
  courses: Course[];
  assessments: Assessment[];
  settings: StudentSettings;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // Internationalization / Localization
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;

  // Course Modal (Add / Edit)
  isAddCourseModalOpen: boolean;
  courseToEdit: Course | null;
  openAddCourseModal: (course?: Course) => void;
  closeAddCourseModal: () => void;

  // Delete Course Confirmation Modal
  courseToDelete: Course | null;
  openDeleteCourseModal: (course: Course) => void;
  closeDeleteCourseModal: () => void;

  // Course Operations
  addCourse: (courseData: Omit<Course, 'id' | 'createdAt'>) => boolean;
  updateCourse: (id: string, courseData: Omit<Course, 'id' | 'createdAt'>) => boolean;
  deleteCourse: (id: string) => void;
  isDuplicateCourseCode: (code: string, semester: string, excludeCourseId?: string) => boolean;

  // Grading Configuration Modal & Operations
  isGradingConfigModalOpen: boolean;
  courseForGradingConfig: Course | null;
  openGradingConfigModal: (course: Course) => void;
  closeGradingConfigModal: () => void;
  updateCourseGradingConfig: (courseId: string, gradingConfig: CourseGradingConfig) => boolean;

  // Confirm Final Grade Modal & Operations
  isConfirmFinalGradeModalOpen: boolean;
  courseForFinalGrade: Course | null;
  openConfirmFinalGradeModal: (course: Course) => void;
  closeConfirmFinalGradeModal: () => void;
  updateCourseFinalGrade: (courseId: string, finalGrade?: string, finalGradePoint?: number) => void;

  // Assessment Modal (Add / Edit)
  isAddAssessmentModalOpen: boolean;
  assessmentToEdit: Assessment | null;
  preselectedCourseId: string | null;
  openAddAssessmentModal: (assessment?: Assessment, courseId?: string) => void;
  closeAddAssessmentModal: () => void;

  // Delete Assessment Confirmation Modal
  assessmentToDelete: Assessment | null;
  openDeleteAssessmentModal: (assessment: Assessment) => void;
  closeDeleteAssessmentModal: () => void;

  // Assessment Operations
  addAssessment: (assessmentData: Omit<Assessment, 'id' | 'createdAt'>) => boolean;
  updateAssessment: (id: string, assessmentData: Omit<Assessment, 'id' | 'createdAt'>) => boolean;
  deleteAssessment: (id: string) => void;

  // Settings & Reset
  updateSettings: (newSettings: Partial<StudentSettings>) => void;
  updateGpaConfig: (gpaConfig: GpaGradingConfig) => boolean;
  resetToEmptyData: () => void;

  // Backup & Restore
  lastBackupExportTime: string | null;
  triggerExportBackup: () => string;
  restoreFromBackup: (backup: UniPlannerBackupData) => boolean;

  // PWA Install Modal
  isInstallModalOpen: boolean;
  openInstallModal: () => void;
  closeInstallModal: () => void;

  // Notification & Calendar Sync
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
  exportSemesterScheduleIcs: () => void;
  exportAssessmentIcs: (assessment: Assessment) => void;
  openGoogleCalendar: (assessment: Assessment) => void;
}

export const PlannerContext = createContext<PlannerContextType | undefined>(undefined);
