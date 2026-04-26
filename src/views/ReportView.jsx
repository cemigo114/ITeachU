import React from 'react';

/**
 * ReportView — placeholder for the teacher "Class report" view.
 * Will be migrated from TeacherReviewAssignments in a later phase.
 */
export default function ReportView() {
  return (
    <div className="p-6 font-body">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm text-muted mb-4">
          Class report view coming soon.
        </p>
        <div className="bg-white border border-border rounded p-6 text-center">
          <div className="text-4xl mb-3">&#128202;</div>
          <h3 className="font-display text-lg font-medium text-ink mb-1">
            Class Report
          </h3>
          <p className="text-sm text-muted max-w-md mx-auto">
            See completion rates, reasoning scores, and individual student
            progress for each assigned task. This view is being migrated.
          </p>
        </div>
      </div>
    </div>
  );
}
