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
  Flame,
  AlertTriangle,
  ShieldCheck,
  ArrowUpDown,
} from 'lucide-react';
import { usePlanner } from '../../context/usePlanner';
import { EmptyState } from '../common/EmptyState';
import {
  VALID_ASSESSMENT_TYPES,
  formatDueDate,
} from '../../utils/storage';
import { getCourseTheme } from '../../utils/courseThemes';
import {
  getDefaultPriorityForType,
  getAssessmentPriorityMeta,
  getAssessmentUrgency,
  sortAssessments,
  type AssessmentSortOption,
} from '../../utils/priorityUtils';

export const AssessmentsView: React.FC = () => {
  const {
    courses,
    assessments,
    openAddCourseModal,
    openAddAssessmentModal,
    openDeleteAssessmentModal,
    language,
    t,
  } = usePlanner();

  // Filter and Sort states
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<AssessmentSortOption>('dueDateAsc');

  // Filter logic
  const filteredAssessments = assessments.filter((a) => {
    const matchesCourse =
      selectedCourseFilter === 'all' || a.courseId === selectedCourseFilter;
    const matchesType =
      selectedTypeFilter === 'all' || a.type === selectedTypeFilter;
    const currentPriority = a.priority || getDefaultPriorityForType(a.type);
    const matchesPriority =
      selectedPriorityFilter === 'all' || currentPriority === selectedPriorityFilter;
    return matchesCourse && matchesType && matchesPriority;
  });

  // Balanced Sort logic
  const sortedAssessments = sortAssessments(filteredAssessments, sortBy);

  const hasActiveFilterOrCustomSort =
    selectedCourseFilter !== 'all' ||
    selectedTypeFilter !== 'all' ||
    selectedPriorityFilter !== 'all' ||
    sortBy !== 'dueDateAsc';

  return (
    <div>
      <div className="view-header">
        <div className="view-title-group">
          <h2>
            {t('assessments.title')}
            {assessments.length > 0 && (
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginLeft: '10px',
                }}
              >
                {t('assessments.totalCount', { count: assessments.length })}
              </span>
            )}
          </h2>
          <p>{t('assessments.subtitle')}</p>
        </div>

        {courses.length > 0 && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => openAddAssessmentModal()}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{t('assessments.addAssessment')}</span>
          </button>
        )}
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={32} />}
          title={t('assessments.addCourseFirst')}
          description={t('assessments.addCourseFirstDesc')}
          actionText={t('dashboard.addFirstCourse')}
          onAction={() => openAddCourseModal()}
        />
      ) : assessments.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck size={32} />}
          title={t('assessments.noAssessmentsAdded')}
          description={t('assessments.noAssessmentsAddedDesc', { count: courses.length, plural: courses.length > 1 ? 's' : '' })}
          actionText={t('assessments.addFirstAssessment')}
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
              <span>{t('common.filter')}:</span>
            </div>

            {/* Filter by Course */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="filter-course-select" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {t('assessments.filterCourse')}
              </label>
              <select
                id="filter-course-select"
                className="form-select"
                style={{ padding: '8px 14px', fontSize: '14.5px', minWidth: '170px' }}
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
              >
                <option value="all">{t('assessments.allCoursesCount', { count: courses.length })}</option>
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
                {t('assessments.filterType')}
              </label>
              <select
                id="filter-type-select"
                className="form-select"
                style={{ padding: '8px 14px', fontSize: '14.5px', minWidth: '160px' }}
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
              >
                <option value="all">{t('assessments.allTypes')}</option>
                {VALID_ASSESSMENT_TYPES.map((tItem) => (
                  <option key={tItem} value={tItem}>
                    {tItem}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Priority */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="filter-priority-select" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {t('assessments.filterPriority')}
              </label>
              <select
                id="filter-priority-select"
                className="form-select"
                style={{ padding: '8px 14px', fontSize: '14px', minWidth: '150px' }}
                value={selectedPriorityFilter}
                onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              >
                <option value="all">{t('assessments.allPriorities')}</option>
                <option value="high">{t('assessments.highPriorityOption')}</option>
                <option value="medium">{t('assessments.mediumPriorityOption')}</option>
                <option value="low">{t('assessments.lowPriorityOption')}</option>
              </select>
            </div>

            {/* Balanced Sort By Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>
                <ArrowUpDown size={15} />
                <label htmlFor="sort-assessments-select">{t('assessments.sortLabel')}</label>
              </div>
              <select
                id="sort-assessments-select"
                className="form-select"
                style={{ padding: '8px 14px', fontSize: '14px', minWidth: '185px' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as AssessmentSortOption)}
              >
                <option value="dueDateAsc">{t('assessments.sortDueAsc')}</option>
                <option value="priorityDesc">{t('assessments.sortPriorityDesc')}</option>
                <option value="dueDateDesc">{t('assessments.sortDueDesc')}</option>
                <option value="marksDesc">{t('assessments.sortMarksDesc')}</option>
                <option value="titleAsc">{t('assessments.sortTitleAsc')}</option>
              </select>
            </div>

            {hasActiveFilterOrCustomSort && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '13.5px' }}
                onClick={() => {
                  setSelectedCourseFilter('all');
                  setSelectedTypeFilter('all');
                  setSelectedPriorityFilter('all');
                  setSortBy('dueDateAsc');
                }}
              >
                {t('common.resetAll')}
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
                {t('assessments.noMatchTitle')}
              </p>
              <p style={{ fontSize: '14px', marginBottom: '16px' }}>
                {t('assessments.noMatchDesc')}
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '14px', padding: '8px 16px' }}
                onClick={() => {
                  setSelectedCourseFilter('all');
                  setSelectedTypeFilter('all');
                  setSelectedPriorityFilter('all');
                  setSortBy('dueDateAsc');
                }}
              >
                {t('common.clearFilters')}
              </button>
            </div>
          ) : (
            /* Assessments Grid */
            <div className="courses-grid">
              {sortedAssessments.map((a) => {
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

                const priorityMeta = getAssessmentPriorityMeta(a, language);
                const urgency = getAssessmentUrgency(a.dueDate, undefined, language);

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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {/* Priority Pill */}
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              padding: '3px 9px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: priorityMeta.bg,
                              color: priorityMeta.color,
                              border: `1px solid ${priorityMeta.border}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title={priorityMeta.description}
                          >
                            {priorityMeta.priority === 'high' && <Flame size={12} />}
                            {priorityMeta.priority === 'medium' && <AlertTriangle size={12} />}
                            {priorityMeta.priority === 'low' && <ShieldCheck size={12} />}
                            <span>{priorityMeta.label}</span>
                          </span>

                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              padding: '3px 10px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--bg-subtle)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {displayType}
                          </span>
                        </div>
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
                            {hasObtainedMarks ? t('common.score') : t('common.maxMarks')}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                            {hasObtainedMarks ? (
                              <span>
                                {a.obtainedMarks} <span style={{ fontSize: '14.5px', color: 'var(--text-muted)', fontWeight: 600 }}>/ {a.maxMarks}</span>
                              </span>
                            ) : (
                              <span>{a.maxMarks} {t('common.points')}</span>
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
                              <span>{t('common.resultsPending')}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Due Date & Urgency Timeline */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          color: 'var(--text-muted)',
                          marginBottom: a.description ? '10px' : '16px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <Calendar size={15} color="var(--accent)" />
                        <span>
                          {t('common.due')}: <strong>{formatDueDate(a.dueDate)}</strong>
                        </span>
                        {a.dueDate && (
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: '12px',
                              fontWeight: 800,
                              color: urgency.color,
                              backgroundColor: urgency.bg,
                              border: `1px solid ${urgency.border}`,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Clock size={12} />
                            {urgency.label}
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
                          title={`${t('common.edit')} ${a.title}`}
                          aria-label={`${t('common.edit')} ${a.title}`}
                        >
                          <Edit3 size={15} />
                          <span>{t('common.edit')}</span>
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
                          title={`${t('common.delete')} ${a.title}`}
                          aria-label={`${t('common.delete')} ${a.title}`}
                        >
                          <Trash2 size={15} />
                          <span>{t('common.delete')}</span>
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
