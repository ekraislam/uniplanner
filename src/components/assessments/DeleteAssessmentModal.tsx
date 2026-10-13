import React from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePlanner } from '../../context/usePlanner';

export const DeleteAssessmentModal: React.FC = () => {
  const {
    assessmentToDelete,
    closeDeleteAssessmentModal,
    deleteAssessment,
  } = usePlanner();

  if (!assessmentToDelete) return null;

  const handleConfirmDelete = () => {
    deleteAssessment(assessmentToDelete.id);
    closeDeleteAssessmentModal();
  };

  const displayType =
    assessmentToDelete.type === 'Other' && assessmentToDelete.customType
      ? `${assessmentToDelete.customType} (Other)`
      : assessmentToDelete.type;

  return (
    <Modal
      isOpen={!!assessmentToDelete}
      onClose={closeDeleteAssessmentModal}
      title="Delete Assessment Confirmation"
    >
      <div className="modal-body">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Trash2 size={24} />
          </div>

          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
              Delete "{assessmentToDelete.title}"?
            </h4>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Course: <strong>{assessmentToDelete.courseCode}</strong> • Type: <strong>{displayType}</strong> • Max Marks: <strong>{assessmentToDelete.maxMarks}</strong>
            </p>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5', marginTop: '12px' }}>
          Are you sure you want to delete this assessment record? Any marks or deadlines recorded for this assessment will be permanently removed. This action cannot be undone.
        </p>
      </div>

      <div className="modal-footer">
        <button
          type="button"
          className="btn-secondary"
          onClick={closeDeleteAssessmentModal}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-danger"
          onClick={handleConfirmDelete}
        >
          <Trash2 size={15} />
          <span>Confirm Delete Assessment</span>
        </button>
      </div>
    </Modal>
  );
};
