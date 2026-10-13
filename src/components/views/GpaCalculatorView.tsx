import React, { useState } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  BookOpen,
  Award,
  Clock,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { usePlanner } from '../../context/usePlanner';
import { EmptyState } from '../common/EmptyState';
import {
  getDefaultGpaConfig,
  calculateSemesterGpa,
  calculateCumulativeGpa,
} from '../../utils/gpaCalculation';
import { getCourseTheme } from '../../utils/courseThemes';

interface SimCourse {
  id: string;
  name: string;
  credits: number;
  gradePoint: number;
}

export const GpaCalculatorView: React.FC = () => {
  const {
    courses,
    assessments,
    settings,
    openAddCourseModal,
    openConfirmFinalGradeModal,
  } = usePlanner();

  const gpaConfig = settings.gpaConfig || getDefaultGpaConfig(settings.gradingScale);

  // Determine available academic terms from courses
  const distinctSemesters = Array.from(new Set(courses.map((c) => c.semester))).filter(Boolean);
  const initialSemester = distinctSemesters.includes(settings.currentTerm)
    ? settings.currentTerm
    : distinctSemesters[0] || settings.currentTerm || 'Fall 2026';

  const [selectedSemester, setSelectedSemester] = useState<string>(initialSemester);

  // Inclusions/exclusions per course (courseId Set)
  const [excludedCourseIds, setExcludedCourseIds] = useState<Set<string>>(new Set());

  // What-If temporary grades (courseId -> hypothetical grade label)
  // These are strictly kept in React component state and NEVER saved to courses or localStorage!
  const [simulatedGrades, setSimulatedGrades] = useState<Record<string, string>>({});

  // Ad-hoc sandbox courses (scratch simulator)
  const [sandboxCourses, setSandboxCourses] = useState<SimCourse[]>([]);
  const [sandboxName, setSandboxName] = useState('');
  const [sandboxCredits, setSandboxCredits] = useState('3');
  const [sandboxGradePoint, setSandboxGradePoint] = useState('4.0');
  const [showSandbox, setShowSandbox] = useState(false);

  // Toggle course inclusion in semester GPA calculation
  const handleToggleInclude = (courseId: string) => {
    setExcludedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  // Set what-if hypothetical grade
  const handleSetSimGrade = (courseId: string, grade: string) => {
    setSimulatedGrades((prev) => {
      if (!grade) {
        const next = { ...prev };
        delete next[courseId];
        return next;
      }
      return { ...prev, [courseId]: grade };
    });
  };

  // Reset simulation back to actual confirmed grades
  const handleResetSimulation = () => {
    setSimulatedGrades({});
  };

  // Calculate Semester GPA
  const semesterGpa = calculateSemesterGpa(
    courses,
    assessments,
    selectedSemester,
    gpaConfig,
    excludedCourseIds,
    simulatedGrades
  );

  // Calculate Cumulative GPA across all confirmed courses in all terms
  const cumulativeGpa = calculateCumulativeGpa(courses, gpaConfig);

  // Handle ad-hoc sandbox additions
  const handleAddSandboxCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxName.trim()) return;

    setSandboxCourses((prev) => [
      ...prev,
      {
        id: 'sb_' + Date.now(),
        name: sandboxName.trim(),
        credits: parseFloat(sandboxCredits) || 3,
        gradePoint: parseFloat(sandboxGradePoint) || 4.0,
      },
    ]);

    setSandboxName('');
    setSandboxCredits('3');
  };

  const handleRemoveSandboxCourse = (id: string) => {
    setSandboxCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const totalSandboxCredits = sandboxCourses.reduce((sum, c) => sum + c.credits, 0);
  const totalSandboxQualityPoints = sandboxCourses.reduce((sum, c) => sum + c.credits * c.gradePoint, 0);
  const calculatedSandboxGpa =
    totalSandboxCredits > 0 ? (totalSandboxQualityPoints / totalSandboxCredits).toFixed(2) : '0.00';

  if (courses.length === 0) {
    return (
      <div>
        <div className="view-header">
          <div className="view-title-group">
            <h2>Semester GPA & What-If Simulator</h2>
            <p>Compute weighted semester GPA and simulate prospective grade scenarios</p>
          </div>
        </div>

        {/* GPA Summary Board */}
        <div className="gpa-summary-card" style={{ marginBottom: '24px' }}>
          <div className="gpa-summary-stat">
            <div className="gpa-big-number">—</div>
            <div className="gpa-stat-title">Semester Confirmed GPA</div>
          </div>
          <div className="gpa-summary-stat">
            <div className="gpa-big-number" style={{ color: '#fed7aa' }}>
              —
            </div>
            <div className="gpa-stat-title">Cumulative GPA</div>
          </div>
          <div className="gpa-summary-stat">
            <div className="gpa-big-number" style={{ color: '#a7f3d0' }}>
              0
            </div>
            <div className="gpa-stat-title">Enrolled Credits</div>
          </div>
        </div>

        <EmptyState
          icon={<BookOpen size={32} />}
          title="No registered courses in planner"
          description="Your official academic record currently has 0 registered courses. Add your courses with their credit hours to compute your weighted semester GPA."
          actionText="Add Course to Planner"
          onAction={() => openAddCourseModal()}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="view-header">
        <div className="view-title-group">
          <h2>Semester GPA & What-If Simulator</h2>
          <p>Compute weighted semester GPA, confirm official grades, and simulate projections</p>
        </div>
      </div>

      {/* Top Level Metric Summary Cards */}
      <div className="gpa-summary-card" style={{ marginBottom: '24px' }}>
        <div className="gpa-summary-stat">
          <div className="gpa-big-number">
            {semesterGpa.includedCredits > 0 ? semesterGpa.gpaFormatted : '—'}
          </div>
          <div className="gpa-stat-title">Semester Confirmed GPA</div>
          <span style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '6px', display: 'block' }}>
            {semesterGpa.includedCredits > 0
              ? `${semesterGpa.includedCredits} credits (${semesterGpa.includedCourses} courses finalized)`
              : `Pending final grades (${semesterGpa.pendingCourses} in progress)`}
          </span>
        </div>

        <div className="gpa-summary-stat">
          <div
            className="gpa-big-number"
            style={{ color: semesterGpa.isSimulating ? '#fbbf24' : '#94a3b8' }}
          >
            {semesterGpa.isSimulating ? semesterGpa.simulatedGpaFormatted : '—'}
          </div>
          <div className="gpa-stat-title">
            {semesterGpa.isSimulating ? 'What-If Projected GPA' : 'Projected GPA (Inactive)'}
          </div>
          <span style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '6px', display: 'block' }}>
            {semesterGpa.isSimulating
              ? `${semesterGpa.simulatedCoursesCount} hypothetical grade(s) tested`
              : 'Pick hypothetical grades in table'}
          </span>
        </div>

        <div className="gpa-summary-stat">
          <div className="gpa-big-number" style={{ color: '#38bdf8' }}>
            {cumulativeGpa.confirmedCredits > 0 ? cumulativeGpa.gpaFormatted : '—'}
          </div>
          <div className="gpa-stat-title">Cumulative Career GPA</div>
          <span style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '6px', display: 'block' }}>
            {cumulativeGpa.confirmedCredits > 0
              ? `${cumulativeGpa.confirmedCredits} credits completed (${cumulativeGpa.confirmedCourses} courses)`
              : 'No completed terms yet'}
          </span>
        </div>

        <div className="gpa-summary-stat">
          <div className="gpa-big-number" style={{ color: '#34d399' }}>
            {semesterGpa.totalCredits}
          </div>
          <div className="gpa-stat-title">Enrolled Credits</div>
          <span style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '6px', display: 'block' }}>
            {semesterGpa.items.length} course(s) • {semesterGpa.pendingCredits} cr pending
          </span>
        </div>
      </div>

      {/* Semester Selector & Simulation Reset Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <label
            htmlFor="semester-select"
            style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}
          >
            Academic Term:
          </label>
          <select
            id="semester-select"
            className="form-select"
            style={{ minWidth: '220px', fontWeight: 600, fontSize: '15px' }}
            value={selectedSemester}
            onChange={(e) => {
              setSelectedSemester(e.target.value);
              setSimulatedGrades({});
            }}
          >
            {distinctSemesters.map((term) => (
              <option key={term} value={term}>
                {term} ({courses.filter((c) => c.semester === term).length} courses)
              </option>
            ))}
            <option value="__ALL__">All Enrolled Terms ({courses.length} courses)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {semesterGpa.isSimulating && (
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '14px', padding: '8px 14px', color: 'var(--accent)', fontWeight: 600 }}
              onClick={handleResetSimulation}
            >
              <RotateCcw size={15} />
              <span>Reset Simulation</span>
            </button>
          )}

          <span
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13.5px',
              fontWeight: 700,
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            Scale Max: {gpaConfig.scaleMax} pts
          </span>
        </div>
      </div>

      {/* Simulation Active Notice */}
      {semesterGpa.isSimulating && (
        <div
          role="status"
          style={{
            padding: '16px 20px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-lg)',
            color: '#92400e',
            fontSize: '14.5px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={20} color="#d97706" style={{ flexShrink: 0 }} />
            <span style={{ lineHeight: 1.5 }}>
              <strong>What-If Simulation Active:</strong> Projected GPA of{' '}
              <strong style={{ fontSize: '15.5px' }}>{semesterGpa.simulatedGpaFormatted}</strong> is a temporary projection based on{' '}
              {semesterGpa.simulatedCoursesCount} hypothetical grade(s). Real records and marks remain completely intact.
            </span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '13.5px', padding: '6px 14px', whiteSpace: 'nowrap' }}
            onClick={handleResetSimulation}
          >
            Clear Hypotheses
          </button>
        </div>
      )}

      {/* Empty State when no courses in selected semester */}
      {semesterGpa.items.length === 0 ? (
        <div className="panel-card" style={{ textAlign: 'center', padding: '44px 20px', marginBottom: '24px' }}>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
            No courses are registered under term "{selectedSemester}".
          </p>
        </div>
      ) : (
        /* Courses Table for Selected Semester (Streamlined Responsive Design) */
        <div className="panel-card" style={{ marginBottom: '24px' }}>
          <div className="section-header-row">
            <h3 className="section-title">
              <BookOpen size={20} color="var(--accent)" />
              <span>
                Enrolled Courses in {selectedSemester === '__ALL__' ? 'All Terms' : selectedSemester} ({semesterGpa.items.length})
              </span>
            </h3>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {semesterGpa.includedCourses} finalized • {semesterGpa.pendingCourses} pending final grades
            </span>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', fontSize: '14.5px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>Course</th>
                  <th style={{ padding: '14px 18px', width: '110px', fontWeight: 700 }}>Credits</th>
                  <th style={{ padding: '14px 18px', minWidth: '190px', fontWeight: 700 }}>Official Grade</th>
                  <th style={{ padding: '14px 18px', minWidth: '200px', fontWeight: 700 }}>What-If Simulation</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right', width: '160px', fontWeight: 700 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {semesterGpa.items.map((item) => {
                  const targetCourse = courses.find((c) => c.id === item.courseId);
                  const theme = getCourseTheme(targetCourse || { code: item.courseCode, color: item.color });

                  return (
                    <tr
                      key={item.courseId}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: !item.isIncluded ? '#f8fafc' : undefined,
                        opacity: !item.isIncluded ? 0.65 : 1,
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Course: Checkbox + Color Badge + Code + Name */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={item.isIncluded}
                            onChange={() => handleToggleInclude(item.courseId)}
                            title={item.isIncluded ? 'Click to exclude from semester GPA' : 'Click to include in semester GPA'}
                            aria-label={`Include ${item.courseCode} in GPA calculation`}
                            style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                          />
                          <span
                            style={{
                              backgroundColor: theme.badgeBg,
                              color: theme.text,
                              border: `1px solid ${theme.border}`,
                              padding: '4px 9px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '13.5px',
                              fontWeight: 800,
                              fontFamily: 'var(--font-heading)',
                              letterSpacing: '0.02em',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.courseCode}
                          </span>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.35 }}>
                              {item.courseName}
                            </div>
                            {!item.isIncluded && (
                              <span style={{ fontSize: '12.5px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                Excluded from calculation
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Credits */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 11px',
                            backgroundColor: 'var(--bg-subtle)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                          }}
                        >
                          {item.credits} cr
                        </span>
                      </td>

                      {/* Official Grade */}
                      <td style={{ padding: '14px 18px' }}>
                        {item.confirmedGrade ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'var(--success-bg)',
                                color: 'var(--success)',
                                fontWeight: 700,
                                fontSize: '14px',
                                width: 'fit-content',
                              }}
                            >
                              <CheckCircle2 size={14} />
                              <span>Grade {item.confirmedGrade} ({item.confirmedGradePoint?.toFixed(2)} pts)</span>
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 11px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'var(--warning-bg)',
                                color: 'var(--warning)',
                                fontWeight: 700,
                                fontSize: '13px',
                                width: 'fit-content',
                              }}
                            >
                              <Clock size={13} />
                              <span>Awaiting Final Grade</span>
                            </span>
                            {item.estimatedPercentageFromMarks !== undefined && (
                              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                                Class mark: <strong>{item.estimatedPercentageFromMarks.toFixed(1)}%</strong> (~{item.estimatedGradeFromMarks || 'Pass'})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* What-If Simulation Selector */}
                      <td style={{ padding: '14px 18px' }}>
                        {item.isPending ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <select
                              className="form-select"
                              style={{
                                padding: '7px 12px',
                                fontSize: '14px',
                                minWidth: '170px',
                                backgroundColor: item.simulatedGrade ? '#fefce8' : 'var(--bg-surface)',
                                borderColor: item.simulatedGrade ? '#f59e0b' : 'var(--border)',
                                fontWeight: item.simulatedGrade ? 700 : 500,
                                color: item.simulatedGrade ? '#92400e' : 'var(--text-main)',
                              }}
                              value={item.simulatedGrade || ''}
                              onChange={(e) => handleSetSimGrade(item.courseId, e.target.value)}
                              aria-label={`Hypothetical grade for ${item.courseCode}`}
                            >
                              <option value="">— Try What-If Grade —</option>
                              {gpaConfig.rules.map((r) => (
                                <option key={r.grade} value={r.grade}>
                                  {r.grade} ({r.gradePoint.toFixed(2)} pts)
                                </option>
                              ))}
                            </select>
                            {item.simulatedGrade && (
                              <button
                                type="button"
                                onClick={() => handleSetSimGrade(item.courseId, '')}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  color: 'var(--text-dim)',
                                  cursor: 'pointer',
                                  padding: '5px',
                                  fontSize: '15px',
                                  lineHeight: 1,
                                }}
                                title="Clear hypothetical grade"
                                aria-label="Clear hypothetical grade"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ) : (
                          /* Confirmed Course Retake Simulator */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <select
                                className="form-select"
                                style={{
                                  padding: '7px 12px',
                                  fontSize: '14px',
                                  minWidth: '170px',
                                  backgroundColor:
                                    item.simulatedGrade && item.simulatedGrade !== item.confirmedGrade
                                      ? '#fefce8'
                                      : 'var(--bg-surface)',
                                  borderColor:
                                    item.simulatedGrade && item.simulatedGrade !== item.confirmedGrade
                                      ? '#f59e0b'
                                      : 'var(--border)',
                                  fontWeight:
                                    item.simulatedGrade && item.simulatedGrade !== item.confirmedGrade
                                      ? 700
                                      : 500,
                                  color:
                                    item.simulatedGrade && item.simulatedGrade !== item.confirmedGrade
                                      ? '#92400e'
                                      : 'var(--text-main)',
                                }}
                                value={item.simulatedGrade || ''}
                                onChange={(e) => handleSetSimGrade(item.courseId, e.target.value)}
                                aria-label={`Simulate retake grade for ${item.courseCode}`}
                              >
                                <option value="">— Official ({item.confirmedGrade}) —</option>
                                {gpaConfig.rules.map((r) => (
                                  <option key={r.grade} value={r.grade}>
                                    {r.grade === item.confirmedGrade
                                      ? `✓ Official: ${r.grade} (${r.gradePoint.toFixed(2)} pts)`
                                      : `Retake: ${r.grade} (${r.gradePoint.toFixed(2)} pts)`}
                                  </option>
                                ))}
                              </select>
                              {item.simulatedGrade && item.simulatedGrade !== item.confirmedGrade && (
                                <button
                                  type="button"
                                  onClick={() => handleSetSimGrade(item.courseId, '')}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    color: 'var(--text-dim)',
                                    cursor: 'pointer',
                                    padding: '5px',
                                    fontSize: '15px',
                                    lineHeight: 1,
                                  }}
                                  title="Reset to official confirmed grade"
                                  aria-label="Reset to official confirmed grade"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            {item.simulatedGrade && item.simulatedGrade !== item.confirmedGrade && (
                              <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 700 }}>
                                Testing retake: {item.simulatedGrade} (Official: {item.confirmedGrade})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {targetCourse && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{
                              fontSize: '13.5px',
                              padding: '7px 13px',
                              fontWeight: 600,
                              gap: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              minHeight: '38px',
                            }}
                            onClick={() => openConfirmFinalGradeModal(targetCourse)}
                          >
                            <Award size={14} color="var(--primary)" />
                            <span>{item.confirmedGrade ? 'Update Grade' : 'Set Final Grade'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mathematical Audit Breakdown */}
          <div
            style={{
              marginTop: '18px',
              padding: '16px 20px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              fontSize: '14px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calculator size={17} color="var(--primary)" />
              {semesterGpa.includedCredits > 0 ? (
                <span>
                  <strong>Official GPA Calculation:</strong> Quality Points (
                  <strong>{semesterGpa.totalQualityPoints.toFixed(2)}</strong>) &divide; Included Credits (
                  <strong>{semesterGpa.includedCredits.toFixed(1)}</strong>) ={' '}
                  <strong style={{ color: 'var(--accent)', fontSize: '15px' }}>
                    {semesterGpa.gpaFormatted} GPA
                  </strong>
                </span>
              ) : (
                <span>
                  Official GPA computes automatically when final course grades are confirmed. Pending courses are safely excluded.
                </span>
              )}
            </div>

            {semesterGpa.pendingCourses > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px' }}>
                <HelpCircle size={15} color="var(--text-dim)" />
                <span>
                  {semesterGpa.pendingCourses} in-progress course(s). Use <strong>What-If Simulation</strong> above to preview projected GPA.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Ad-hoc Sandbox Simulator (Collapsible Scratchpad) */}
      <div className="panel-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            cursor: 'pointer',
          }}
          onClick={() => setShowSandbox((prev) => !prev)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Calculator size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Hypothetical Course Scratchpad
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Test prospective electives or future terms not yet enrolled in your planner
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px', gap: '6px' }}
            onClick={(e) => {
              e.stopPropagation();
              setShowSandbox((prev) => !prev);
            }}
          >
            {showSandbox ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{showSandbox ? 'Hide Scratchpad' : 'Open Scratchpad'}</span>
          </button>
        </div>

        {showSandbox && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <form onSubmit={handleAddSandboxCourse} className="form-grid" style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="sandbox-course-name">Course Name / Code</label>
                <input
                  id="sandbox-course-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Advanced Machine Learning"
                  value={sandboxName}
                  onChange={(e) => setSandboxName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sandbox-credits">Credit Hours</label>
                <select
                  id="sandbox-credits"
                  className="form-select"
                  value={sandboxCredits}
                  onChange={(e) => setSandboxCredits(e.target.value)}
                >
                  <option value="1">1 Credit</option>
                  <option value="2">2 Credits</option>
                  <option value="3">3 Credits</option>
                  <option value="4">4 Credits</option>
                  <option value="5">5 Credits</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sandbox-grade">Anticipated Grade</label>
                <select
                  id="sandbox-grade"
                  className="form-select"
                  value={sandboxGradePoint}
                  onChange={(e) => setSandboxGradePoint(e.target.value)}
                >
                  {gpaConfig.rules.map((r) => (
                    <option key={r.grade} value={r.gradePoint}>
                      {r.grade} ({r.gradePoint.toFixed(2)} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ height: '42px', justifyContent: 'center' }}
                >
                  <Plus size={16} />
                  <span>Simulate Course</span>
                </button>
              </div>
            </form>

            {sandboxCourses.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                No scratchpad courses added. Add prospective courses above to test hypothetical scenarios.
              </div>
            ) : (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--primary-light)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '12px',
                    fontSize: '13px',
                    color: 'var(--primary)',
                    fontWeight: 600,
                  }}
                >
                  <span>Scratchpad Projected GPA: <strong>{calculatedSandboxGpa}</strong></span>
                  <span>Simulated Credits: <strong>{totalSandboxCredits}</strong></span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sandboxCourses.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '13.5px' }}>{c.name}</strong>
                        <span style={{ marginLeft: '10px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                          ({c.credits} Credits • {c.gradePoint.toFixed(2)} pts)
                        </span>
                      </div>
                      <button
                        type="button"
                        style={{ color: 'var(--text-dim)', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => handleRemoveSandboxCourse(c.id)}
                        aria-label="Remove simulated course"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
