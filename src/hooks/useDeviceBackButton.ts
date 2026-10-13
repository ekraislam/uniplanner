import { useEffect, useRef } from 'react';
import { usePlanner } from '../context/usePlanner';
import type { NavSection } from '../types';

interface HistoryState {
  type: 'uniplanner-section' | 'uniplanner-modal';
  section?: NavSection;
  timestamp?: number;
}

/**
 * useDeviceBackButton Hook
 * Provides seamless physical / gesture back button handling on mobile devices (Android & iOS):
 * 1. When any modal or drawer is open: pressing the back button dismisses the active modal/drawer.
 * 2. When on a sub-section (Courses, Assessments, GPA, Settings, etc.): pressing back returns to Dashboard.
 * 3. When on Dashboard with no modals open: pressing back performs normal browser behavior (exits or navigates back).
 */
export function useDeviceBackButton() {
  const {
    activeSection,
    setActiveSection,
    isSidebarOpen,
    closeSidebar,
    isAddCourseModalOpen,
    closeAddCourseModal,
    courseToDelete,
    closeDeleteCourseModal,
    isGradingConfigModalOpen,
    closeGradingConfigModal,
    isConfirmFinalGradeModalOpen,
    closeConfirmFinalGradeModal,
    isAddAssessmentModalOpen,
    closeAddAssessmentModal,
    assessmentToDelete,
    closeDeleteAssessmentModal,
    isInstallModalOpen,
    closeInstallModal,
  } = usePlanner();

  const isAnyModalOpen = Boolean(
    isSidebarOpen ||
    isAddCourseModalOpen ||
    courseToDelete ||
    isGradingConfigModalOpen ||
    isConfirmFinalGradeModalOpen ||
    isAddAssessmentModalOpen ||
    assessmentToDelete ||
    isInstallModalOpen
  );

  // Fresh mutable refs to avoid stale closures in window event listeners
  const stateRef = useRef({
    activeSection,
    isSidebarOpen,
    closeSidebar,
    isAddCourseModalOpen,
    closeAddCourseModal,
    courseToDelete,
    closeDeleteCourseModal,
    isGradingConfigModalOpen,
    closeGradingConfigModal,
    isConfirmFinalGradeModalOpen,
    closeConfirmFinalGradeModal,
    isAddAssessmentModalOpen,
    closeAddAssessmentModal,
    assessmentToDelete,
    closeDeleteAssessmentModal,
    isInstallModalOpen,
    closeInstallModal,
    isAnyModalOpen,
  });

  useEffect(() => {
    stateRef.current = {
      activeSection,
      isSidebarOpen,
      closeSidebar,
      isAddCourseModalOpen,
      closeAddCourseModal,
      courseToDelete,
      closeDeleteCourseModal,
      isGradingConfigModalOpen,
      closeGradingConfigModal,
      isConfirmFinalGradeModalOpen,
      closeConfirmFinalGradeModal,
      isAddAssessmentModalOpen,
      closeAddAssessmentModal,
      assessmentToDelete,
      closeDeleteAssessmentModal,
      isInstallModalOpen,
      closeInstallModal,
      isAnyModalOpen,
    };
  }, [
    activeSection,
    isSidebarOpen,
    closeSidebar,
    isAddCourseModalOpen,
    closeAddCourseModal,
    courseToDelete,
    closeDeleteCourseModal,
    isGradingConfigModalOpen,
    closeGradingConfigModal,
    isConfirmFinalGradeModalOpen,
    closeConfirmFinalGradeModal,
    isAddAssessmentModalOpen,
    closeAddAssessmentModal,
    assessmentToDelete,
    closeDeleteAssessmentModal,
    isInstallModalOpen,
    closeInstallModal,
    isAnyModalOpen,
  ]);

  const initialSectionRef = useRef(activeSection);
  const modalPushedRef = useRef(false);
  const isClosingViaBackRef = useRef(false);
  const isNavigatingViaPopstateRef = useRef(false);
  const prevModalOpenRef = useRef(false);
  const prevSectionRef = useRef<NavSection>(activeSection);

  // 1. Initial setup and popstate listener
  useEffect(() => {
    // Replace initial state with explicit uniplanner root section
    window.history.replaceState(
      { type: 'uniplanner-section', section: initialSectionRef.current, timestamp: Date.now() } satisfies HistoryState,
      ''
    );

    const handlePopState = (event: PopStateEvent) => {
      // If we programmatically called history.back() to clean up an on-screen closed modal, ignore this popstate
      if (isClosingViaBackRef.current) {
        isClosingViaBackRef.current = false;
        return;
      }

      const currentState = stateRef.current;

      // Case A: A modal or drawer was open when the user pressed device back
      if (currentState.isAnyModalOpen) {
        modalPushedRef.current = false;

        // Dismiss the currently open modal/drawer
        if (currentState.isSidebarOpen) {
          currentState.closeSidebar();
        } else if (currentState.isAddCourseModalOpen) {
          currentState.closeAddCourseModal();
        } else if (currentState.courseToDelete) {
          currentState.closeDeleteCourseModal();
        } else if (currentState.isGradingConfigModalOpen) {
          currentState.closeGradingConfigModal();
        } else if (currentState.isConfirmFinalGradeModalOpen) {
          currentState.closeConfirmFinalGradeModal();
        } else if (currentState.isAddAssessmentModalOpen) {
          currentState.closeAddAssessmentModal();
        } else if (currentState.assessmentToDelete) {
          currentState.closeDeleteAssessmentModal();
        } else if (currentState.isInstallModalOpen) {
          currentState.closeInstallModal();
        }
        return;
      }

      // Case B: No modal open — section navigation
      const popState = event.state as HistoryState | null;
      if (popState?.type === 'uniplanner-section' && popState.section) {
        if (popState.section !== currentState.activeSection) {
          isNavigatingViaPopstateRef.current = true;
          setActiveSection(popState.section);
        }
      } else if (!popState || popState.type !== 'uniplanner-section') {
        // If back reached the beginning of UniPlanner history, return to dashboard if not already there
        if (currentState.activeSection !== 'dashboard') {
          isNavigatingViaPopstateRef.current = true;
          setActiveSection('dashboard');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setActiveSection]);

  // 2. Track modal open / close transitions
  useEffect(() => {
    const wasOpen = prevModalOpenRef.current;
    prevModalOpenRef.current = isAnyModalOpen;

    if (!wasOpen && isAnyModalOpen) {
      // Modal just opened -> push modal state into history
      window.history.pushState(
        { type: 'uniplanner-modal', section: activeSection, timestamp: Date.now() } satisfies HistoryState,
        ''
      );
      modalPushedRef.current = true;
    } else if (wasOpen && !isAnyModalOpen) {
      // Modal just closed -> if closed via UI (Cancel / X / backdrop), pop the history entry
      if (modalPushedRef.current) {
        modalPushedRef.current = false;
        isClosingViaBackRef.current = true;
        window.history.back();
      }
    }
  }, [isAnyModalOpen, activeSection]);

  // 3. Track activeSection changes (UI clicks)
  useEffect(() => {
    const prevSection = prevSectionRef.current;
    prevSectionRef.current = activeSection;

    if (prevSection === activeSection) return;

    if (isNavigatingViaPopstateRef.current) {
      // Navigated by popstate, do not push new state
      isNavigatingViaPopstateRef.current = false;
      return;
    }

    // If modal was open and user navigated (e.g. sidebar navigation item click)
    if (modalPushedRef.current) {
      modalPushedRef.current = false;
      window.history.replaceState(
        { type: 'uniplanner-section', section: activeSection, timestamp: Date.now() } satisfies HistoryState,
        ''
      );
    } else {
      window.history.pushState(
        { type: 'uniplanner-section', section: activeSection, timestamp: Date.now() } satisfies HistoryState,
        ''
      );
    }
  }, [activeSection]);
}
