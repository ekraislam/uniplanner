import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePlanner } from '../../context/usePlanner';
import type { Course } from '../../types';
import { getDefaultGpaConfig, estimateGradeFromMarks, getGradePointForGrade } from '../../utils/gpaCalculation';

interface ConfirmFinalGradeFormProps {
  course: Course;
  onClose: () => void;
}

const ConfirmFinalGradeForm: React.FC<ConfirmFinalGradeFormProps> = ({
  course,
  onClose,
}) => {
  const { settings, assessments, updateCourseFinalGrade } = usePlanner();

  const gpaConfig = settings.gpaConfig || getDefaultGpaConfig(settings.gradingScale);
  const rules = gpaConfig.rules || [];

  const initialGrade = course.finalGrade || (rules[0]?.grade ?? 'A');
  const [selectedGrade, setSelectedGrade] = useState<string>(initialGrade);
  const [useCustomPoint, setUseCustomPoint] = useState<boolean>(false);
  const [customPoint, setCustomPoint] = useState<string>(
    course.finalGradePoint !== undefined ? String(course.finalGradePoint) : '4.0'
  );

  // Current marks assessment performance estimate
  const marksEstimate = estimateGradeFromMarks(course, assessments, gpaConfig);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let point: number | undefined = undefined;
    if (useCustomPoint) {
      const parsed = parseFloat(customPoint);
      point = !isNaN(parsed) && parsed >= 0 ? parsed : undefined;
    } else {
      const lookup = getGradePointForGrade(selectedGrade, gpaConfig);
      point = lookup !== null ? lookup : undefined;
    }

    updateCourseFinalGrade(course.id, selectedGrade, point);
    onClose();
  };

  const handleClearGrade = () => {
    updateCourseFinalGrade(course.id, undefined, undefined);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Course Header Info */}
      <div
        style={{
          padding: '16px 18px',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          borderLeft: `4px solid ${course.color}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <strong style={{ fontSize: '17px', color: 'var(--text-main)' }}>{course.code}</strong>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
            {course.credits} Credits • {course.semester}
          </span>
        </div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>{course.name}</div>
      </div>

      {/* Marks-Based Reference Warning */}
      {marksEstimate ? (
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            color: '#1e40af',
            fontSize: '14px',
            marginBottom: '20px',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '4px' }}>
            <AlertCircle size={16} />
            <span>Current Assessed Work: {marksEstimate.percentage?.toFixed(1)}% ({marksEstimate.grade ? `~${marksEstimate.grade}` : 'In progress'})</span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#1e3a8a' }}>
            Note: This estimate reflects graded work to date and is <strong>not</strong> an official grade. Only confirm an official final grade when officially awarded by your university.
          </p>
        </div>
      ) : (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: '13.5px',
            marginBottom: '20px',
          }}
        >
          No assessed marks available for automatic projection. Select your officially confirmed final letter grade below.
        </div>
      )}

      {/* Select Official Final Grade */}
      <div className="form-group" style={{ marginBottom: '18px' }}>
        <label className="form-label" htmlFor="final-grade-select" style={{ fontSize: '14.5px', fontWeight: 700 }}>
          Official Final Letter Grade:
        </label>
        <select
          id="final-grade-select"
          className="form-select"
          style={{ fontSize: '15.5px' }}
          value={selectedGrade}
          onChange={(e) => {
            setSelectedGrade(e.target.value);
            const autoPt = getGradePointForGrade(e.target.value, gpaConfig);
            if (autoPt !== null) {
              setCustomPoint(String(autoPt));
            }
          }}
        >
          {rules.map((r) => (
            <option key={r.grade} value={r.grade}>
              {r.grade} ({r.gradePoint.toFixed(2)} grade points)
              {r.minPercentage !== undefined ? ` — min ${r.minPercentage}%` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Grade Point Toggle */}
      <div style={{ marginBottom: '22px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', color: 'var(--text-main)' }}>
          <input
            type="checkbox"
            checked={useCustomPoint}
            onChange={(e) => setUseCustomPoint(e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          <span>Override default grade point for this specific course</span>
        </label>

        {useCustomPoint && (
          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label" htmlFor="custom-point-input" style={{ fontSize: '14px' }}>
              Custom Grade Point (Max {gpaConfig.scaleMax}):
            </label>
            <input
              id="custom-point-input"
              type="number"
              step="0.01"
              min="0"
              max={gpaConfig.scaleMax}
              className="form-input"
              value={customPoint}
              onChange={(e) => setCustomPoint(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '24px' }}>
        {course.finalGrade ? (
          <button
            type="button"
            className="btn-secondary"
            style={{ color: 'var(--danger)', borderColor: '#fca5a5', fontSize: '14px' }}
            onClick={handleClearGrade}
          >
            <RotateCcw size={14} />
            <span>Mark as Pending</span>
          </button>
        ) : (
          <div />
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '14.5px' }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            style={{ fontSize: '14.5px' }}
          >
            <CheckCircle2 size={16} />
            <span>Confirm Final Grade</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export const ConfirmFinalGradeModal: React.FC = () => {
  const { isConfirmFinalGradeModalOpen, courseForFinalGrade, closeConfirmFinalGradeModal } = usePlanner();

  if (!isConfirmFinalGradeModalOpen || !courseForFinalGrade) {
    return null;
  }

  return (
    <Modal
      isOpen={isConfirmFinalGradeModalOpen}
      onClose={closeConfirmFinalGradeModal}
      title="Confirm Official Final Grade"
      maxWidth="500px"
    >
      <ConfirmFinalGradeForm
        key={courseForFinalGrade.id}
        course={courseForFinalGrade}
        onClose={closeConfirmFinalGradeModal}
      />
    </Modal>
  );
};
