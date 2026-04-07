import React from 'react';
import { AlertCircle, BarChart3, MessageSquare, Target } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const StudentDetailView = ({
  student,
  evaluationData,
  loadingEvaluations,
  getBadge,
  onBack,
  onViewFeedback,
  EVALUATION_CATEGORIES,
}) => {
  const badge = getBadge(student.evaluation?.totalScore || 0);

  return (
    <div className="min-h-screen bg-neutral-50 font-body view-enter">
      <PageHeader
        role="teacher"
        title={student.studentName}
        subtitle={`${student.taskTitle} • ${student.status === 'completed' ? `Completed ${student.completedDate}` : 'In Progress'}`}
        onBack={onBack}
      />

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 stagger-children">
            <Card variant="elevated" padding="lg" className="animate-fade-in">
              <h2 className="text-xl font-display font-semibold mb-4 text-neutral-900">Evaluation Summary</h2>
              {(() => {
                let evaluation = null;

                if (evaluationData?.conversations) {
                  if (student.sessionId) {
                    const conv = evaluationData.conversations.find((c) => c.sessionId === student.sessionId);
                    if (conv) evaluation = conv.evaluation;
                  }

                  if (!evaluation) {
                    const matchingConvs = evaluationData.conversations.filter((c) => c.taskTitle === student.taskTitle);
                    if (matchingConvs.length > 0) {
                      const latest = matchingConvs.sort(
                        (a, b) => new Date(b.updatedAt || b.timestamp) - new Date(a.updatedAt || a.timestamp),
                      )[0];
                      evaluation = latest.evaluation;
                    }
                  }
                }

                if (!evaluation || evaluation.error) {
                  return (
                    <div className="text-center py-8 text-neutral-500 font-body">
                      {loadingEvaluations ? (
                        <div>Loading evaluation...</div>
                      ) : (
                        <div>
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-neutral-400" aria-hidden />
                          <p>Evaluation not available yet</p>
                          <p className="text-sm mt-2">Complete the conversation to see evaluation results</p>
                        </div>
                      )}
                    </div>
                  );
                }

                const categoryScores = evaluation.categoryScores || {};
                const justifications = evaluation.justifications || {};

                return (
                  <>
                    <div className="mb-6 bg-neutral-100 p-4 rounded-2xl text-center border border-neutral-200/80">
                      <div className="text-sm text-neutral-600 mb-1 font-body">Badge Earned</div>
                      <div className={`${badge.color} text-white px-4 py-2 rounded-xl inline-block text-lg font-display font-bold shadow-soft`}>
                        {badge.icon} {badge.name}
                      </div>
                    </div>

                    <div className="space-y-4 stagger-children">
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

                        return (
                          <div
                            key={key}
                            className={`p-4 rounded-xl border-l-4 ${bgColor} ${
                              score >= 3 ? 'border-teal-500' : score >= 2 ? 'border-amber-500' : 'border-coral-500'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2 gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-display font-semibold text-neutral-900">{category.label}</div>
                                <div className="text-sm text-neutral-600 mt-1 font-body">{category.description}</div>
                              </div>
                              <span className={`text-sm font-semibold px-3 py-1 rounded-full shrink-0 ${levelColor}`}>
                                {levelLabel}
                              </span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-neutral-200">
                              <div className="text-sm font-medium text-neutral-700 mb-1 font-body">Evidence:</div>
                              <div className="text-sm text-neutral-600 italic font-body">&quot;{justification}&quot;</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </Card>

            {student.evaluation && (
              <Card variant="elevated" padding="lg" className="animate-fade-in">
                <h2 className="text-xl font-display font-semibold mb-4 text-neutral-900">Competency Evaluation</h2>

                <div className="mb-6 p-4 bg-gradient-to-r from-brand-50 to-plum-50 rounded-2xl border border-brand-100/60">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="text-sm text-neutral-600 font-medium font-body">Badge Earned</div>
                      <div
                        className={`${getBadge(student.evaluation.totalScore || 0).color} text-white px-4 py-2 rounded-xl inline-block text-lg font-display font-bold mt-1 shadow-soft`}
                      >
                        {getBadge(student.evaluation.totalScore || 0).icon}{' '}
                        {getBadge(student.evaluation.totalScore || 0).name}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-neutral-500 mb-1 font-body">Proficiency Level</div>
                      <Badge
                        size="md"
                        variant={
                          student.evaluation.totalScore >= 80
                            ? 'teal'
                            : student.evaluation.totalScore >= 60
                              ? 'warning'
                              : 'coral'
                        }
                      >
                        {student.evaluation.totalScore >= 80
                          ? 'PROFICIENT'
                          : student.evaluation.totalScore >= 60
                            ? 'DEVELOPING'
                            : 'EMERGING'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 stagger-children">
                  {Object.entries(EVALUATION_CATEGORIES).map(([key, category]) => {
                    const score = student.evaluation.categoryScores?.[key] || 0;
                    const justification = student.evaluation.justifications?.[key] || 'No evaluation available';
                    const levelLabel =
                      score >= 4 ? 'Strong' : score >= 3 ? 'Proficient' : score >= 2 ? 'Developing' : 'Emerging';
                    const levelColor =
                      score >= 3
                        ? 'bg-teal-100 text-teal-800'
                        : score >= 2
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-coral-100 text-coral-800';

                    return (
                      <div key={key} className="p-4 bg-neutral-50 rounded-xl border-l-4 border-brand-400">
                        <div className="flex items-start justify-between mb-2 gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display font-semibold text-neutral-900">{category.label}</h3>
                            <p className="text-xs text-neutral-500 mt-1 font-body">{category.description}</p>
                          </div>
                          <span className={`text-sm font-semibold px-3 py-1 rounded-full shrink-0 ${levelColor}`}>
                            {levelLabel}
                          </span>
                        </div>
                        <div className="mt-2 p-3 bg-white rounded-xl border border-neutral-200/80">
                          <div className="text-xs font-semibold text-neutral-600 mb-1 font-body">Evidence:</div>
                          <p className="text-sm text-neutral-700 font-body">{justification}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-neutral-100 rounded-2xl border border-neutral-200/80">
                  <div className="text-xs font-semibold text-neutral-600 mb-2 font-body">Proficiency Levels:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600 font-body">
                    <div>• <strong>Strong:</strong> Demonstrates mastery</div>
                    <div>• <strong>Proficient:</strong> Generally proficient</div>
                    <div>• <strong>2 - Emerging:</strong> Partial understanding</div>
                    <div>• <strong>1 - Weak:</strong> Limited demonstration</div>
                  </div>
                </div>
              </Card>
            )}

            {student.messages && student.messages.length > 0 && (
              <Card variant="elevated" padding="lg" className="animate-fade-in">
                <h2 className="text-xl font-display font-semibold mb-4 text-neutral-900">Full Conversation</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar stagger-children pr-1">
                  {student.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl ${
                        msg.role === 'assistant'
                          ? 'bg-brand-50 border-l-4 border-brand-400'
                          : 'bg-teal-50 border-l-4 border-teal-500'
                      }`}
                    >
                      <div className="font-semibold text-xs mb-1 text-neutral-600 font-body">
                        {msg.role === 'assistant' ? 'Zippy (AI)' : 'Student'}
                      </div>
                      <p className="text-sm text-neutral-800 whitespace-pre-wrap font-body">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {student.conversationSnippets && student.conversationSnippets.length > 0 && (
              <Card variant="elevated" padding="lg" className="animate-fade-in">
                <h2 className="text-xl font-display font-semibold mb-4 text-neutral-900">Key Conversation Moments</h2>
                <div className="space-y-4 stagger-children">
                  {student.conversationSnippets.map((snippet, idx) => (
                    <div key={idx} className="border-l-4 border-brand-500 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm font-display">{snippet.speaker}:</span>
                        <Badge variant="brand" size="sm">
                          {snippet.tag}
                        </Badge>
                      </div>
                      <p className="text-neutral-700 italic font-body">&quot;{snippet.text}&quot;</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6 stagger-children">
            {student.recommendations && student.recommendations.length > 0 && (
              <Card variant="elevated" padding="lg" className="animate-fade-in">
                <h2 className="text-xl font-display font-semibold mb-4 text-neutral-900">Recommendations</h2>
                <div className="space-y-3">
                  {student.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl ${
                        rec.type === 'intervention'
                          ? 'bg-coral-50 border border-coral-200'
                          : rec.type === 'support'
                            ? 'bg-amber-50 border border-amber-200'
                            : rec.type === 'peer'
                              ? 'bg-brand-50 border border-brand-200'
                              : 'bg-teal-50 border border-teal-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-2xl" aria-hidden>
                          {rec.icon}
                        </span>
                        <p className="text-sm flex-1 font-body">{rec.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card variant="elevated" padding="lg" className="animate-fade-in">
              <h2 className="text-xl font-display font-semibold mb-4 text-neutral-900">Quick Actions</h2>
              <div className="space-y-3 stagger-children">
                <Button fullWidth icon={<MessageSquare className="w-4 h-4" />} onClick={() => onViewFeedback(student)}>
                  View Feedback
                </Button>
                <Button fullWidth role="teacher" icon={<Target className="w-4 h-4" />}>
                  Assign New Task
                </Button>
                <Button fullWidth variant="secondary" icon={<BarChart3 className="w-4 h-4" />}>
                  View All Progress
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailView;
