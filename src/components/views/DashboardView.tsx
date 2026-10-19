import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  CalendarCheck,
  Plus,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Flame,
  AlertTriangle,
  ShieldCheck,
  Clock,
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
import {
  getDefaultPriorityForType,
  getAssessmentPriorityMeta,
  getAssessmentUrgency,
  sortAssessments,
} from '../../utils/priorityUtils';

export const DashboardView: React.FC = () => {
  const {
    courses,
    assessments,
    settings,
    openAddCourseModal,
    setActiveSection,
    language,
    t,
  } = usePlanner();

  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

  // Filter & tab state for deadlines
  const [deadlinesTab, setDeadlinesTab] = useState<'all' | 'high' | 'week'>('all');

  // Strictly filter for valid future deadlines and sort with balanced Date & Priority algorithm
  const allUpcomingDeadlines = sortAssessments(
    assessments.filter((a) => isUpcomingAssessment(a)),
    'dueDateAsc'
  );

  // Tab filtered list
  const upcomingDeadlines = allUpcomingDeadlines.filter((a) => {
    if (deadlinesTab === 'high') {
      const p = a.priority || getDefaultPriorityForType(a.type);
      return p === 'high';
    }
    if (deadlinesTab === 'week') {
      const urgency = getAssessmentUrgency(a.dueDate, undefined, language);
      return urgency.daysDiff !== null && urgency.daysDiff >= 0 && urgency.daysDiff <= 7;
    }
    return true;
  });

  const highPriorityCount = allUpcomingDeadlines.filter(
    (a) => (a.priority || getDefaultPriorityForType(a.type)) === 'high'
  ).length;

  const thisWeekCount = allUpcomingDeadlines.filter((a) => {
    const urgency = getAssessmentUrgency(a.dueDate, undefined, language);
    return urgency.daysDiff !== null && urgency.daysDiff >= 0 && urgency.daysDiff <= 7;
  }).length;

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
          <span>{courses.length > 0 ? `${settings.currentTerm} ${t('nav.academicTerm')}` : t('dashboard.plannerReady')}</span>
        </div>
        <h2 className="welcome-heading">
          {courses.length > 0
            ? settings.studentName
              ? t('dashboard.welcomeBack', { name: settings.studentName })
              : t('dashboard.welcomeDefault')
            : t('dashboard.welcomeDefault')}
        </h2>
        <p className="welcome-text">
          {courses.length > 0 ? (
            t('dashboard.summaryText', {
              courseCount: courses.length,
              credits: totalCredits,
              deadlineCount: allUpcomingDeadlines.length,
              term: settings.currentTerm,
            })
          ) : (
            t('dashboard.emptyIntro')
          )}
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="welcome-action-btn"
            onClick={() => openAddCourseModal()}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{courses.length > 0 ? t('dashboard.addCourse') : t('dashboard.addFirstCourse')}</span>
          </button>
          {courses.length > 0 && (
            <button
              type="button"
              className="welcome-action-btn-outline"
              onClick={() => setActiveSection('assessments')}
            >
              <CalendarCheck size={16} />
              <span>{t('dashboard.viewAssessments')}</span>
            </button>
          )}
        </div>
      </section>

      {/* Top Level Metric Cards (4 Balanced Spacious Cards) */}
      <div className="stat-grid">
        <StatCard
          label={t('dashboard.cumulativeGpa')}
          value={cumulativeGpa.gpaFormatted}
          subtext={
            cumulativeGpa.confirmedCredits > 0
              ? `${cumulativeGpa.confirmedCredits} ${t('common.credits')} (${cumulativeGpa.confirmedCourses} ${t('nav.courses')})`
              : 'No confirmed grades yet'
          }
          icon={<Award size={24} />}
          iconBg="#eff6ff"
          iconColor="#2563eb"
        />
        <StatCard
          label={`${t('dashboard.estimatedTermGpa')} (${settings.currentTerm})`}
          value={semesterGpa.gpaFormatted}
          subtext={
            semesterGpa.includedCredits > 0
              ? `${semesterGpa.includedCredits} / ${semesterGpa.totalCredits} ${t('common.credits')}`
              : semesterGpa.totalCourses > 0
              ? `${semesterGpa.pendingCourses} ${t('common.pending')}`
              : 'No courses registered'
          }
          icon={<TrendingUp size={24} />}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
        <StatCard
          label={t('dashboard.enrolledCourses')}
          value={`${courses.length}`}
          subtext={`${totalCredits} ${t('common.credits')}`}
          icon={<BookOpen size={24} />}
          iconBg="#f5f3ff"
          iconColor="#7c3aed"
        />
        <StatCard
          label={t('dashboard.upcomingDeadlines')}
          value={upcomingDeadlines.length}
          subtext={
            upcomingDeadlines.length === 1
              ? `1 ${t('urgency.dueInDays', { days: 1 })}`
              : `${upcomingDeadlines.length} ${t('nav.tasks')}`
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
              <span>{t('dashboard.upcomingDeadlines')}</span>
            </h3>

            {assessments.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {allUpcomingDeadlines.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-full)',
                      padding: '3px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setDeadlinesTab('all')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '12px',
                        fontWeight: deadlinesTab === 'all' ? 800 : 600,
                        backgroundColor: deadlinesTab === 'all' ? 'var(--bg-surface)' : 'transparent',
                        color: deadlinesTab === 'all' ? 'var(--text-main)' : 'var(--text-muted)',
                        boxShadow: deadlinesTab === 'all' ? 'var(--shadow-xs)' : 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {t('dashboard.tabAll')} ({allUpcomingDeadlines.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeadlinesTab('high')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '12px',
                        fontWeight: deadlinesTab === 'high' ? 800 : 600,
                        backgroundColor: deadlinesTab === 'high' ? 'rgba(225, 29, 72, 0.12)' : 'transparent',
                        color: deadlinesTab === 'high' ? '#e11d48' : 'var(--text-muted)',
                        boxShadow: deadlinesTab === 'high' ? 'var(--shadow-xs)' : 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {t('dashboard.tabHigh')} ({highPriorityCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeadlinesTab('week')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '12px',
                        fontWeight: deadlinesTab === 'week' ? 800 : 600,
                        backgroundColor: deadlinesTab === 'week' ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                        color: deadlinesTab === 'week' ? 'var(--accent)' : 'var(--text-muted)',
                        boxShadow: deadlinesTab === 'week' ? 'var(--shadow-xs)' : 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {t('dashboard.tabWeek')} ({thisWeekCount})
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12.5px' }}
                  onClick={() => setActiveSection('assessments')}
                >
                  <span>{t('dashboard.tabAll')}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>

          {upcomingDeadlines.length === 0 ? (
            allUpcomingDeadlines.length === 0 ? (
              assessments.length === 0 ? (
                <EmptyState
                  icon={<CalendarCheck size={28} />}
                  title={t('dashboard.noDeadlinesScheduled')}
                  description={t('dashboard.noDeadlinesScheduledDesc')}
                  actionText={t('dashboard.viewAssessments')}
                  onAction={() => setActiveSection('assessments')}
                />
              ) : (
                <EmptyState
                  icon={<CalendarCheck size={28} />}
                  title={t('dashboard.noUpcomingDeadlines')}
                  description={t('dashboard.noUpcomingDeadlinesDesc', { count: assessments.length })}
                  actionText={t('dashboard.allAssessments')}
                  onAction={() => setActiveSection('assessments')}
                />
              )
            ) : (
              <div
                style={{
                  padding: '30px 20px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                }}
              >
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  {t('dashboard.noTabFilterMatch', { filter: deadlinesTab === 'high' ? t('dashboard.tabHigh') : t('dashboard.tabWeek') })}
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '12.5px', padding: '5px 12px', marginTop: '6px' }}
                  onClick={() => setDeadlinesTab('all')}
                >
                  {t('dashboard.showAllDeadlines')}
                </button>
              </div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingDeadlines.slice(0, 5).map((a) => {
                const targetCourse = courses.find((c) => c.id === a.courseId);
                const theme = getCourseTheme(targetCourse || { code: a.courseCode });
                const priorityMeta = getAssessmentPriorityMeta(a, language);
                const urgency = getAssessmentUrgency(a.dueDate, undefined, language);

                return (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `4px solid ${theme.primary}`,
                      transition: 'all 0.15s ease',
                      gap: '12px',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 800,
                            backgroundColor: theme.badgeBg,
                            color: theme.text,
                            border: `1px solid ${theme.border}`,
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          {a.courseCode}
                        </span>

                        {/* Priority Badge */}
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            backgroundColor: priorityMeta.bg,
                            color: priorityMeta.color,
                            border: `1px solid ${priorityMeta.border}`,
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          title={priorityMeta.description}
                        >
                          {priorityMeta.priority === 'high' && <Flame size={11} />}
                          {priorityMeta.priority === 'medium' && <AlertTriangle size={11} />}
                          {priorityMeta.priority === 'low' && <ShieldCheck size={11} />}
                          {priorityMeta.shortLabel}
                        </span>

                        <span style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>
                          • {a.type === 'Other' && a.customType ? a.customType : a.type}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '15.5px',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          marginTop: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={a.title}
                      >
                        {a.title}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {formatDueDate(a.dueDate)}
                        </span>
                        {urgency.daysDiff !== null && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: urgency.color,
                              backgroundColor: urgency.bg,
                              border: `1px solid ${urgency.border}`,
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-full)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <Clock size={10} />
                            {urgency.badgeLabel || urgency.label}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {t('common.maxMarks')}: {a.maxMarks} {t('common.points')}
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
