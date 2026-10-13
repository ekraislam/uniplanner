import React from 'react';
import {
  BookOpen,
  Award,
  CalendarCheck,
  Plus,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { usePlanner } from '../../context/usePlanner';
import { StatCard } from '../common/StatCard';
import { EmptyState } from '../common/EmptyState';
import { isUpcomingAssessment, formatDueDate } from '../../utils/storage';
import {
  getDefaultGpaConfig,
  calculateSemesterGpa,
  calculateCumulativeGpa,
} from '../../utils/gpaCalculation';
import { getCourseTheme } from '../../utils/courseThemes';

export const DashboardView: React.FC = () => {
  const {
    courses,
    assessments,
    settings,
    openAddCourseModal,
    setActiveSection,
  } = usePlanner();

  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

  // Strictly filter for valid future deadlines (excludes overdue and assessments without due dates)
  const upcomingDeadlines = assessments
    .filter((a) => isUpcomingAssessment(a))
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  // GPA calculations
  const gpaConfig = settings.gpaConfig || getDefaultGpaConfig(settings.gradingScale);
  const cumulativeGpa = calculateCumulativeGpa(courses, gpaConfig);
  const semesterGpa = calculateSemesterGpa(
    courses,
    assessments,
    settings.currentTerm,
    gpaConfig
  );

  return (
    <div>
      {/* Top Welcome Banner */}
      <section className="welcome-banner">
        <div className="welcome-tag">
          <Sparkles size={14} />
          <span>{courses.length > 0 ? `${settings.currentTerm} Academic Term` : 'Academic Planner Ready'}</span>
        </div>
        <h2 className="welcome-heading">
          {courses.length > 0
            ? settings.studentName
              ? `Welcome back, ${settings.studentName}`
              : 'Welcome to UniPlanner'
            : 'Welcome to UniPlanner'}
        </h2>
        <p className="welcome-text">
          {courses.length > 0 ? (
            <>
              You have <strong>{courses.length} enrolled courses</strong> ({totalCredits} credits) and{' '}
              <strong>{upcomingDeadlines.length} upcoming deadlines</strong> in {settings.currentTerm}. Keep up the great work!
            </>
          ) : (
            'UniPlanner helps you organize your subjects, track quiz and exam deadlines, and calculate your GPA automatically.'
          )}
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="welcome-action-btn"
            onClick={() => openAddCourseModal()}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{courses.length > 0 ? 'Add Course' : 'Add Your First Course'}</span>
          </button>
          {courses.length > 0 && (
            <button
              type="button"
              className="welcome-action-btn-outline"
              onClick={() => setActiveSection('assessments')}
            >
              <CalendarCheck size={16} />
              <span>View Deadlines</span>
            </button>
          )}
        </div>
      </section>

      {/* Top Level Metric Cards (4 Balanced Spacious Cards) */}
      <div className="stat-grid">
        <StatCard
          label="Overall CGPA"
          value={cumulativeGpa.gpaFormatted}
          subtext={
            cumulativeGpa.confirmedCredits > 0
              ? `${cumulativeGpa.confirmedCredits} credits completed (${cumulativeGpa.confirmedCourses} courses)`
              : 'No confirmed grades yet'
          }
          icon={<Award size={24} />}
          iconBg="#eff6ff"
          iconColor="#2563eb"
        />
        <StatCard
          label={`Term GPA (${settings.currentTerm})`}
          value={semesterGpa.gpaFormatted}
          subtext={
            semesterGpa.includedCredits > 0
              ? `${semesterGpa.includedCredits} / ${semesterGpa.totalCredits} credits confirmed`
              : semesterGpa.totalCourses > 0
              ? `${semesterGpa.pendingCourses} courses in progress`
              : 'No courses registered'
          }
          icon={<TrendingUp size={24} />}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
        <StatCard
          label="Enrolled Courses"
          value={`${courses.length} Courses`}
          subtext={`${totalCredits} total credit hours`}
          icon={<BookOpen size={24} />}
          iconBg="#f5f3ff"
          iconColor="#7c3aed"
        />
        <StatCard
          label="Upcoming Deadlines"
          value={upcomingDeadlines.length}
          subtext={
            upcomingDeadlines.length === 1
              ? '1 assessment due soon'
              : `${upcomingDeadlines.length} assessments scheduled`
          }
          icon={<CalendarCheck size={24} />}
          iconBg="#fffbeb"
          iconColor="#d97706"
        />
      </div>

      {/* 3-Step Guided Onboarding (Only shown when no courses are added yet) */}
      {courses.length === 0 && (
        <section className="onboarding-section">
          <div className="section-header-row">
            <h3 className="section-title">
              Getting Started with UniPlanner
            </h3>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              3 simple steps
            </span>
          </div>

          <div className="onboarding-grid">
            <div className="step-card">
              <div className="step-badge">1</div>
              <h4 className="step-title">1. Create Your Courses</h4>
              <p className="step-desc">
                Input your course codes, credit weights, and professor information to build your semester schedule.
              </p>
            </div>

            <div className="step-card">
              <div className="step-badge">2</div>
              <h4 className="step-title">2. Log Assessments</h4>
              <p className="step-desc">
                Add your class tests, quizzes, midterms, lab reports, and assignments with maximum and obtained marks.
              </p>
            </div>

            <div className="step-card">
              <div className="step-badge">3</div>
              <h4 className="step-title">3. Track Results & GPA</h4>
              <p className="step-desc">
                Input marks as they are released to automatically monitor semester progress and upcoming deadlines.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Split Grid: Courses Overview & Deadlines Overview */}
      <div className="dashboard-split-grid">
        {/* Enrolled Courses Card */}
        <div className="panel-card">
          <div className="section-header-row">
            <h3 className="section-title">
              <BookOpen size={18} color="var(--accent)" />
              <span>Current Courses</span>
            </h3>
            {courses.length > 0 && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12.5px' }}
                onClick={() => setActiveSection('courses')}
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          {courses.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={28} />}
              title="No courses enrolled yet"
              description="Your semester schedule is currently empty. Add your first course to track grades, lectures, and upcoming exams."
              actionText="Add Course"
              onAction={() => openAddCourseModal()}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {courses.slice(0, 4).map((c) => {
                const theme = getCourseTheme(c);
                return (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 18px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `4px solid ${theme.primary}`,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 800,
                          backgroundColor: theme.badgeBg,
                          color: theme.text,
                          border: `1px solid ${theme.border}`,
                          padding: '3px 9px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-block',
                          marginBottom: '4px',
                        }}
                      >
                        {c.code}
                      </span>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {c.name}
                      </div>
                    </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {c.credits} Credits
                    </span>
                    <div style={{ marginTop: '3px' }}>
                      {c.finalGrade ? (
                        <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--success)' }}>
                          Grade {c.finalGrade}
                        </span>
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines Card */}
        <div className="panel-card">
          <div className="section-header-row">
            <h3 className="section-title">
              <CalendarCheck size={18} color="var(--warning)" />
              <span>Upcoming Deadlines</span>
            </h3>
            {assessments.length > 0 && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '7px 14px', fontSize: '13.5px' }}
                onClick={() => setActiveSection('assessments')}
              >
                <span>All Assessments</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          {upcomingDeadlines.length === 0 ? (
            assessments.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck size={28} />}
                title="No deadlines scheduled"
                description="Once you have courses added, you can log assignments, midterms, and project due dates here."
                actionText="View Assessments"
                onAction={() => setActiveSection('assessments')}
              />
            ) : (
              <EmptyState
                icon={<CalendarCheck size={28} />}
                title="No upcoming deadlines"
                description={`You have ${assessments.length} assessment${assessments.length > 1 ? 's' : ''}, but none have valid upcoming due dates.`}
                actionText="View All Assessments"
                onAction={() => setActiveSection('assessments')}
              />
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingDeadlines.slice(0, 4).map((a) => {
                const targetCourse = courses.find((c) => c.id === a.courseId);
                const theme = getCourseTheme(targetCourse || { code: a.courseCode });

                return (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 18px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `4px solid ${theme.primary}`,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            backgroundColor: theme.badgeBg,
                            color: theme.text,
                            border: `1px solid ${theme.border}`,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          {a.courseCode}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                          • {a.type === 'Other' && a.customType ? a.customType : a.type}
                        </span>
                      </div>
                      <div style={{ fontSize: '16.5px', fontWeight: 700, color: 'var(--text-main)', marginTop: '3px' }}>
                        {a.title}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {formatDueDate(a.dueDate)}
                      </div>
                      <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Max: {a.maxMarks} pts
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
