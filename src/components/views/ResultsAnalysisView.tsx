import React, { useState } from 'react';
import {
  TrendingUp,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Plus,
  Award,
  Layers,
  HelpCircle,
  Info,
} from 'lucide-react';
import { usePlanner } from '../../context/usePlanner';
import { EmptyState } from '../common/EmptyState';
import { StatCard } from '../common/StatCard';
import { analyzeCourseGrades } from '../../utils/gradeAnalysis';
import { getCourseTheme } from '../../utils/courseThemes';
import type { TargetGradeStatus } from '../../types';

export const ResultsAnalysisView: React.FC = () => {
  const {
    courses,
    assessments,
    openAddCourseModal,
    openAddAssessmentModal,
    openGradingConfigModal,
    openConfirmFinalGradeModal,
  } = usePlanner();

  // Selected course for detailed analysis
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => courses[0]?.id || '');
  const [selectedTargetGrade, setSelectedTargetGrade] = useState<string>('');

  // Fallback if selected course was deleted
  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  if (courses.length === 0) {
    return (
      <div>
        <div className="view-header">
          <div className="view-title-group">
            <h2>Grade Summary & Analytics</h2>
            <p>Marks breakdown, confirmed grades, and target forecasts per course</p>
          </div>
        </div>
        <EmptyState
          icon={<TrendingUp size={32} />}
          title="No courses added yet"
          description="Marks breakdown and target grade analysis are tracked per course. Start by adding your first course."
          actionText="Add Your First Course"
          onAction={() => openAddCourseModal()}
        />
      </div>
    );
  }

  // Current course analysis
  const courseAnalysis = activeCourse
    ? analyzeCourseGrades(activeCourse, assessments, selectedTargetGrade || activeCourse.targetGrade)
    : null;

  const isConfigured = activeCourse?.gradingConfig?.isComplete && courseAnalysis?.isGradingConfigured;
  const theme = getCourseTheme(activeCourse);

  // Helper for grade pill colors in the ladder
  const getGradePillStyle = (grade: string) => {
    const g = grade.toUpperCase();
    if (g.startsWith('A')) {
      return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
    }
    if (g.startsWith('B')) {
      return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' };
    }
    if (g.startsWith('C')) {
      return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' };
    }
    if (g.startsWith('D')) {
      return { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' };
    }
    return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
  };

  // Render status badge for target forecast
  const renderTargetBadge = (status: TargetGradeStatus) => {
    switch (status) {
      case 'achieved':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            <CheckCircle2 size={13} />
            <span>Target Achieved</span>
          </span>
        );
      case 'achievable':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--accent)',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            <Target size={13} />
            <span>Target Achievable</span>
          </span>
        );
      case 'impossible':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            <XCircle size={13} />
            <span>Target Unachievable</span>
          </span>
        );
      case 'pending':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--info-bg)',
              color: 'var(--info)',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            <Clock size={13} />
            <span>Results Pending</span>
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            <HelpCircle size={13} />
            <span>Setup Incomplete</span>
          </span>
        );
    }
  };

  return (
    <div>
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Grade Summary & Analytics</h2>
          <p>Marks breakdown, confirmed grades, and target forecasts per course</p>
        </div>


        {activeCourse && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => openConfirmFinalGradeModal(activeCourse)}
            >
              <Award size={15} color="var(--primary)" />
              <span>
                {activeCourse.finalGrade ? 'Update Final Grade' : 'Confirm Final Grade'}
              </span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => openGradingConfigModal(activeCourse)}
            >
              <Settings2 size={15} />
              <span>
                {isConfigured ? 'Edit Marks Distribution' : 'Configure Marks Distribution'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Course Selection & Overview Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span
            style={{
              backgroundColor: theme.badgeBg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            {activeCourse.code}
          </span>
          <select
            id="results-course-select"
            className="form-select"
            style={{ minWidth: '240px', fontWeight: 600 }}
            value={activeCourse.id}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setSelectedTargetGrade('');
            }}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name} ({c.semester})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {activeCourse.finalGrade ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success)',
                border: '1px solid var(--success-border)',
              }}
            >
              <CheckCircle2 size={13} />
              <span>Official Grade: {activeCourse.finalGrade}</span>
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: 'var(--warning-bg)',
                color: 'var(--warning)',
                border: '1px solid var(--warning-border)',
              }}
            >
              <Clock size={13} />
              <span>Grade In Progress</span>
            </span>
          )}

          <span
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: isConfigured ? 'var(--primary-light)' : 'var(--bg-subtle)',
              color: isConfigured ? 'var(--accent)' : 'var(--text-muted)',
              border: `1px solid ${isConfigured ? 'var(--primary-light)' : 'var(--border)'}`,
            }}
          >
            {isConfigured ? 'Marks Configured' : 'Marks Incomplete'}
          </span>

          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
            {activeCourse.credits} Credit Hours
          </span>
        </div>
      </div>

      {/* Unconfigured State */}
      {!isConfigured ? (
        <div className="panel-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--warning-bg)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Settings2 size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
            Grading Structure Incomplete for {activeCourse.code}
          </h3>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              maxWidth: '520px',
              margin: '0 auto 20px',
              lineHeight: 1.5,
            }}
          >
            Analysis is unavailable until a marks distribution is configured. Configure total course marks, assessment categories (e.g. Midterm, Class Tests, Assignments, Final Exam), and grade boundaries.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => openGradingConfigModal(activeCourse)}
          >
            <Settings2 size={16} />
            <span>Configure Marks Distribution</span>
          </button>
        </div>
      ) : courseAnalysis ? (
        <div>
          {/* Confirmed vs Total Marks Metrics Cards */}
          <div className="stat-grid" style={{ marginBottom: '24px' }}>
            <StatCard
              label="Assessed Work Performance"
              value={
                courseAnalysis.confirmedAssessedPercentage !== null
                  ? `${courseAnalysis.confirmedAssessedPercentage.toFixed(1)}%`
                  : '—'
              }
              subtext={
                courseAnalysis.totalAssessedMarks > 0
                  ? `${courseAnalysis.totalConfirmedMarks.toFixed(1)} / ${courseAnalysis.totalAssessedMarks.toFixed(1)} marks graded`
                  : 'No marks released yet'
              }
              icon={<Award size={22} />}
              iconBg="#eff6ff"
              iconColor="#2563eb"
            />

            <StatCard
              label="Course Total Progress"
              value={`${courseAnalysis.totalConfirmedMarks.toFixed(1)} / ${courseAnalysis.totalCourseMarks}`}
              subtext={`${courseAnalysis.confirmedTotalPercentage.toFixed(1)}% secured of course total`}
              icon={<TrendingUp size={22} />}
              iconBg="#ecfdf5"
              iconColor="#059669"
            />

            <StatCard
              label="Maximum Achievable Ceiling"
              value={`${courseAnalysis.maxMarksStillAvailable.toFixed(1)} / ${courseAnalysis.totalCourseMarks}`}
              subtext={`Ceiling: up to ${courseAnalysis.maxPossiblePercentage.toFixed(1)}% if remaining is aced`}
              icon={<Target size={22} />}
              iconBg="#f5f3ff"
              iconColor="#7c3aed"
            />

            <StatCard
              label="Remaining Marks at Stake"
              value={`${courseAnalysis.totalPendingOrUnassessedMarks.toFixed(1)} marks`}
              subtext={
                courseAnalysis.totalCourseMarks - courseAnalysis.maxMarksStillAvailable > 0
                  ? `${(courseAnalysis.totalCourseMarks - courseAnalysis.maxMarksStillAvailable).toFixed(1)} marks permanently lost`
                  : '100% marks still in play!'
              }
              icon={<Clock size={22} />}
              iconBg="#fffbeb"
              iconColor="#d97706"
            />
          </div>

          {/* Conflict Warning if assessments exceed category capacity */}
          {courseAnalysis.hasConflicts && (
            <div
              role="alert"
              style={{
                padding: '12px 18px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius-lg)',
                color: '#92400e',
                fontSize: '13.5px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
              <div style={{ lineHeight: 1.5 }}>
                <strong style={{ color: '#78350f' }}>Category Capacity Notice:</strong> Assessments in one or more categories have combined maximum marks exceeding the configured limit. Marks are capped to avoid double-counting.
              </div>
            </div>
          )}

          {/* Harmonious 2-Column Balanced Split Grid */}
          <div className="dashboard-split-grid">
            {/* Left Column: Categories Breakdown */}
            <div>
              <div className="panel-card" style={{ marginBottom: '24px' }}>
                <div className="section-header-row">
                  <h3 className="section-title">
                    <Layers size={18} color="var(--accent)" />
                    <span>Marks Categories Breakdown</span>
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Total Course: {courseAnalysis.totalCourseMarks} marks
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {courseAnalysis.categoryBreakdown.map((catItem) => {
                    const cat = catItem.category;
                    const confirmedPct = cat.maxMarks > 0 ? (catItem.confirmedMarks / cat.maxMarks) * 100 : 0;
                    const lostPct = cat.maxMarks > 0 ? (catItem.lostMarks / cat.maxMarks) * 100 : 0;

                    return (
                      <div
                        key={cat.id}
                        style={{
                          padding: '16px',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: '#ffffff',
                          boxShadow: 'var(--shadow-xs)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div>
                            <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{cat.name}</strong>
                            <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                              (Capacity: {cat.maxMarks} marks)
                            </span>
                          </div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {catItem.confirmedMarks.toFixed(1)} / {cat.maxMarks}
                          </div>
                        </div>

                        {/* Progress Bar (Confirmed / Lost / Pending) */}
                        <div
                          style={{
                            height: '8px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: 'var(--radius-full)',
                            overflow: 'hidden',
                            display: 'flex',
                            marginBottom: '10px',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, confirmedPct)}%`,
                              backgroundColor: 'var(--accent)',
                              transition: 'width 0.3s ease',
                            }}
                            title={`Confirmed: ${catItem.confirmedMarks.toFixed(1)} marks`}
                          />
                          {lostPct > 0 && (
                            <div
                              style={{
                                width: `${Math.min(100, lostPct)}%`,
                                backgroundColor: 'var(--danger)',
                                transition: 'width 0.3s ease',
                              }}
                              title={`Lost: ${catItem.lostMarks.toFixed(1)} marks`}
                            />
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '13px',
                            color: 'var(--text-dim)',
                            marginBottom: catItem.assessments.length > 0 ? '12px' : '6px',
                          }}
                        >
                          <span>Pending Capacity: <strong>{catItem.pendingCapacity.toFixed(1)} marks</strong></span>
                          {catItem.lostMarks > 0 ? (
                            <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                              Lost: {catItem.lostMarks.toFixed(1)} marks
                            </span>
                          ) : (
                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>All marks intact</span>
                          )}
                        </div>

                        {/* Linked Assessments List */}
                        {catItem.assessments.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {catItem.assessments.map((a) => (
                              <div
                                key={a.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '9px 14px',
                                  backgroundColor: 'var(--bg-subtle)',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '14px',
                                }}
                              >
                                <div>
                                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{a.title}</span>
                                  <span style={{ marginLeft: '6px', color: 'var(--text-dim)', fontSize: '13px' }}>
                                    ({a.type})
                                  </span>
                                </div>
                                <div>
                                  {a.obtainedMarks !== null && a.obtainedMarks !== undefined ? (
                                    <span style={{ fontWeight: 800, color: 'var(--success)' }}>
                                      {a.obtainedMarks} / {a.maxMarks}
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                      Pending / {a.maxMarks}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '13.5px',
                              color: 'var(--text-muted)',
                              marginTop: '8px',
                              paddingTop: '8px',
                              borderTop: '1px dashed var(--border)',
                            }}
                          >
                            <span>No assessments recorded yet in this category.</span>
                            <button
                              type="button"
                              style={{
                                color: 'var(--accent)',
                                fontWeight: 700,
                                fontSize: '13.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                              onClick={() => openAddAssessmentModal(undefined, activeCourse.id)}
                            >
                              <Plus size={14} />
                              <span>Add Assessment</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Target Grade Forecast + Visual Grade Boundaries Ladder */}
            <div>
              {/* Target Grade & What-If Calculator Card */}
              <div className="panel-card" style={{ marginBottom: '24px' }}>
                <div className="section-header-row">
                  <h3 className="section-title">
                    <Target size={18} color="var(--accent)" />
                    <span>Target Grade & Feasibility Forecast</span>
                  </h3>
                </div>

                <p style={{ fontSize: '14.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Select an academic target to calculate required performance on upcoming assessments.
                </p>

                {/* Target Selector */}
                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" htmlFor="target-grade-selector" style={{ fontSize: '14.5px', fontWeight: 700 }}>
                    Desired Target Grade:
                  </label>
                  <select
                    id="target-grade-selector"
                    className="form-select"
                    style={{ fontSize: '15px' }}
                    value={
                      selectedTargetGrade ||
                      activeCourse.targetGrade ||
                      activeCourse.gradingConfig?.gradeBoundaries[0]?.grade ||
                      ''
                    }
                    onChange={(e) => setSelectedTargetGrade(e.target.value)}
                  >
                    {activeCourse.gradingConfig?.gradeBoundaries.map((gb) => (
                      <option key={gb.grade} value={gb.grade}>
                        Grade {gb.grade} (Requires &ge; {gb.minMarks} marks)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Analysis Result Box */}
                {courseAnalysis.targetAnalysis && (
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      backgroundColor: '#fbfcfd',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                        Target: Grade {courseAnalysis.targetAnalysis.targetGrade}
                      </span>
                      {renderTargetBadge(courseAnalysis.targetAnalysis.status)}
                    </div>

                    {/* Numeric Highlights */}
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '14px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '14px',
                        textAlign: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px' }}>
                          Additional Marks Needed
                        </div>
                        <div
                          style={{
                            fontSize: '24px',
                            fontWeight: 800,
                            marginTop: '2px',
                            color:
                              courseAnalysis.targetAnalysis.status === 'impossible'
                                ? 'var(--danger)'
                                : 'var(--accent)',
                          }}
                        >
                          +{courseAnalysis.targetAnalysis.marksNeeded.toFixed(1)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px' }}>
                          Required Rate on Remaining
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                          {courseAnalysis.targetAnalysis.requiredRemainingPercentage !== null
                            ? `${courseAnalysis.targetAnalysis.requiredRemainingPercentage.toFixed(1)}%`
                            : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Explanatory Narrative */}
                    <p style={{ fontSize: '14.5px', color: 'var(--text-main)', lineHeight: 1.55, marginBottom: '14px' }}>
                      {courseAnalysis.targetAnalysis.message}
                    </p>

                    <div
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#eff6ff',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        color: '#1e40af',
                        marginBottom: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Info size={15} style={{ flexShrink: 0 }} />
                      <span>Forecast based on remaining assessments. Scores are estimates until official final release.</span>
                    </div>

                    <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      Confirmed: <strong>{courseAnalysis.totalConfirmedMarks.toFixed(1)}</strong> • Remaining Capacity:{' '}
                      <strong>{courseAnalysis.targetAnalysis.remainingAvailableMarks.toFixed(1)}</strong> • Max Achievable:{' '}
                      <strong>{courseAnalysis.maxMarksStillAvailable.toFixed(1)}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Visual Grade Boundaries Ladder Card */}
              <div className="panel-card">
                <div className="section-header-row">
                  <h4 style={{ fontSize: '16.5px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Grade Boundaries Ladder
                  </h4>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {activeCourse.gradingConfig?.gradeBoundaries.length || 0} configured tiers
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '16px' }}>
                  {activeCourse.gradingConfig?.gradeBoundaries.map((gb, i) => {
                    const isOfficial = activeCourse.finalGrade === gb.grade;
                    const minPercentage =
                      courseAnalysis.totalCourseMarks > 0
                        ? ((gb.minMarks / courseAnalysis.totalCourseMarks) * 100).toFixed(1)
                        : '—';
                    const pill = getGradePillStyle(gb.grade);

                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '11px 16px',
                          borderRadius: 'var(--radius-md)',
                          border: isOfficial ? '2px solid var(--accent)' : '1px solid var(--border)',
                          backgroundColor: isOfficial ? '#f8fafc' : '#ffffff',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '13.5px',
                              fontWeight: 800,
                              backgroundColor: pill.bg,
                              color: pill.text,
                              border: `1px solid ${pill.border}`,
                              minWidth: '38px',
                              textAlign: 'center',
                            }}
                          >
                            {gb.grade}
                          </span>
                          <span style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                            &ge; {gb.minMarks} marks
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            ({minPercentage}%)
                          </span>
                          {isOfficial && (
                            <span
                              style={{
                                padding: '3px 9px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'var(--success-bg)',
                                color: 'var(--success)',
                                fontSize: '12.5px',
                                fontWeight: 700,
                              }}
                            >
                              Official Grade
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeCourse.gradingConfig?.passingMarks !== undefined && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13.5px',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Minimum Passing Threshold:</span>
                    <strong style={{ color: 'var(--text-main)' }}>
                      {activeCourse.gradingConfig.passingMarks} marks (
                      {courseAnalysis.totalCourseMarks > 0
                        ? `${((activeCourse.gradingConfig.passingMarks / courseAnalysis.totalCourseMarks) * 100).toFixed(1)}%`
                        : '—'}
                      )
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
