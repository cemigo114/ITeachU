import React from 'react';
import { AlertCircle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import TeacherReport from '../components/teacherReport';

const TeacherFeedbackView = ({
  assignment,
  evaluationData,
  loadingEvaluations,
  getBadge,
  onBack,
}) => {
  const findEvaluation = () => {
    if (evaluationData?.conversations) {
      if (assignment.sessionId) {
        const conv = evaluationData.conversations.find(c => c.sessionId === assignment.sessionId);
        if (conv?.evaluation) return conv.evaluation;
      }
      const byTitle = evaluationData.conversations
        .filter(c => c.taskTitle === assignment.taskTitle)
        .sort((a, b) => new Date(b.updatedAt || b.timestamp) - new Date(a.updatedAt || a.timestamp));
      if (byTitle[0]?.evaluation) return byTitle[0].evaluation;
    }
    return null;
  };

  const evaluation = findEvaluation();
  const badge = getBadge(evaluation?.totalScore || 0);

  return (
    <div className="min-h-screen bg-neutral-50 font-body view-enter">
      <PageHeader
        role="teacher"
        title={`${assignment.studentName}'s Work`}
        subtitle={assignment.taskTitle}
        onBack={onBack}
      />

      <div className="max-w-4xl mx-auto p-6 space-y-6 stagger-children">

        {/* Summary row */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-display font-semibold mb-4">Assessment Summary</h2>
          <div className="flex flex-wrap gap-4">
            <div className="bg-neutral-50 p-4 rounded-xl">
              <div className="text-sm text-neutral-600 mb-1">Badge Earned</div>
              <div className={`${badge.color} text-white px-3 py-2 rounded-lg inline-block font-display font-semibold`}>
                {badge.icon} {badge.name}
              </div>
            </div>
            {assignment.completedDate && (
              <div className="bg-neutral-50 p-4 rounded-xl">
                <div className="text-sm text-neutral-600 mb-1">Completed</div>
                <div className="font-semibold text-neutral-800">{assignment.completedDate}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Cognitive Breakdown */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-display font-semibold mb-4">Cognitive Breakdown Report</h2>

          {loadingEvaluations ? (
            <div className="text-center py-8 text-neutral-500">Loading evaluation…</div>
          ) : !evaluation || evaluation.error ? (
            <div className="text-center py-8 text-neutral-500">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
              <p className="text-sm">{evaluation?.message || 'Evaluation not available yet'}</p>
            </div>
          ) : (
            <TeacherReport
              evaluation={evaluation}
              studentName={assignment.studentName}
            />
          )}
        </Card>

      </div>
    </div>
  );
};

export default TeacherFeedbackView;
