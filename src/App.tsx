import React from 'react';
import { PlannerProvider } from './context/PlannerContext';
import { usePlanner } from './context/usePlanner';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/views/DashboardView';
import { CoursesView } from './components/views/CoursesView';
import { AssessmentsView } from './components/views/AssessmentsView';
import { ResultsAnalysisView } from './components/views/ResultsAnalysisView';
import { GpaCalculatorView } from './components/views/GpaCalculatorView';
import { SettingsView } from './components/views/SettingsView';
import { AddCourseModal } from './components/courses/AddCourseModal';
import { DeleteCourseModal } from './components/courses/DeleteCourseModal';
import { CourseGradingConfigModal } from './components/courses/CourseGradingConfigModal';
import { AddAssessmentModal } from './components/assessments/AddAssessmentModal';
import { DeleteAssessmentModal } from './components/assessments/DeleteAssessmentModal';
import { ConfirmFinalGradeModal } from './components/courses/ConfirmFinalGradeModal';
import { InstallGuideModal } from './components/common/InstallGuideModal';
import { BottomNav } from './components/layout/BottomNav';
import { MobileFab } from './components/layout/MobileFab';
import { Footer } from './components/layout/Footer';
import { useDeviceBackButton } from './hooks/useDeviceBackButton';

const AppContent: React.FC = () => {
  const { activeSection } = usePlanner();
  useDeviceBackButton();

  const renderActiveView = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardView />;
      case 'courses':
        return <CoursesView />;
      case 'assessments':
        return <AssessmentsView />;
      case 'results':
        return <ResultsAnalysisView />;
      case 'gpa-calculator':
        return <GpaCalculatorView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="main-content">
          {renderActiveView()}
        </main>
        <Footer />
      </div>
      <BottomNav />
      <MobileFab />
      <AddCourseModal />
      <DeleteCourseModal />
      <CourseGradingConfigModal />
      <AddAssessmentModal />
      <DeleteAssessmentModal />
      <ConfirmFinalGradeModal />
      <InstallGuideModal />
    </div>
  );
};

export function App() {
  return (
    <PlannerProvider>
      <AppContent />
    </PlannerProvider>
  );
}

export default App;
