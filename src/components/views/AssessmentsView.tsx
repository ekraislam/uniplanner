import React, { useState } from 'react';
import {
  CalendarCheck,
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { usePlanner } from '../../context/usePlanner';
import { EmptyState } from '../common/EmptyState';
import {
  VALID_ASSESSMENT_TYPES,
  formatDueDate,
  isUpcomingAssessment,
} from '../../utils/storage';
import { getCourseTheme } from '../../utils/courseThemes';

export const AssessmentsView: React.FC = () => {
  const {
    courses,
    assessments,
    openAddCourseModal,
    openAddAssessmentModal,
    openDeleteAssessmentModal,
  } = usePlanner();

  // Filter states
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Filter logic
  const filteredAssessments = assessments.filter((a) => {
    const matchesCourse =
      selectedCourseFilter === 'all' || a.courseId === selectedCourseFilter;
    const matchesType =
      selectedTypeFilter === 'all' || a.type === selectedTypeFilter;
    return matchesCourse && matchesType;
  });

  return (
    <div>
      <div className="view-header">
        <div className="view-title-group">
          <h2>
            Assessments & Deliverables
            {assessments.length > 0 && (
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginLeft: '10px',
                }}
              >
                ({assessments.length} total)
              </span>
            )}
          </h2>
          <p>Track examinations, quizzes, assignments, and practical project deliverables</p>
        </div>

        {courses.length > 0 && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => openAddAssessmentModal()}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Assessment</span>
          </button>
        )}
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={32} />}
          title="Create a course before scheduling assessments"
          description="Assessments must belong to an enrolled course to organize weightings and calculate grades properly. Start by creating your first course."
          actionText="Add Your First Course"
          onAction={() => openAddCourseModal()}
        />
      ) : assessments.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck size={32} />}
          title="No assessments created yet"
          description={`You have ${courses.length} course${courses.length > 1 ? 's' : ''} enrolled. Start tracking midterms, quizzes, class tests, and project assignments.`}
          actionText="Add First Assessment"
          onAction={() => openAddAssessmentModal()}
        />
      ) : (
        <div>
          {/* Filter Bar */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14.5px', fontWeight: 700 }}>
              <Filter size={17} />
              <span>Filter:</span>
            </div>

            {/* Filter by Course */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="filter-course-select" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Course:
              </label>
              <select
                id="filter-course-select"
                className="form-select"
                style={{ padding: '8px 14px', fontSize: '14.5px', minWidth: '170px' }}
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
              >
                <option value="all">All Courses ({courses.length})</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="filter-type-select" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Type:
              </label>
              <select
                id="filter-type-select"
                className="form-select"
                style={{ padding: '8px 14px', fontSize: '14.5px', minWidth: '160px' }}
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                {VALID_ASSESSMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {(selectedCourseFilter !== 'all' || selectedTypeFilter !== 'all') && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '13.5px', marginLeft: 'auto' }}
                onClick={() => {
                  setSelectedCourseFilter('all');
                  setSelectedTypeFilter('all');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Filtered Empty State */}
          {filteredAssessments.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px dashed #cbd5e1',
                borderRadius: 'var(--radius-lg)',
                padding: '44px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                No assessments match the selected filter criteria.
              </p>
              <p style={{ fontSize: '14px', marginBottom: '16px' }}>
                Try changing the course or assessment type filter.
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '14px', padding: '8px 16px' }}
                onClick={() => {
                  setSelectedCourseFilter('all');
                  setSelectedTypeFilter('all');
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            /* Assessments Grid */
            <div className="courses-grid">
              {filteredAssessments.map((a) => {
                const targetCourse = courses.find((c) => c.id === a.courseId);
                const theme = getCourseTheme(targetCourse || { code: a.courseCode });
                const hasObtainedMarks = a.obtainedMarks !== undefined && a.obtainedMarks !== null;
                const percentage = hasObtainedMarks
                  ? Math.round(((a.obtainedMarks as number) / a.maxMarks) * 100)
                  : null;

                const displayType =
                  a.type === 'Other' && a.customType
                    ? `${a.customType} (Other)`
                    : a.type;

                const isUpcoming = isUpcomingAssessment(a);

                return (
                  <div
                    key={a.id}
                    className="course-card"
                    style={{
                      borderTopColor: theme.primary,
                      background: `linear-gradient(180deg, ${theme.bgSubtle} 0%, var(--bg-surface) 64px)`,
                    }}
                  >
                    <div>
                      {/* Header Row */}
                      <div className="course-code-row">
                        <span
                          className="course-code-tag"
                          style={{
                            backgroundColor: theme.badgeBg,
                            color: theme.text,
                            border: `1px solid ${theme.border}`,
                            fontWeight: 800,
                            fontSize: '14px',
                            padding: '5px 11px',
                          }}
                        >
                          {a.courseCode}
                        </span>
                        <span
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 600,
                            padding: '5px 11px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {displayType}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="course-name" style={{ fontSize: '19px', fontWeight: 800, marginBottom: '14px' }}>
                        {a.title}
                      </h3>

                      {/* Marks Information */}
                      <div
                        style={{
                          padding: '14px 16px',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                            {hasObtainedMarks ? 'Score' : 'Max Marks'}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                            {hasObtainedMarks ? (
                              <span>
                                {a.obtainedMarks} <span style={{ fontSize: '14.5px', color: 'var(--text-muted)', fontWeight: 600 }}>/ {a.maxMarks}</span>
                              </span>
                            ) : (
                              <span>{a.maxMarks} pts</span>
                            )}
                          </div>
                        </div>

                        <div>
                          {hasObtainedMarks ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '14.5px',
                                fontWeight: 800,
                                padding: '5px 12px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: percentage! >= 50 ? 'var(--success-bg)' : 'var(--danger-bg)',
                                color: percentage! >= 50 ? 'var(--success)' : 'var(--danger)',
                                border: `1px solid ${percentage! >= 50 ? 'var(--success-border)' : 'var(--danger-border)'}`,
                              }}
                            >
                              <CheckCircle2 size={15} />
                              <span>{percentage}%</span>
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '13.5px',
                                fontWeight: 700,
                                padding: '5px 12px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                              }}
                            >
                              <Clock size={14} />
                              <span>Results Pending</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Due Date & Timeline */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14.5px',
                          color: 'var(--text-muted)',
                          marginBottom: a.description ? '10px' : '16px',
                        }}
                      >
                        <Calendar size={16} color="var(--accent)" />
                        <span>
                          Due: <strong>{formatDueDate(a.dueDate)}</strong>
                        </span>
                        {a.dueDate && isUpcoming && (
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: 'var(--accent)',
                              backgroundColor: 'var(--primary-light)',
                              border: '1px solid var(--accent-soft)',
                              padding: '3px 9px',
                              borderRadius: 'var(--radius-full)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Clock size={13} />
                            Upcoming
                          </span>
                        )}
                      </div>

                      {/* Description if present */}
                      {a.description && (
                        <p
                          style={{
                            fontSize: '14px',
                            color: 'var(--text-muted)',
                            marginBottom: '16px',
                            lineHeight: 1.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={a.description}
                        >
                          {a.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="course-meta-footer">
                      <span style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {targetCourse?.name ? targetCourse.name.slice(0, 24) + (targetCourse.name.length > 24 ? '...' : '') : a.courseCode}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          style={{
                            color: 'var(--text-muted)',
                            padding: '9px 14px',
                            borderRadius: 'var(--radius-md)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '13.5px',
                            fontWeight: 600,
                            backgroundColor: 'var(--bg-subtle)',
                            minHeight: '42px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onClick={() => openAddAssessmentModal(a)}
                          title={`Edit ${a.title}`}
                          aria-label={`Edit ${a.title}`}
                        >
                          <Edit3 size={15} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          style={{
                            color: 'var(--danger)',
                            padding: '9px 14px',
                            borderRadius: 'var(--radius-md)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '13.5px',
                            fontWeight: 600,
                            backgroundColor: 'var(--danger-bg)',
                            border: '1px solid var(--danger-border)',
                            minHeight: '42px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onClick={() => openDeleteAssessmentModal(a)}
                          title={`Delete ${a.title}`}
                          aria-label={`Delete ${a.title}`}
                        >
                          <Trash2 size={15} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
