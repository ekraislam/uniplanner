import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { usePlanner } from '../../context/usePlanner';
import type { Assessment, AssessmentType, AssessmentPriority } from '../../types';
import { VALID_ASSESSMENT_TYPES } from '../../utils/storage';
import { getDefaultPriorityForType, PRIORITY_CONFIG, PRIORITY_CONFIG_BN } from '../../utils/priorityUtils';
import { Flame, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AssessmentFormProps {
  assessmentToEdit: Assessment | null;
  defaultCourseId: string | null;
  onClose: () => void;
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({
  assessmentToEdit,
  defaultCourseId,
  onClose,
}) => {
  const { courses, addAssessment, updateAssessment, language, t } = usePlanner();

  const [title, setTitle] = useState(assessmentToEdit ? assessmentToEdit.title : '');
  const [courseId, setCourseId] = useState(
    assessmentToEdit ? assessmentToEdit.courseId : (defaultCourseId || (courses[0]?.id || ''))
  );
  const [type, setType] = useState<AssessmentType>(
    assessmentToEdit ? assessmentToEdit.type : 'Assignment'
  );
  const [customType, setCustomType] = useState(assessmentToEdit?.customType || '');
  const [maxMarks, setMaxMarks] = useState(
    assessmentToEdit ? String(assessmentToEdit.maxMarks) : '100'
  );
  const [obtainedMarks, setObtainedMarks] = useState(
    assessmentToEdit && assessmentToEdit.obtainedMarks !== undefined && assessmentToEdit.obtainedMarks !== null
      ? String(assessmentToEdit.obtainedMarks)
      : ''
  );
  const [categoryId, setCategoryId] = useState(assessmentToEdit?.categoryId || '');
  const [dueDate, setDueDate] = useState(assessmentToEdit?.dueDate || '');
  const [description, setDescription] = useState(assessmentToEdit?.description || '');
  const [priority, setPriority] = useState<AssessmentPriority>(
    assessmentToEdit?.priority ||
      getDefaultPriorityForType(assessmentToEdit ? assessmentToEdit.type : 'Assignment')
  );
  const [hasManuallyChangedPriority, setHasManuallyChangedPriority] = useState<boolean>(
    Boolean(assessmentToEdit?.priority)
  );

  // Field-level error messages
  const [errors, setErrors] = useState<{
    title?: string;
    courseId?: string;
    type?: string;
    customType?: string;
    maxMarks?: string;
    obtainedMarks?: string;
    dueDate?: string;
    general?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    // Title validation
    if (!title.trim()) {
      newErrors.title = 'Assessment title is required (e.g. Midterm Examination, Assignment 1).';
    }

    // Course selection validation
    if (!courseId) {
      newErrors.courseId = 'Please select a course for this assessment.';
    } else if (!courses.some((c) => c.id === courseId)) {
      newErrors.courseId = 'Selected course is no longer available. Please select an existing course.';
    }

    // Custom type validation if 'Other' selected
    if (type === 'Other' && !customType.trim()) {
      newErrors.customType = 'Please specify the custom assessment type (e.g. Case Study, Viva).';
    }

    // Maximum marks validation
    const parsedMax = parseFloat(maxMarks);
    if (!maxMarks.trim() || isNaN(parsedMax) || parsedMax <= 0) {
      newErrors.maxMarks = 'Maximum marks must be a valid number greater than 0.';
    }

    // Obtained marks validation (optional, but if provided must be >= 0 and <= maxMarks)
    if (obtainedMarks.trim() !== '') {
      const parsedObtained = parseFloat(obtainedMarks);
      if (isNaN(parsedObtained) || parsedObtained < 0) {
        newErrors.obtainedMarks = 'Obtained marks cannot be negative.';
      } else if (!isNaN(parsedMax) && parsedMax > 0 && parsedObtained > parsedMax) {
        newErrors.obtainedMarks = `Obtained marks cannot exceed maximum marks (${parsedMax}).`;
      }
    }

    // Due date validation (optional, but if provided must be valid calendar date)
    if (dueDate.trim() !== '') {
      const parts = dueDate.trim().split('-');
      if (parts.length !== 3) {
        newErrors.dueDate = 'Due date must be in YYYY-MM-DD format.';
      } else {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        const dateObj = new Date(year, month - 1, day);
        if (
          isNaN(dateObj.getTime()) ||
          dateObj.getFullYear() !== year ||
          dateObj.getMonth() !== month - 1 ||
          dateObj.getDate() !== day
        ) {
          newErrors.dueDate = 'Please enter a valid calendar date.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const parsedMax = parseFloat(maxMarks);
    let parsedObtained: number | null | undefined = undefined;
    if (obtainedMarks.trim() !== '') {
      parsedObtained = parseFloat(obtainedMarks);
    }

    const payload = {
      courseId,
      courseCode: courses.find((c) => c.id === courseId)?.code || '',
      categoryId: categoryId.trim() || undefined,
      title: title.trim(),
      type,
      customType: type === 'Other' ? customType.trim() : undefined,
      priority,
      maxMarks: parsedMax,
      obtainedMarks: parsedObtained,
      dueDate: dueDate.trim() || undefined,
      description: description.trim() || undefined,
    };

    if (assessmentToEdit) {
      const success = updateAssessment(assessmentToEdit.id, payload);
      if (!success) {
        setErrors({ general: 'Failed to update assessment. Please check course selection.' });
        return;
      }
    } else {
      const success = addAssessment(payload);
      if (!success) {
        setErrors({ general: 'Failed to create assessment. Please check course selection.' });
        return;
      }
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="modal-body">
        {errors.general && (
          <div
            className="form-error-banner"
            role="alert"
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {errors.general}
          </div>
        )}

        {/* Assessment Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="asm-title-input">
            {t('modals.asmTitle')} <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            id="asm-title-input"
            type="text"
            className={`form-input ${errors.title ? 'input-error' : ''}`}
            placeholder={t('modals.asmTitlePlaceholder')}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            aria-required="true"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'asm-title-error' : undefined}
            autoFocus
          />
          {errors.title && (
            <span id="asm-title-error" style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>
              {errors.title}
            </span>
          )}
        </div>

        {/* Course Selection & Assessment Type */}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="asm-course-select">
              {t('modals.asmCourse')} <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              id="asm-course-select"
              className={`form-select ${errors.courseId ? 'input-error' : ''}`}
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                if (errors.courseId) setErrors((prev) => ({ ...prev, courseId: undefined }));
              }}
              aria-required="true"
              aria-invalid={!!errors.courseId}
              aria-describedby={errors.courseId ? 'asm-course-error' : undefined}
            >
              {courses.length === 0 ? (
                <option value="">{t('modals.noCoursesAvailable')}</option>
              ) : (
                courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))
              )}
            </select>
            {errors.courseId && (
              <span id="asm-course-error" style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>
                {errors.courseId}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="asm-type-select">
              {t('modals.asmType')} <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              id="asm-type-select"
              className="form-select"
              value={type}
              onChange={(e) => {
                const newType = e.target.value as AssessmentType;
                setType(newType);
                if (!hasManuallyChangedPriority) {
                  setPriority(getDefaultPriorityForType(newType));
                }
                if (errors.customType) setErrors((prev) => ({ ...prev, customType: undefined }));
              }}
            >
              {VALID_ASSESSMENT_TYPES.map((tItem) => (
                <option key={tItem} value={tItem}>
                  {tItem}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grading Category if course has configured categories */}
        {(() => {
          const selectedCourse = courses.find((c) => c.id === courseId);
          const courseCategories = selectedCourse?.gradingConfig?.categories || [];
          if (courseCategories.length === 0) return null;

          return (
            <div className="form-group">
              <label className="form-label" htmlFor="asm-category-select">
                Grading Category (Optional)
              </label>
              <select
                id="asm-category-select"
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">-- General / Uncategorized --</option>
                {courseCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} (Capacity: {cat.maxMarks} marks)
                  </option>
                ))}
              </select>
            </div>
          );
        })()}

        {/* Conditional Custom Type if 'Other' is chosen */}
        {type === 'Other' && (
          <div className="form-group">
            <label className="form-label" htmlFor="asm-custom-type-input">
              {t('modals.customType')} <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="asm-custom-type-input"
              type="text"
              className={`form-input ${errors.customType ? 'input-error' : ''}`}
              placeholder={t('modals.customTypePlaceholder')}
              value={customType}
              onChange={(e) => {
                setCustomType(e.target.value);
                if (errors.customType) setErrors((prev) => ({ ...prev, customType: undefined }));
              }}
              aria-required="true"
              aria-invalid={!!errors.customType}
              aria-describedby={errors.customType ? 'asm-custom-type-error' : undefined}
            />
            {errors.customType && (
              <span id="asm-custom-type-error" style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>
                {errors.customType}
              </span>
            )}
          </div>
        )}

        {/* Maximum Marks & Obtained Marks */}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="asm-max-marks-input">
              {t('modals.maxMarks')} <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="asm-max-marks-input"
              type="number"
              step="any"
              min="0.1"
              className={`form-input ${errors.maxMarks ? 'input-error' : ''}`}
              placeholder="e.g. 100, 50, 20"
              value={maxMarks}
              onChange={(e) => {
                setMaxMarks(e.target.value);
                if (errors.maxMarks) setErrors((prev) => ({ ...prev, maxMarks: undefined }));
              }}
              aria-required="true"
              aria-invalid={!!errors.maxMarks}
              aria-describedby={errors.maxMarks ? 'asm-max-error' : undefined}
            />
            {errors.maxMarks && (
              <span id="asm-max-error" style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>
                {errors.maxMarks}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="asm-obtained-marks-input">
              {t('modals.obtainedMarks')}
            </label>
            <input
              id="asm-obtained-marks-input"
              type="number"
              step="any"
              min="0"
              className={`form-input ${errors.obtainedMarks ? 'input-error' : ''}`}
              placeholder={t('modals.obtainedMarksPlaceholder')}
              value={obtainedMarks}
              onChange={(e) => {
                setObtainedMarks(e.target.value);
                if (errors.obtainedMarks) setErrors((prev) => ({ ...prev, obtainedMarks: undefined }));
              }}
              aria-invalid={!!errors.obtainedMarks}
              aria-describedby={errors.obtainedMarks ? 'asm-obtained-error' : undefined}
            />
            <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
              {t('modals.obtainedMarksHint')}
            </span>
            {errors.obtainedMarks && (
              <span id="asm-obtained-error" style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>
                {errors.obtainedMarks}
              </span>
            )}
          </div>
        </div>

        {/* Due Date & Priority Selection */}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="asm-due-date-input">
              {t('modals.dueDate')}
            </label>
            <input
              id="asm-due-date-input"
              type="date"
              className={`form-input ${errors.dueDate ? 'input-error' : ''}`}
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: undefined }));
              }}
              aria-invalid={!!errors.dueDate}
              aria-describedby={errors.dueDate ? 'asm-due-error' : undefined}
            />
            {errors.dueDate && (
              <span id="asm-due-error" style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>
                {errors.dueDate}
              </span>
            )}
            <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              {t('modals.dueDateHint')}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" id="asm-priority-label">
              {t('modals.priorityLevel')}
            </label>
            <div
              role="radiogroup"
              aria-labelledby="asm-priority-label"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              {(['high', 'medium', 'low'] as AssessmentPriority[]).map((p) => {
                const isSelected = priority === p;
                const meta = language === 'bn'
                  ? { ...PRIORITY_CONFIG[p], ...PRIORITY_CONFIG_BN[p] }
                  : PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setPriority(p);
                      setHasManuallyChangedPriority(true);
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${isSelected ? meta.accent : 'var(--border)'}`,
                      backgroundColor: isSelected ? meta.bg : 'var(--bg-surface)',
                      color: isSelected ? meta.color : 'var(--text-muted)',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 6px -1px rgba(0,0,0,0.08)' : 'none',
                    }}
                    title={meta.description}
                  >
                    {p === 'high' && <Flame size={14} color={isSelected ? meta.accent : 'var(--text-muted)'} />}
                    {p === 'medium' && <AlertTriangle size={14} color={isSelected ? meta.accent : 'var(--text-muted)'} />}
                    {p === 'low' && <ShieldCheck size={14} color={isSelected ? meta.accent : 'var(--text-muted)'} />}
                    <span>{meta.shortLabel}</span>
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              {language === 'bn' ? PRIORITY_CONFIG_BN[priority].description : PRIORITY_CONFIG[priority].description}
            </span>
          </div>
        </div>

        {/* Description / Syllabus Notes */}
        <div className="form-group">
          <label className="form-label" htmlFor="asm-desc-input">
            {t('modals.notes')}
          </label>
          <textarea
            id="asm-desc-input"
            rows={3}
            className="form-input"
            placeholder={t('modals.notesPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      <div className="modal-footer">
        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
        >
          {t('common.cancel')}
        </button>
        <button type="submit" className="btn-primary">
          {assessmentToEdit ? t('modals.saveChangesBtn') : t('modals.createAssessmentBtn')}
        </button>
      </div>
    </form>
  );
};

export const AddAssessmentModal: React.FC = () => {
  const {
    isAddAssessmentModalOpen,
    closeAddAssessmentModal,
    assessmentToEdit,
    preselectedCourseId,
    t,
  } = usePlanner();

  if (!isAddAssessmentModalOpen) return null;

  return (
    <Modal
      isOpen={isAddAssessmentModalOpen}
      onClose={closeAddAssessmentModal}
      title={assessmentToEdit ? t('modals.editAssessmentTitle') : t('modals.addAssessmentTitle')}
    >
      <AssessmentForm
        key={assessmentToEdit ? assessmentToEdit.id : `new-asm-${preselectedCourseId || 'default'}`}
        assessmentToEdit={assessmentToEdit}
        defaultCourseId={preselectedCourseId}
        onClose={closeAddAssessmentModal}
      />
    </Modal>
  );
};
