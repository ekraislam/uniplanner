import React, { useState, useEffect, useCallback } from 'react';
import type {
  Course,
  Assessment,
  StudentSettings,
  NavSection,
  CourseGradingConfig,
  GpaGradingConfig,
  UniPlannerBackupData,
  Language,
} from '../types';
import { PlannerContext } from './PlannerContextDefinition';
import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  loadCourses,
  loadAssessments,
  loadSettings,
  loadLanguage,
  saveLanguage,
  safeSetItem,
} from '../utils/storage';
import { exportBackupFile, getLastExportTime } from '../utils/backupRestore';
import { translate } from '../locales';

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Backup & Restore state
  const [lastBackupExportTime, setLastBackupExportTime] = useState<string | null>(() => getLastExportTime());

  // Course Modal states
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Grading Config Modal states
  const [isGradingConfigModalOpen, setIsGradingConfigModalOpen] = useState(false);
  const [courseForGradingConfig, setCourseForGradingConfig] = useState<Course | null>(null);

  // Confirm Final Grade Modal states
  const [isConfirmFinalGradeModalOpen, setIsConfirmFinalGradeModalOpen] = useState(false);
  const [courseForFinalGrade, setCourseForFinalGrade] = useState<Course | null>(null);

  // Assessment Modal states
  const [isAddAssessmentModalOpen, setIsAddAssessmentModalOpen] = useState(false);
  const [assessmentToEdit, setAssessmentToEdit] = useState<Assessment | null>(null);
  const [preselectedCourseId, setPreselectedCourseId] = useState<string | null>(null);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);

  // Install Guide Modal state
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const openInstallModal = () => setIsInstallModalOpen(true);
  const closeInstallModal = () => setIsInstallModalOpen(false);

  // Safe data initialization from persistent localStorage (starts empty if no stored data)
  const [courses, setCourses] = useState<Course[]>(() => loadCourses());
  const [assessments, setAssessments] = useState<Assessment[]>(() => loadAssessments());
  const [settings, setSettings] = useState<StudentSettings>(() => loadSettings());

  // Language and Localization
  const [language, setLanguageState] = useState<Language>(() => loadLanguage());

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    saveLanguage(newLang);
    setSettings((prev) => ({ ...prev, language: newLang }));
    document.documentElement.setAttribute('data-lang', newLang);
    document.documentElement.setAttribute('lang', newLang);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-lang', language);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(language, key, params);
    },
    [language]
  );

  // Reliable sync to localStorage whenever data changes
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.COURSES, courses);
  }, [courses]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.ASSESSMENTS, assessments);
  }, [assessments]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // Sidebar controls
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Course Modal controls
  const openAddCourseModal = (course?: Course) => {
    setCourseToEdit(course || null);
    setIsAddCourseModalOpen(true);
  };

  const closeAddCourseModal = () => {
    setCourseToEdit(null);
    setIsAddCourseModalOpen(false);
  };

  // Delete Course Modal controls
  const openDeleteCourseModal = (course: Course) => {
    setCourseToDelete(course);
  };

  const closeDeleteCourseModal = () => {
    setCourseToDelete(null);
  };

  // Duplicate course code validation within the same academic term
  const isDuplicateCourseCode = (
    code: string,
    semester: string,
    excludeCourseId?: string
  ): boolean => {
    const normalizedCode = code.trim().toUpperCase();
    const normalizedSemester = semester.trim().toLowerCase();

    return courses.some((c) => {
      if (excludeCourseId && c.id === excludeCourseId) {
        return false;
      }
      return (
        c.code.trim().toUpperCase() === normalizedCode &&
        c.semester.trim().toLowerCase() === normalizedSemester
      );
    });
  };

  // Add course
  const addCourse = (courseData: Omit<Course, 'id' | 'createdAt'>): boolean => {
    if (isDuplicateCourseCode(courseData.code, courseData.semester)) {
      return false;
    }

    const newCourse: Course = {
      ...courseData,
      id: `course_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    setCourses((prev) => [...prev, newCourse]);
    return true;
  };

  // Update existing course
  const updateCourse = (
    id: string,
    courseData: Omit<Course, 'id' | 'createdAt'>
  ): boolean => {
    if (isDuplicateCourseCode(courseData.code, courseData.semester, id)) {
      return false;
    }

    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...courseData } : c))
    );

    // Keep related assessments in sync if course code changed
    setAssessments((prev) =>
      prev.map((a) =>
        a.courseId === id ? { ...a, courseCode: courseData.code } : a
      )
    );

    return true;
  };

  // Delete course and cascade delete any associated assessments
  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setAssessments((prev) => prev.filter((a) => a.courseId !== id));
    if (courseToDelete?.id === id) {
      setCourseToDelete(null);
    }
  };

  // Grading Config Modal controls
  const openGradingConfigModal = (course: Course) => {
    setCourseForGradingConfig(course);
    setIsGradingConfigModalOpen(true);
  };

  const closeGradingConfigModal = () => {
    setCourseForGradingConfig(null);
    setIsGradingConfigModalOpen(false);
  };

  const updateCourseGradingConfig = (
    courseId: string,
    gradingConfig: CourseGradingConfig
  ): boolean => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, gradingConfig } : c))
    );
    return true;
  };

  // Final Grade Modal controls & Course Grade update
  const openConfirmFinalGradeModal = (course: Course) => {
    setCourseForFinalGrade(course);
    setIsConfirmFinalGradeModalOpen(true);
  };

  const closeConfirmFinalGradeModal = () => {
    setCourseForFinalGrade(null);
    setIsConfirmFinalGradeModalOpen(false);
  };

  const updateCourseFinalGrade = (
    courseId: string,
    finalGrade?: string,
    finalGradePoint?: number
  ) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? {
              ...c,
              finalGrade: finalGrade && finalGrade.trim() ? finalGrade.trim() : undefined,
              finalGradePoint: typeof finalGradePoint === 'number' && !isNaN(finalGradePoint) ? finalGradePoint : undefined,
            }
          : c
      )
    );
  };

  // Assessment Modal controls
  const openAddAssessmentModal = (assessment?: Assessment, courseId?: string) => {
    setAssessmentToEdit(assessment || null);
    setPreselectedCourseId(courseId || null);
    setIsAddAssessmentModalOpen(true);
  };

  const closeAddAssessmentModal = () => {
    setAssessmentToEdit(null);
    setPreselectedCourseId(null);
    setIsAddAssessmentModalOpen(false);
  };

  // Delete Assessment Modal controls
  const openDeleteAssessmentModal = (assessment: Assessment) => {
    setAssessmentToDelete(assessment);
  };

  const closeDeleteAssessmentModal = () => {
    setAssessmentToDelete(null);
  };

  // Add assessment
  const addAssessment = (
    assessmentData: Omit<Assessment, 'id' | 'createdAt'>
  ): boolean => {
    const targetCourse = courses.find((c) => c.id === assessmentData.courseId);
    if (!targetCourse) {
      return false;
    }

    const newAssessment: Assessment = {
      ...assessmentData,
      courseCode: targetCourse.code,
      id: `asm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    setAssessments((prev) => [...prev, newAssessment]);
    return true;
  };

  // Update assessment
  const updateAssessment = (
    id: string,
    assessmentData: Omit<Assessment, 'id' | 'createdAt'>
  ): boolean => {
    const targetCourse = courses.find((c) => c.id === assessmentData.courseId);
    if (!targetCourse) {
      return false;
    }

    setAssessments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              ...assessmentData,
              courseCode: targetCourse.code,
            }
          : a
      )
    );
    return true;
  };

  // Delete assessment
  const deleteAssessment = (id: string) => {
    setAssessments((prev) => prev.filter((a) => a.id !== id));
    if (assessmentToDelete?.id === id) {
      setAssessmentToDelete(null);
    }
  };

  const updateSettings = (newSettings: Partial<StudentSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateGpaConfig = (gpaConfig: GpaGradingConfig): boolean => {
    setSettings((prev) => ({
      ...prev,
      gpaConfig,
    }));
    return true;
  };

  const triggerExportBackup = (): string => {
    const timestamp = exportBackupFile(courses, assessments, settings);
    setLastBackupExportTime(timestamp);
    return timestamp;
  };

  const restoreFromBackup = (backup: UniPlannerBackupData): boolean => {
    try {
      if (!backup || !Array.isArray(backup.courses) || !Array.isArray(backup.assessments) || !backup.settings) {
        return false;
      }

      // Atomically persist to localStorage first
      safeSetItem(STORAGE_KEYS.COURSES, backup.courses);
      safeSetItem(STORAGE_KEYS.ASSESSMENTS, backup.assessments);
      safeSetItem(STORAGE_KEYS.SETTINGS, backup.settings);

      // Atomically update React state
      setCourses(backup.courses);
      setAssessments(backup.assessments);
      setSettings(backup.settings);
      return true;
    } catch (err) {
      console.error('[UniPlanner] Atomic restore failed:', err);
      return false;
    }
  };

  const resetToEmptyData = () => {
    setCourses([]);
    setAssessments([]);
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEYS.COURSES);
      localStorage.removeItem(STORAGE_KEYS.ASSESSMENTS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    } catch (err) {
      console.error('[UniPlanner] Error removing keys from localStorage:', err);
    }
  };

  return (
    <PlannerContext.Provider
      value={{
        activeSection,
        setActiveSection,
        courses,
        assessments,
        settings,
        isSidebarOpen,
        toggleSidebar,
        closeSidebar,

        // Language & Localization
        language,
        setLanguage,
        t,

        // Courses
        isAddCourseModalOpen,
        courseToEdit,
        openAddCourseModal,
        closeAddCourseModal,
        courseToDelete,
        openDeleteCourseModal,
        closeDeleteCourseModal,
        addCourse,
        updateCourse,
        deleteCourse,
        isDuplicateCourseCode,

        // Grading Configuration
        isGradingConfigModalOpen,
        courseForGradingConfig,
        openGradingConfigModal,
        closeGradingConfigModal,
        updateCourseGradingConfig,

        // Final Grade Operations
        isConfirmFinalGradeModalOpen,
        courseForFinalGrade,
        openConfirmFinalGradeModal,
        closeConfirmFinalGradeModal,
        updateCourseFinalGrade,

        // Assessments
        isAddAssessmentModalOpen,
        assessmentToEdit,
        preselectedCourseId,
        openAddAssessmentModal,
        closeAddAssessmentModal,
        assessmentToDelete,
        openDeleteAssessmentModal,
        closeDeleteAssessmentModal,
        addAssessment,
        updateAssessment,
        deleteAssessment,

        // Settings & Reset
        updateSettings,
        updateGpaConfig,
        resetToEmptyData,

        // Backup & Restore
        lastBackupExportTime,
        triggerExportBackup,
        restoreFromBackup,

        // PWA Install Modal
        isInstallModalOpen,
        openInstallModal,
        closeInstallModal,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
};
