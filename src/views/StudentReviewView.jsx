import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * StudentReviewView — post-teaching-session review for students.
 * Will be migrated from FeedbackView in a later phase.
 */
export default function StudentReviewView() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-6 font-body">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="bg-ink p-6">
            <h2 className="font-display text-xl font-light text-white">
              Your work review
            </h2>
            <p className="text-xs text-white/50 mt-1">
              Task: {taskId || 'Unknown'}
            </p>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm text-muted">
              Student review view is being migrated to the new design system.
            </p>
            <button
              onClick={() => navigate('/student')}
              className="mt-4 px-4 py-2 bg-amber hover:bg-amber-deep text-white rounded-sm text-sm transition-colors"
            >
              Back to assignments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
