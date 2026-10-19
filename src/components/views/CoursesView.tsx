import React from 'react';
import { BookOpen, Plus, Trash2, Edit3, User, Award, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { usePlanner } from '../../context/usePlanner';
import { EmptyState } from '../common/EmptyState';
import { getCourseTheme } from '../../utils/courseThemes';

export const CoursesView: React.FC = () => {
  const {
    courses,
    assessments,
    openAddCourseModal,
    openDeleteCourseModal,
    openAddAssessmentModal,
    openConfirmFinalGradeModal,
    language,
    t,
  } = usePlanner();

  return (
    <div>
      <div className="view-header">
        <div className="view-title-group">
          <h2>
            {language === 'bn' ? 'কোর্সসমূহ' : 'Courses'}
            {courses.length > 0 && (
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginLeft: '10px',
                }}
              >
                {language === 'bn' ? `(${courses.length}টি যুক্ত)` : `(${courses.length} enrolled)`}
              </span>
            )}
          </h2>
          <p>
            {language === 'bn'
              ? 'আপনার বিষয়, ক্রেডিট এবং গ্রেড পরিচালনা করুন'
              : 'Manage your enrolled subjects, credits, and target grades'}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => openAddCourseModal()}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>{t('dashboard.addCourse')}</span>
        </button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={32} />}
          title={language === 'bn' ? 'এখনো কোনো কোর্স যুক্ত করা হয়নি' : 'No courses added yet'}
          description={
            language === 'bn'
              ? 'অ্যাসাইনমেন্ট ও পরীক্ষা ট্র্যাক করতে এবং সিজিপিএ হিসাব করতে আপনার বিষয়গুলো যোগ করুন।'
              : 'Add your courses to track assignments, exams, and calculate your GPA automatically.'
          }
          actionText={t('dashboard.addFirstCourse')}
          onAction={() => openAddCourseModal()}
        />

      ) : (
        <div className="courses-grid">
          {courses.map((course) => {
            const courseAssessments = assessments.filter(
              (a) => a.courseId === course.id
            );

            const theme = getCourseTheme(course);

            return (
              <div
                key={course.id}
                className="course-card"
                style={{
                  borderTopColor: theme.primary,
                  background: `linear-gradient(180deg, ${theme.bgSubtle} 0%, var(--bg-surface) 64px)`,
                }}
              >
                <div>
                  <div className="course-code-row">
                    <span
                      className="course-code-tag"
                      style={{
                        backgroundColor: theme.badgeBg,
                        color: theme.text,
                        border: `1px solid ${theme.border}`,
                        fontSize: '14.5px',
                        fontWeight: 800,
                        padding: '5px 11px',
                      }}
                    >
                      {course.code}
                    </span>
                    <span className="course-credits-badge" style={{ fontSize: '14.5px', fontWeight: 700 }}>
                      {course.credits} {t('common.credits')}
                    </span>
                  </div>
                  <h3 className="course-name" style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 14px' }}>
                    {course.name}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      fontSize: '15px',
                      color: 'var(--text-muted)',
                      marginBottom: '10px',
                    }}
                  >
                    <Calendar size={16} color="var(--accent)" />
                    <span>{t('settings.term')}: <strong>{course.semester}</strong></span>
                  </div>

                  {course.instructor && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        fontSize: '15px',
                        color: 'var(--text-muted)',
                        marginBottom: '10px',
                      }}
                    >
                      <User size={16} color="var(--primary)" />
                      <span>Instructor: <strong>{course.instructor}</strong></span>
                    </div>
                  )}

                  {course.targetGrade && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        fontSize: '15px',
                        color: 'var(--text-muted)',
                        marginBottom: '10px',
                      }}
                    >
                      <Award size={16} color="var(--warning)" />
                      <span>Target Grade: <strong>{course.targetGrade}</strong></span>
                    </div>
                  )}

                  {/* Assessments Count Chip & Final Grade Chip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', marginTop: '6px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: courseAssessments.length > 0 ? 'var(--accent)' : 'var(--text-dim)',
                        backgroundColor: courseAssessments.length > 0 ? 'var(--primary-light)' : 'var(--bg-subtle)',
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <FileText size={15} />
                      <span>
                        {courseAssessments.length}{' '}
                        {courseAssessments.length === 1 ? 'Assessment' : 'Assessments'}
                      </span>
                    </div>

                    {course.finalGrade && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'var(--success)',
                          backgroundColor: 'var(--success-bg)',
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <CheckCircle2 size={15} />
                        <span>Grade {course.finalGrade}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="course-meta-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      style={{
                        color: 'var(--accent)',
                        padding: '9px 15px',
                        borderRadius: 'var(--radius-md)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: 700,
                        backgroundColor: 'var(--primary-light)',
                        minHeight: '42px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => openAddAssessmentModal(undefined, course.id)}
                      title={`Add assessment for ${course.code}`}
                      aria-label={`Add assessment for ${course.code}`}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      <span>{language === 'bn' ? 'অ্যাসেসমেন্ট' : 'Assessment'}</span>
                    </button>

                    <button
                      type="button"
                      style={{
                        color: course.finalGrade ? 'var(--success)' : 'var(--text-main)',
                        padding: '9px 15px',
                        borderRadius: 'var(--radius-md)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: 700,
                        backgroundColor: course.finalGrade ? 'var(--success-bg)' : 'var(--bg-subtle)',
                        border: `1px solid ${course.finalGrade ? 'var(--success-border)' : 'var(--border)'}`,
                        minHeight: '42px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => openConfirmFinalGradeModal(course)}
                      title={`Set or update final grade for ${course.code}`}
                      aria-label={`Set final grade for ${course.code}`}
                    >
                      <Award size={16} />
                      <span>{course.finalGrade ? `${t('dashboard.gradePrefix')} ${course.finalGrade}` : t('dashboard.gradePrefix')}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      style={{
                        color: 'var(--text-muted)',
                        padding: '9px 14px',
                        borderRadius: 'var(--radius-md)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-subtle)',
                        minHeight: '42px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => openAddCourseModal(course)}
                      title={`${t('common.edit')} ${course.code}`}
                      aria-label={`${t('common.edit')} ${course.code}`}
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
                        gap: '6px',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        backgroundColor: 'var(--danger-bg)',
                        border: '1px solid var(--danger-border)',
                        minHeight: '42px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => openDeleteCourseModal(course)}
                      title={`${t('common.delete')} ${course.code}`}
                      aria-label={`${t('common.delete')} ${course.code}`}
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
  );
};
