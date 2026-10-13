import React from 'react';
import { Plus } from 'lucide-react';
import { usePlanner } from '../../context/usePlanner';

export const MobileFab: React.FC = () => {
  const { openAddCourseModal } = usePlanner();

  return (
    <button
      type="button"
      className="mobile-fab-btn"
      onClick={() => openAddCourseModal()}
      aria-label="Quick Add Course"
      title="Add Course"
    >
      <Plus size={24} strokeWidth={2.6} />
    </button>
  );
};
