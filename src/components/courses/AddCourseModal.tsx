import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { usePlanner } from '../../context/usePlanner';
import type { Course } from '../../types';
import { getDefaultGpaConfig, getGradePointForGrade } from '../../utils/gpaCalculation';
import { PRESET_COURSE_COLORS } from '../../utils/courseThemes';

interface CourseFormProps {
  courseToEdit: Course | null;
  onClose: () => void;
}

const CourseForm: React.FC<CourseFormProps> = ({ courseToEdit, onClose }) => {
  const { addCourse, updateCourse, isDuplicateCourseCode, settings, courses } = usePlanner();

  const gpaConfig = settings.gpaConfig || getDefaultGpaConfig(settings.gradingScale);
  const gpaRules = gpaConfig.rules || [];

  const [code, setCode] = useState(courseToEdit ? courseToEdit.code : '');
  const [name, setName] = useState(courseToEdit ? courseToEdit.name : '');
  const [credits, setCredits] = useState(courseToEdit ? String(courseToEdit.credits) : '3');
  const [semester, setSemester] = useState(
    courseToEdit ? courseToEdit.semester : (settings.currentTerm || 'Fall 2026')
  );
  const [targetGrade, setTargetGrade] = useState(
    courseToEdit?.targetGrade ? courseToEdit.targetGrade : 'A'
  );
  const [finalGrade, setFinalGrade] = useState(courseToEdit?.finalGrade || '');
  const [instructor, setInstructor] = useState(courseToEdit?.instructor || '');
  const initialColor = courseToEdit?.color || PRESET_COURSE_COLORS[courses.length % PRESET_COURSE_COLORS.length];
  const [color, setColor] = useState(initialColor);

  // Validation errors
  const [errors, setErrors] = useState<{
    code?: string;
    name?: string;
    credits?: string;
    semester?: string;
    general?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    const trimmedCode = code.trim();
    const trimmedName = name.trim();
    const trimmedSemester = semester.trim();
    const parsedCredits = parseFloat(credits);

    if (!trimmedCode) {
      newErrors.code = 'Course code is required (e.g. CS 101, MATH 201).';
    }

    if (!trimmedName) {
      newErrors.name = 'Course name is required (e.g. Data Structures & Algorithms).';
    }

    if (!trimmedSemester) {
      newErrors.semester = 'Academic term is required (e.g. Fall 2026).';
    }

    if (!credits.trim() || isNaN(parsedCredits) || parsedCredits <= 0) {
      newErrors.credits = 'Credit hours must be a positive number (e.g. 3 or 4).';
    }

    // Duplicate check within same semester
    if (trimmedCode && trimmedSemester) {
      const isDuplicate = isDuplicateCourseCode(
        trimmedCode,
        trimmedSemester,
        courseToEdit?.id
      );
      if (isDuplicate) {
        newErrors.code = `Course code "${trimmedCode.toUpperCase()}" already exists in the "${trimmedSemester}" term. Course codes must be unique within the same term.`;
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

    const parsedFinalGrade = finalGrade.trim() || undefined;
    const finalGradePoint = parsedFinalGrade
      ? getGradePointForGrade(parsedFinalGrade, gpaConfig) ?? undefined
      : undefined;

    const coursePayload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      credits: parseFloat(credits) || 3,
      semester: semester.trim(),
      targetGrade: targetGrade.trim() || undefined,
      finalGrade: parsedFinalGrade,
      finalGradePoint,
      instructor: instructor.trim() || undefined,
      color,
    };

    if (courseToEdit) {
      const success = updateCourse(courseToEdit.id, coursePayload);
      if (!success) {
        setErrors({
          general: `Cannot update: Course "${coursePayload.code}" already exists in "${coursePayload.semester}".`,
        });
        return;
      }
    } else {
      const success = addCourse(coursePayload);
      if (!success) {
        setErrors({
          general: `Cannot create: Course "${coursePayload.code}" already exists in "${coursePayload.semester}".`,
        });
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

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="course-code-input">
              Course Code <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="course-code-input"
              type="text"
              className={`form-input ${errors.code ? 'input-error' : ''}`}
              placeholder="e.g. CS 101, MATH 201"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (errors.code) setErrors((prev) => ({ ...prev, code: undefined }));
              }}
              aria-required="true"
              aria-invalid={!!errors.code}
              aria-describedby={errors.code ? 'course-code-error' : undefined}
              autoFocus
            />
            {errors.code && (
              <span id="course-code-error" style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>
                {errors.code}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="course-credits-input">
              Credit Hours <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="course-credits-input"
              type="number"
              step="0.5"
              min="0.5"
              max="30"
              className={`form-input ${errors.credits ? 'input-error' : ''}`}
              placeholder="3"
              value={credits}
              onChange={(e) => {
                setCredits(e.target.value);
                if (errors.credits) setErrors((prev) => ({ ...prev, credits: undefined }));
              }}
              aria-required="true"
              aria-invalid={!!errors.credits}
              aria-describedby={errors.credits ? 'course-credits-error' : undefined}
            />
            {errors.credits && (
              <span id="course-credits-error" style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>
                {errors.credits}
              </span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="course-name-input">
            Course Name <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            id="course-name-input"
            type="text"
            className={`form-input ${errors.name ? 'input-error' : ''}`}
            placeholder="e.g. Data Structures and Algorithms"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'course-name-error' : undefined}
          />
          {errors.name && (
            <span id="course-name-error" style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>
              {errors.name}
            </span>
          )}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="course-term-input">
              Academic Term <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="course-term-input"
              type="text"
              className={`form-input ${errors.semester ? 'input-error' : ''}`}
              placeholder="e.g. Fall 2026, Spring 2027"
              value={semester}
              onChange={(e) => {
                setSemester(e.target.value);
                if (errors.semester) setErrors((prev) => ({ ...prev, semester: undefined }));
              }}
              aria-required="true"
              aria-invalid={!!errors.semester}
              aria-describedby={errors.semester ? 'course-term-error' : undefined}
            />
            {errors.semester && (
              <span id="course-term-error" style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>
                {errors.semester}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="course-target-grade">
              Target Grade (Optional)
            </label>
            <select
              id="course-target-grade"
              className="form-select"
              value={targetGrade}
              onChange={(e) => setTargetGrade(e.target.value)}
            >
              <option value="A+">A+ (4.0 / Exceptional)</option>
              <option value="A">A (4.0 / Superior)</option>
              <option value="A-">A- (3.7 / Excellent)</option>
              <option value="B+">B+ (3.3 / Very Good)</option>
              <option value="B">B (3.0 / Good)</option>
              <option value="B-">B- (2.7 / Above Average)</option>
              <option value="C+">C+ (2.3 / Average)</option>
              <option value="C">C (2.0 / Satisfactory)</option>
              <option value="Pass">Pass / Satisfactory</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="course-final-grade">
              Official Final Grade (Optional)
            </label>
            <select
              id="course-final-grade"
              className="form-select"
              value={finalGrade}
              onChange={(e) => setFinalGrade(e.target.value)}
            >
              <option value="">Pending / Not finalized yet</option>
              {gpaRules.map((r) => (
                <option key={r.grade} value={r.grade}>
                  {r.grade} ({r.gradePoint.toFixed(2)} pts)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="course-instructor-input">
            Instructor / Professor (Optional)
          </label>
          <input
            id="course-instructor-input"
            type="text"
            className="form-input"
            placeholder="e.g. Prof. Eleanor Vance"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Subject Accent Color</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
            {PRESET_COURSE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: c,
                  border: color === c ? '3px solid #0f172a' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                  transform: color === c ? 'scale(1.15)' : 'scale(1)',
                }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {courseToEdit ? 'Save Changes' : 'Create Course'}
        </button>
      </div>
    </form>
  );
};

export const AddCourseModal: React.FC = () => {
  const { isAddCourseModalOpen, closeAddCourseModal, courseToEdit } = usePlanner();

  if (!isAddCourseModalOpen) return null;

  return (
    <Modal
      isOpen={isAddCourseModalOpen}
      onClose={closeAddCourseModal}
      title={courseToEdit ? 'Edit Academic Course' : 'Add New Academic Course'}
    >
      <CourseForm
        key={courseToEdit ? courseToEdit.id : 'new-course'}
        courseToEdit={courseToEdit}
        onClose={closeAddCourseModal}
      />
    </Modal>
  );
};
