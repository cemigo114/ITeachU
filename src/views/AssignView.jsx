import React from 'react';

/**
 * AssignView — placeholder for the teacher "Assign tasks" view.
 * The full implementation will be migrated from the existing
 * TeacherBrowseTasks / TeacherAssignTask views in a later phase.
 */
export default function AssignView() {
  return (
    <div className="p-6 font-body">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm text-muted mb-4">
          Task assignment view coming soon. The existing task browser and assignment
          flow will be restyled and connected here.
        </p>
        <div className="bg-white border border-border rounded p-6 text-center">
          <div className="text-4xl mb-3">&#128203;</div>
          <h3 className="font-display text-lg font-medium text-ink mb-1">
            Assign Tasks
          </h3>
          <p className="text-sm text-muted max-w-md mx-auto">
            Browse your task bank, select tasks, and assign them to your class
            or individual students. This view is being migrated to the new design system.
          </p>
        </div>
      </div>
    </div>
  );
}
