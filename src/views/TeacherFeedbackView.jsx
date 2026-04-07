import React from 'react';
import { Trophy, Lightbulb, TrendingUp, Users, AlertCircle, HelpCircle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const TeacherFeedbackView = ({
  assignment,
  evaluationData,
  loadingEvaluations,
  getBadge,
  onBack,
  EVALUATION_CATEGORIES,
}) => {
  const badge = getBadge(assignment.evaluation?.totalScore || 0);

  const findEvaluation = () => {
    let evaluation = null;
    if (evaluationData?.conversations) {
      if (assignment.sessionId) {
        const conv = evaluationData.conversations.find(c => c.sessionId === assignment.sessionId);
        if (conv) evaluation = conv.evaluation;
      }
      if (!evaluation) {
        const matchingConvs = evaluationData.conversations.filter(c => c.taskTitle === assignment.taskTitle);
        if (matchingConvs.length > 0) {
          const latest = matchingConvs.sort((a, b) =>
            new Date(b.updatedAt || b.timestamp) - new Date(a.updatedAt || a.timestamp)
          )[0];
          evaluation = latest.evaluation;
        }
      }
    }
    return evaluation;
  };

  const evaluation = findEvaluation();

  return (
    <div className="min-h-screen bg-neutral-50 font-body view-enter">
      <PageHeader
        role="teacher"
        title={`${assignment.studentName}'s Work`}
        subtitle={assignment.taskTitle}
        onBack={onBack}
      />

      <div className="max-w-4xl mx-auto p-6 space-y-6 stagger-children">
        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-display font-semibold mb-4">Assessment Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-50 p-4 rounded-xl">
              <div className="text-sm text-neutral-600 mb-1">Badge Earned</div>
              <div className={`${badge.color} text-white px-3 py-2 rounded-lg inline-block font-display font-semibold`}>
                {badge.icon} {badge.name}
              </div>
            </div>
          </div>
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-display font-semibold mb-4">Evaluation Breakdown</h2>
          {(() => {
            if (!evaluation || evaluation.error) {
              return (
                <div className="text-center py-6 text-neutral-500">
                  {loadingEvaluations ? (
                    <div>Loading evaluation...</div>
                  ) : (
                    <div>
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
                      <p className="text-sm">Evaluation not available yet</p>
                    </div>
                  )}
                </div>
              );
            }

            const categoryScores = evaluation.categoryScores || {};
            const justifications = evaluation.justifications || {};

            return (
              <div className="space-y-3">
                {Object.entries(EVALUATION_CATEGORIES).map(([key, category]) => {
                  const score = categoryScores[key] || 0;
                  const justification = justifications[key] || 'No justification available';
                  const levelLabel = score >= 4 ? 'Strong' : score >= 3 ? 'Proficient' : score >= 2 ? 'Developing' : 'Emerging';
                  const levelColor = score >= 3 ? 'bg-teal-100 text-teal-700' : score >= 2 ? 'bg-coral-100 text-coral-700' : 'bg-coral-200 text-coral-800';

                  return (
                    <div key={key} className="p-3 bg-neutral-50 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-display font-semibold">{category.label}</div>
                          <div className="text-sm text-neutral-600">{category.description}</div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${levelColor} ml-4`}>
                          {levelLabel}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-neutral-200">
                        <div className="text-xs text-neutral-600 italic font-body">"{justification}"</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-display font-semibold mb-4">Recommendations</h2>
          <div className="space-y-3">
            {(assignment.evaluation?.totalScore || 0) >= 80 ? (
              <>
                <div className="flex items-start gap-3 p-4 bg-teal-50 rounded-xl">
                  <Trophy className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-display font-semibold text-teal-900">Excellent Understanding!</div>
                    <div className="text-sm text-teal-700 font-body">Student demonstrated all key concepts. Ready for more advanced challenges.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-brand-50 rounded-xl">
                  <Lightbulb className="w-6 h-6 text-brand-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-display font-semibold text-brand-900">Next Steps</div>
                    <div className="text-sm text-brand-700 font-body">Consider assigning quadratic patterns or system of equations tasks.</div>
                  </div>
                </div>
              </>
            ) : (assignment.evaluation?.totalScore || 0) >= 60 ? (
              <>
                <div className="flex items-start gap-3 p-4 bg-coral-50 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-coral-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-display font-semibold text-coral-900">Partial Understanding</div>
                    <div className="text-sm text-coral-700 font-body">Student grasped some concepts but needs additional support to reach proficiency.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-brand-50 rounded-xl">
                  <Users className="w-6 h-6 text-brand-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-display font-semibold text-brand-900">Suggested Support</div>
                    <div className="text-sm text-brand-700 font-body">Small group work or peer teaching might help reinforce concepts.</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3 p-4 bg-coral-50 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-coral-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-display font-semibold text-coral-900">Additional Support Needed</div>
                    <div className="text-sm text-coral-700 font-body">Student struggled with core concepts. One-on-one intervention recommended.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-plum-50 rounded-xl">
                  <HelpCircle className="w-6 h-6 text-plum-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-display font-semibold text-plum-900">Intervention Strategy</div>
                    <div className="text-sm text-plum-700 font-body">Use concrete manipulatives and visual models before retrying this task.</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TeacherFeedbackView;
