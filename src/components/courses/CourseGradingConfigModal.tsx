import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePlanner } from '../../context/usePlanner';
import type { Course, MarksCategory, GradeBoundary, CourseGradingConfig } from '../../types';
import { validateGradingConfig } from '../../utils/gradeAnalysis';

interface ConfigFormProps {
  course: Course;
  onClose: () => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ course, onClose }) => {
  const { updateCourseGradingConfig, assessments } = usePlanner();

  // Existing config or initial starter structure
  const existingConfig = course.gradingConfig;

  const [totalCourseMarks, setTotalCourseMarks] = useState<string>(
    existingConfig ? String(existingConfig.totalCourseMarks) : '100'
  );

  const [passingMarks, setPassingMarks] = useState<string>(
    existingConfig?.passingMarks !== undefined ? String(existingConfig.passingMarks) : '40'
  );

  const [categories, setCategories] = useState<MarksCategory[]>(() => {
    if (existingConfig?.categories && existingConfig.categories.length > 0) {
      return [...existingConfig.categories];
    }
    return [
      { id: 'cat_' + Date.now() + '_1', name: 'Assignments', maxMarks: 20 },
      { id: 'cat_' + Date.now() + '_2', name: 'Midterm Exam', maxMarks: 30 },
      { id: 'cat_' + Date.now() + '_3', name: 'Final Exam', maxMarks: 50 },
    ];
  });

  const [gradeBoundaries, setGradeBoundaries] = useState<GradeBoundary[]>(() => {
    if (existingConfig?.gradeBoundaries && existingConfig.gradeBoundaries.length > 0) {
      return [...existingConfig.gradeBoundaries];
    }
    return [
      { grade: 'A', minMarks: 80 },
      { grade: 'B', minMarks: 70 },
      { grade: 'C', minMarks: 60 },
      { grade: 'D', minMarks: 50 },
      { grade: 'F', minMarks: 0 },
    ];
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Category sum calculation
  const parsedTotal = parseFloat(totalCourseMarks) || 0;
  const currentCategorySum = categories.reduce((sum, c) => sum + (c.maxMarks || 0), 0);
  const sumMatchesTotal = Math.abs(currentCategorySum - parsedTotal) < 0.01 && parsedTotal > 0;

  // Category management
  const handleAddCategory = () => {
    setCategories((prev) => [
      ...prev,
      { id: 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6), name: '', maxMarks: 10 },
    ]);
  };

  const handleUpdateCategory = (id: string, updates: Partial<MarksCategory>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleRemoveCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Grade boundary management
  const handleAddBoundary = () => {
    setGradeBoundaries((prev) => [...prev, { grade: '', minMarks: 0 }]);
  };

  const handleUpdateBoundary = (index: number, updates: Partial<GradeBoundary>) => {
    setGradeBoundaries((prev) =>
      prev.map((gb, i) => (i === index ? { ...gb, ...updates } : gb))
    );
  };

  const handleRemoveBoundary = (index: number) => {
    setGradeBoundaries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLoadStandardScale = () => {
    const total = parsedTotal > 0 ? parsedTotal : 100;
    setGradeBoundaries([
      { grade: 'A+', minMarks: Math.round(total * 0.9) },
      { grade: 'A', minMarks: Math.round(total * 0.8) },
      { grade: 'B+', minMarks: Math.round(total * 0.75) },
      { grade: 'B', minMarks: Math.round(total * 0.7) },
      { grade: 'C+', minMarks: Math.round(total * 0.65) },
      { grade: 'C', minMarks: Math.round(total * 0.6) },
      { grade: 'D', minMarks: Math.round(total * 0.5) },
      { grade: 'F', minMarks: 0 },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const configPayload: CourseGradingConfig = {
      totalCourseMarks: parsedTotal,
      categories: categories.map((c) => ({
        ...c,
        name: c.name.trim(),
        maxMarks: Number(c.maxMarks) || 0,
      })),
      gradeBoundaries: gradeBoundaries
        .map((gb) => ({
          grade: gb.grade.trim().toUpperCase(),
          minMarks: Number(gb.minMarks) || 0,
        }))
        .sort((a, b) => b.minMarks - a.minMarks),
      passingMarks: passingMarks.trim() !== '' ? parseFloat(passingMarks) : undefined,
      isComplete: true,
    };

    const validation = validateGradingConfig(configPayload);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Check for assessment conflicts
    const courseAssessments = assessments.filter((a) => a.courseId === course.id);
    const conflicts: string[] = [];

    for (const cat of configPayload.categories) {
      const linked = courseAssessments.filter((a) => a.categoryId === cat.id);
      const existingSum = linked.reduce((sum, a) => sum + a.maxMarks, 0);
      if (existingSum > cat.maxMarks) {
        conflicts.push(
          `Category "${cat.name}": existing assessments sum to ${existingSum} marks, exceeding the new capacity of ${cat.maxMarks} marks.`
        );
      }
    }

    if (conflicts.length > 0 && !conflictWarning) {
      setConflictWarning(
        `Warning: Existing assessments exceed the updated capacity in ${conflicts.length} category. Click "Save Configuration" again to proceed and adjust assessments later.`
      );
      return;
    }

    updateCourseGradingConfig(course.id, configPayload);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
        {/* Course Banner */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            borderLeft: `4px solid ${course.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: course.color }}>
              {course.code}
            </span>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{course.name}</div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Term: {course.semester}
          </span>
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div
            className="form-error-banner"
            role="alert"
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
            }}
          >
            <strong>Please resolve the following configuration issues:</strong>
            <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Conflict Warning */}
        {conflictWarning && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--warning-bg)',
              color: '#92400e',
              border: '1px solid var(--warning-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <AlertCircle size={16} />
              <span>Assessment Conflict Notice</span>
            </div>
            <p style={{ marginTop: '4px' }}>{conflictWarning}</p>
          </div>
        )}

        {/* Total Marks & Minimum Passing Marks */}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="total-course-marks-input">
              Total Course Marks <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="total-course-marks-input"
              type="number"
              min="1"
              step="any"
              className="form-input"
              placeholder="e.g. 100, 150"
              value={totalCourseMarks}
              onChange={(e) => {
                setTotalCourseMarks(e.target.value);
                setErrors([]);
              }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="min-passing-marks-input">
              Minimum Passing Marks (Optional)
            </label>
            <input
              id="min-passing-marks-input"
              type="number"
              min="0"
              step="any"
              className="form-input"
              placeholder="e.g. 40 or 50"
              value={passingMarks}
              onChange={(e) => setPassingMarks(e.target.value)}
            />
          </div>
        </div>

        {/* Assessment Categories */}
        <div style={{ marginTop: '10px' }}>
          <div className="section-header-row">
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700 }}>
                Marks Categories & Capacities
              </h4>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Configure the weight/max marks for each category (e.g. Midterm, Lab, Final Exam).
              </p>
            </div>

            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '5px 10px' }}
              onClick={handleAddCategory}
            >
              <Plus size={14} />
              <span>Add Category</span>
            </button>
          </div>

          {/* Sum Status Bar */}
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: sumMatchesTotal ? 'var(--success-bg)' : 'var(--warning-bg)',
              color: sumMatchesTotal ? 'var(--success)' : 'var(--warning)',
              border: `1px solid ${sumMatchesTotal ? 'var(--success-border)' : 'var(--warning-border)'}`,
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {sumMatchesTotal ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              <span>Category Total Sum: {currentCategorySum.toFixed(1)} / {parsedTotal.toFixed(1)}</span>
            </span>
            <span>
              {sumMatchesTotal
                ? 'Matches total course marks'
                : `${(parsedTotal - currentCategorySum).toFixed(1)} marks remaining to allocate`}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', width: '18px' }}>
                  #{idx + 1}
                </span>

                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 2, padding: '7px 10px', fontSize: '13px' }}
                  placeholder="Category Name (e.g. Midterm Exam)"
                  value={cat.name}
                  onChange={(e) => handleUpdateCategory(cat.id, { name: e.target.value })}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    style={{ width: '85px', padding: '7px 10px', fontSize: '13px' }}
                    placeholder="Marks"
                    value={cat.maxMarks}
                    onChange={(e) =>
                      handleUpdateCategory(cat.id, { maxMarks: parseFloat(e.target.value) || 0 })
                    }
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>marks</span>
                </div>

                <button
                  type="button"
                  style={{ color: 'var(--text-dim)', padding: '4px' }}
                  onClick={() => handleRemoveCategory(cat.id)}
                  title="Remove category"
                  aria-label="Remove category"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Boundaries */}
        <div style={{ marginTop: '16px' }}>
          <div className="section-header-row">
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700 }}>
                Grade Boundaries & Grading Scale
              </h4>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Minimum marks required to earn each letter grade.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '5px 10px' }}
                onClick={handleLoadStandardScale}
              >
                Auto-Scale
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '5px 10px' }}
                onClick={handleAddBoundary}
              >
                <Plus size={14} />
                <span>Add Grade</span>
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '10px',
            }}
          >
            {gradeBoundaries.map((gb, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '55px', padding: '6px 8px', fontSize: '13px', fontWeight: 700 }}
                  placeholder="Grade"
                  value={gb.grade}
                  onChange={(e) => handleUpdateBoundary(idx, { grade: e.target.value })}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>&ge;</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="form-input"
                  style={{ width: '70px', padding: '6px 8px', fontSize: '13px' }}
                  placeholder="Min"
                  value={gb.minMarks}
                  onChange={(e) =>
                    handleUpdateBoundary(idx, { minMarks: parseFloat(e.target.value) || 0 })
                  }
                />
                <button
                  type="button"
                  style={{ color: 'var(--text-dim)', padding: '2px', marginLeft: 'auto' }}
                  onClick={() => handleRemoveBoundary(idx)}
                  title="Remove grade boundary"
                  aria-label="Remove grade boundary"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save Configuration
        </button>
      </div>
    </form>
  );
};

export const CourseGradingConfigModal: React.FC = () => {
  const {
    isGradingConfigModalOpen,
    closeGradingConfigModal,
    courseForGradingConfig,
  } = usePlanner();

  if (!isGradingConfigModalOpen || !courseForGradingConfig) return null;

  return (
    <Modal
      isOpen={isGradingConfigModalOpen}
      onClose={closeGradingConfigModal}
      title={`Grading Structure — ${courseForGradingConfig.code}`}
    >
      <ConfigForm
        key={courseForGradingConfig.id}
        course={courseForGradingConfig}
        onClose={closeGradingConfigModal}
      />
    </Modal>
  );
};
