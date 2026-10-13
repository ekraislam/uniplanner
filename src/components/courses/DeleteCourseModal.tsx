import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePlanner } from '../../context/usePlanner';

export const DeleteCourseModal: React.FC = () => {
  const {
    courseToDelete,
    closeDeleteCourseModal,
    deleteCourse,
    assessments,
  } = usePlanner();

  if (!courseToDelete) return null;

  const relatedAssessments = assessments.filter(
    (a) => a.courseId === courseToDelete.id
  );
  const hasAssessments = relatedAssessments.length > 0;

  const handleConfirmDelete = () => {
    deleteCourse(courseToDelete.id);
    closeDeleteCourseModal();
  };

  return (
    <Modal
      isOpen={!!courseToDelete}
      onClose={closeDeleteCourseModal}
      title="Delete Course Confirmation"
    >
      <div className="modal-body">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: hasAssessments ? 'var(--warning-bg)' : 'var(--danger-bg)',
              color: hasAssessments ? 'var(--warning)' : 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {hasAssessments ? <AlertTriangle size={24} /> : <Trash2 size={24} />}
          </div>

          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
              Delete {courseToDelete.code} — {courseToDelete.name}?
            </h4>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Academic Term: <strong>{courseToDelete.semester}</strong> • Credit Hours: <strong>{courseToDelete.credits}</strong>
            </p>
          </div>
        </div>

        {hasAssessments ? (
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13.5px',
              color: '#78350f',
              lineHeight: 1.5,
            }}
          >
            <strong>Warning: Associated Data Consequence</strong>
            <p style={{ marginTop: '4px', color: '#92400e' }}>
              This course currently has <strong>{relatedAssessments.length}</strong> related assessment{relatedAssessments.length > 1 ? 's' : ''}:
            </p>
            <ul style={{ paddingLeft: '18px', marginTop: '6px', fontSize: '13px' }}>
              {relatedAssessments.slice(0, 4).map((a) => (
                <li key={a.id}>
                  {a.title} ({a.type} • Max: {a.maxMarks})
                </li>
              ))}
              {relatedAssessments.length > 4 && (
                <li>...and {relatedAssessments.length - 4} more</li>
              )}
            </ul>
            <p style={{ marginTop: '8px', fontWeight: 600 }}>
              Deleting this course will permanently delete all {relatedAssessments.length} linked assessments to prevent orphaned records. This action cannot be undone.
            </p>
          </div>
        ) : (
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Are you sure you want to remove this course from your academic planner? This action cannot be undone.
          </p>
        )}
      </div>

      <div className="modal-footer">
        <button
          type="button"
          className="btn-secondary"
          onClick={closeDeleteCourseModal}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-danger"
          onClick={handleConfirmDelete}
        >
          <Trash2 size={15} />
          <span>
            {hasAssessments
              ? `Delete Course & ${relatedAssessments.length} Assessment${relatedAssessments.length > 1 ? 's' : ''}`
              : 'Confirm Delete Course'}
          </span>
        </button>
      </div>
    </Modal>
  );
};
