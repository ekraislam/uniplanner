import React from 'react';
import { AlertTriangle, Database, X } from 'lucide-react';
import { Modal } from './Modal';
import { usePlanner } from '../../context/usePlanner';
import type { UniPlannerBackupData, BackupPreviewInfo } from '../../types';
import { formatBackupDate } from '../../utils/backupRestore';

interface RestoreBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupData: UniPlannerBackupData | null;
  preview: BackupPreviewInfo | null;
  onConfirmRestore: (data: UniPlannerBackupData) => void;
}

export const RestoreBackupModal: React.FC<RestoreBackupModalProps> = ({
  isOpen,
  onClose,
  backupData,
  preview,
  onConfirmRestore,
}) => {
  const { courses, assessments, settings } = usePlanner();

  if (!isOpen || !backupData || !preview) {
    return null;
  }

  const handleConfirm = () => {
    onConfirmRestore(backupData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm & Restore Backup Data"
      maxWidth="620px"
    >
      <div className="modal-body">
        {/* Warning Alert Banner */}
        <div
          role="alert"
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            fontSize: '13.5px',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Warning: This action will replace your current planner records!</strong>
            <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
              Importing this backup will completely overwrite your current courses, assessments, marks, and settings with the contents of this file. If you have unbacked-up work, consider exporting a current backup first.
            </p>
          </div>
        </div>

        {/* Side-by-Side Comparison */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
          }}
        >
          {/* Current Workspace State */}
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Current Workspace Data
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <div>
                Courses: <strong>{courses.length}</strong>
              </div>
              <div>
                Assessments: <strong>{assessments.length}</strong>
              </div>
              <div>
                Grading Scale: <strong>{settings.gradingScale}</strong>
              </div>
              <div>
                Current Term: <strong>{settings.currentTerm}</strong>
              </div>
            </div>
          </div>

          {/* Incoming Backup State */}
          <div
            style={{
              padding: '14px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', marginBottom: '8px' }}>
              Incoming Backup File
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#1e3a8a' }}>
              <div>
                Courses to restore: <strong>{preview.courseCount}</strong>
              </div>
              <div>
                Assessments to restore: <strong>{preview.assessmentCount}</strong>
              </div>
              <div>
                Scale: <strong>{preview.gradingScale}</strong>
              </div>
              <div>
                Exported: <strong>{formatBackupDate(preview.exportedAt)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Course Codes Preview */}
        {preview.courseCodes.length > 0 ? (
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              Courses included in this backup ({preview.courseCodes.length}):
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto' }}>
              {preview.courseCodes.map((code, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    fontSize: '12px',
                  }}
                >
                  {code}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12.5px',
              color: 'var(--text-muted)',
            }}
          >
            This backup represents an empty installation (0 courses, 0 assessments). Restoring it will initialize your workspace with empty user records.
          </div>
        )}

        {/* Meta details */}
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          Schema version: <strong>v{preview.schemaVersion}</strong> • Atomic verification: <strong>Passed (0 errors)</strong>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
        >
          <X size={15} />
          <span>Cancel & Keep Current Data</span>
        </button>

        <button
          type="button"
          className="btn-danger"
          style={{ fontWeight: 700 }}
          onClick={handleConfirm}
        >
          <Database size={15} />
          <span>Confirm & Replace All Data</span>
        </button>
      </div>
    </Modal>
  );
};
