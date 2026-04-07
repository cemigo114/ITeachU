import React from 'react';
import { Home, Lightbulb, TrendingUp, Trophy } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const FeedbackView = ({
  assignment,
  evaluationData,
  userRole,
  getBadge,
  onFetchEvaluations,
  onBackToDashboard,
  EVALUATION_CATEGORIES,
}) => {
  const badge = getBadge(assignment.evaluation?.totalScore || 0);
  const messageCount = assignment.messages?.length ?? 0;

  const resolveEvaluation = () => {
    let evaluation;
    if (assignment.sessionId && evaluationData?.conversations) {
      const conv = evaluationData.conversations.find((c) => c.sessionId === assignment.sessionId);
      evaluation = conv?.evaluation || assignment.evaluation;
    } else {
      evaluation =
        evaluationData?.conversations?.find((conv) => conv.taskTitle === assignment.taskTitle)?.evaluation ||
        assignment.evaluation;
    }
    return evaluation;
  };

  const evaluation = resolveEvaluation();

  return (
    <div className="min-h-screen bg-neutral-50 font-body view-enter">
      <div className="bg-gradient-to-r from-teal-600 to-brand-600 text-white p-6 shadow-card">
        <div className="max-w-4xl mx-auto text-center animate-celebrate">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-95" aria-hidden />
          <h1 className="text-3xl font-display font-bold mb-2">Session Complete!</h1>
          <p className="text-teal-100 font-body">Great job teaching Zippy!</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card variant="elevated" padding="lg" className="text-center animate-fade-in">
          <div className="mb-6 animate-celebrate">
            <div
              className={`${badge.color} text-white px-6 py-3 rounded-2xl inline-block text-2xl font-display font-bold mb-2 shadow-card`}
            >
              {badge.icon} {badge.name}
            </div>
            <p className="text-neutral-600 font-body">You&apos;ve earned a badge!</p>
          </div>

          <Card variant="flat" padding="md" className="max-w-xs mx-auto border border-brand-200/60">
            <div className="text-sm text-neutral-600 mb-1 font-body">Messages Sent</div>
            <div className="text-3xl font-display font-bold text-brand-600">{messageCount}</div>
          </Card>
        </Card>

        <Card variant="elevated" padding="lg" className="animate-fade-in">
          <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2 text-neutral-900">
            <Lightbulb className="w-6 h-6 text-amber-500 shrink-0" aria-hidden />
            Evaluation Results
          </h2>
          {(() => {
            if (!evaluation) {
              return (
                <div className="text-center py-6 text-neutral-500 font-body">
                  <p>⏳ Evaluation in progress... Please refresh in a moment.</p>
                  <Button className="mt-4" variant="primary" onClick={onFetchEvaluations}>
                    Refresh Evaluation
                  </Button>
                </div>
              );
            }

            if (evaluation.error) {
              return (
                <div className="text-center py-6 text-coral-600 font-body">
                  <p>❌ Evaluation failed: {evaluation.message || 'Unknown error'}</p>
                  <p className="text-sm text-neutral-600 mt-2">Please contact your teacher.</p>
                </div>
              );
            }

            const categoryScores = evaluation.categoryScores || {};
            const justifications = evaluation.justifications || {};

            return (
              <div className="space-y-3 stagger-children">
                {Object.entries(EVALUATION_CATEGORIES).map(([key, category]) => {
                  const score = categoryScores[key] || 0;
                  const justification = justifications[key] || 'No justification available';
                  const levelLabel =
                    score >= 4 ? 'Strong' : score >= 3 ? 'Proficient' : score >= 2 ? 'Developing' : 'Emerging';
                  const bgColor = score >= 3 ? 'bg-teal-50' : score >= 2 ? 'bg-amber-50' : 'bg-coral-50';
                  const levelColor =
                    score >= 3
                      ? 'bg-teal-100 text-teal-800'
                      : score >= 2
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-coral-100 text-coral-800';
                  const borderColor =
                    score >= 3 ? 'border-teal-500' : score >= 2 ? 'border-amber-500' : 'border-coral-500';

                  return (
                    <div key={key} className={`p-3 rounded-xl border-l-4 ${bgColor} ${borderColor}`}>
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-semibold text-neutral-900">{category.label}</div>
                          <div className="text-sm text-neutral-600 font-body">{category.description}</div>
                        </div>
                        <span
                          className={`text-sm font-semibold px-3 py-1 rounded-full shrink-0 ${levelColor}`}
                        >
                          {levelLabel}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-neutral-200/80">
                        <div className="text-xs text-neutral-600 italic font-body">&quot;{justification}&quot;</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Card>

        <Card variant="flat" padding="lg" className="border border-brand-200 bg-brand-50/80 animate-fade-in">
          <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2 text-brand-900">
            <TrendingUp className="w-6 h-6 shrink-0" aria-hidden />
            Next Steps
          </h2>
          {(assignment.evaluation?.totalScore || 0) >= 80 ? (
            <div className="space-y-2 text-brand-800 font-body">
              <p>
                🎉 <strong>Outstanding work!</strong> You explained all the key concepts clearly.
              </p>
              <p>
                💡 <strong>Challenge yourself:</strong> Try teaching a more advanced problem or help a classmate!
              </p>
            </div>
          ) : (assignment.evaluation?.totalScore || 0) >= 60 ? (
            <div className="space-y-2 text-brand-800 font-body">
              <p>
                👍 <strong>Good effort!</strong> You demonstrated understanding of some concepts.
              </p>
              <p>
                💡 <strong>Keep practicing:</strong> Try explaining the parts you missed to build stronger evidence.
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-brand-800 font-body">
              <p>
                🌱 <strong>Keep learning!</strong> This is a challenging topic.
              </p>
              <p>
                💡 <strong>Try again:</strong> Ask your teacher for help understanding the concepts, then reteach Zippy.
              </p>
            </div>
          )}
        </Card>

        <Button role={userRole === 'student' ? 'student' : userRole === 'parent' ? 'parent' : undefined} fullWidth icon={<Home className="w-5 h-5" />} onClick={onBackToDashboard}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default FeedbackView;
