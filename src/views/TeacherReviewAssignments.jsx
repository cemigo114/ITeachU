import React from 'react';
import { BarChart3 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

function resolveEvaluationForAssignment(assignment, evaluationData) {
  let evaluation = null;

  if (evaluationData?.conversations) {
    if (assignment.sessionId) {
      const conv = evaluationData.conversations.find((c) => c.sessionId === assignment.sessionId);
      if (conv) evaluation = conv.evaluation;
    }

    if (!evaluation) {
      const matchingConvs = evaluationData.conversations.filter(
        (c) => c.taskTitle === assignment.taskTitle
      );
      if (matchingConvs.length > 0) {
        const latest = matchingConvs.sort(
          (a, b) =>
            new Date(b.updatedAt || b.timestamp) - new Date(a.updatedAt || a.timestamp)
        )[0];
        evaluation = latest.evaluation;
      }
    }
  }

  return evaluation;
}

function statusToBadgeStatus(status) {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'in_progress';
  return 'pending';
}

const TeacherReviewAssignments = ({
  assignments,
  evaluationData,
  loadingEvaluations,
  onRefreshEvaluations,
  getBadge,
  onSelectStudent,
  onBack,
  EVALUATION_CATEGORIES,
}) => {
  const visibleAssignments = assignments.filter((a) => a.status !== 'assigned');

  return (
    <div className="min-h-screen bg-neutral-50 font-body view-enter">
      <span className="sr-only">
        Evaluation rubric dimensions:{' '}
        {Object.values(EVALUATION_CATEGORIES)
          .map((c) => c.label)
          .join(', ')}
      </span>

      <PageHeader
        role="teacher"
        title="Review Student Work"
        onBack={onBack}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={loadingEvaluations}
            disabled={loadingEvaluations}
            icon={<BarChart3 className="w-4 h-4" />}
            className="!border-white/40 !text-white hover:!bg-white/15"
            onClick={onRefreshEvaluations}
          >
            Refresh Evaluations
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {visibleAssignments.map((assignment) => {
            const headerBadge = getBadge(assignment.evaluation?.totalScore || 0);
            const evaluation = resolveEvaluationForAssignment(assignment, evaluationData);
            const displayScore =
              evaluation && !evaluation.error
                ? evaluation.totalScore
                : assignment.evaluation?.totalScore || 0;
            const evalBadge = getBadge(displayScore);

            return (
              <Card
                key={assignment.id}
                variant="interactive"
                accent="teacher"
                padding="lg"
                onClick={() => onSelectStudent(assignment)}
                className="text-left shadow-card hover:shadow-elevated transition-shadow animate-fade-in"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-lg text-neutral-900">
                      {assignment.studentName}
                    </h3>
                    <p className="text-sm text-neutral-600 truncate">{assignment.taskTitle}</p>
                  </div>
                  {assignment.status === 'completed' && (
                    <span
                      className={`${headerBadge.color} text-white px-2 py-1 rounded-lg text-xs font-semibold shrink-0`}
                    >
                      {headerBadge.icon} {headerBadge.name}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="text-neutral-600 shrink-0">Evaluation:</span>
                    <span
                      className={`font-semibold ${evalBadge.color} text-white px-2 py-0.5 rounded-lg text-xs truncate max-w-[55%] text-right`}
                    >
                      {evalBadge.icon} {evalBadge.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="text-neutral-600">Status:</span>
                    <Badge status={statusToBadgeStatus(assignment.status)} size="sm">
                      {assignment.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {assignment.completedDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Completed:</span>
                      <span className="text-neutral-900">{assignment.completedDate}</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeacherReviewAssignments;
