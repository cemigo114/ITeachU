import React from 'react';
import { AlertCircle, BarChart3, MessageSquare, Target } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import TeacherReport from '../components/teacherReport';

const stripMeta = text => (text || '').replace(/<!--[\s\S]*?-->/g, '').trim();

const StudentDetailView = ({
  student,
  evaluationData,
  loadingEvaluations,
  getBadge,
  onBack,
  onViewFeedback,
}) => {
  const resolveEvaluation = () => {
    if (evaluationData?.conversations) {
      if (student.sessionId) {
        const conv = evaluationData.conversations.find(c => c.sessionId === student.sessionId);
        if (conv?.evaluation) return conv.evaluation;
      }
      const byTitle = evaluationData.conversations
        .filter(c => c.taskTitle === student.taskTitle)
        .sort((a, b) => new Date(b.updatedAt || b.timestamp) - new Date(a.updatedAt || a.timestamp));
      if (byTitle[0]?.evaluation) return byTitle[0].evaluation;
    }
    return student.evaluation || null;
  };

  const evaluation = resolveEvaluation();
  const badge = getBadge(evaluation?.totalScore || 0);

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

          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-6 stagger-children">

            {/* Score summary */}
            <Card variant="elevated" padding="lg" className="animate-fade-in">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-display font-semibold text-neutral-900">Evaluation Summary</h2>
                  <p className="text-sm text-neutral-500 mt-0.5">{student.taskTitle}</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className={`${badge.color} text-white px-4 py-2 rounded-xl font-display font-bold shadow-soft`}>
                    {badge.icon} {badge.name}
                  </div>
                </div>
              </div>
            </Card>

            {/* Cognitive Breakdown */}
            <Card variant="elevated" padding="lg" className="animate-fade-in">
              <h2 className="text-xl font-display font-semibold mb-4 text-neutral-900">Cognitive Breakdown Report</h2>

              {loadingEvaluations ? (
                <div className="text-center py-8 text-neutral-500">Loading evaluation…</div>
              ) : !evaluation || evaluation.error ? (
                <div className="text-center py-8 text-neutral-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-neutral-400" aria-hidden />
                  <p>{evaluation?.message || 'Evaluation not available yet'}</p>
                  <p className="text-sm mt-2">Complete the conversation to see evaluation results</p>
                </div>
              ) : (
                <TeacherReport
                  evaluation={evaluation}
                  studentName={student.studentName}
                />
              )}
            </Card>

            {/* Full Conversation */}
            {student.messages?.length > 0 && (
              <Card variant="elevated" padding="lg" className="animate-fade-in">
                <h2 className="text-xl font-display font-semibold mb-4 text-neutral-900">Full Conversation</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
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
                      <p className="text-sm text-neutral-800 whitespace-pre-wrap font-body">
                        {stripMeta(msg.content)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6 stagger-children">

            {/* Recommendations from student object (legacy) */}
            {student.recommendations?.length > 0 && (
              <Card variant="elevated" padding="lg" className="animate-fade-in">
                <h2 className="text-xl font-display font-semibold mb-4 text-neutral-900">Recommendations</h2>
                <div className="space-y-3">
                  {student.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl ${
                        rec.type === 'intervention' ? 'bg-coral-50 border border-coral-200'
                        : rec.type === 'support' ? 'bg-amber-50 border border-amber-200'
                        : rec.type === 'peer' ? 'bg-brand-50 border border-brand-200'
                        : 'bg-teal-50 border border-teal-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-2xl" aria-hidden>{rec.icon}</span>
                        <p className="text-sm flex-1 font-body">{rec.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick actions */}
            <Card variant="elevated" padding="lg" className="animate-fade-in">
              <h2 className="text-xl font-display font-semibold mb-4 text-neutral-900">Quick Actions</h2>
              <div className="space-y-3 stagger-children">
                <Button fullWidth icon={<MessageSquare className="w-4 h-4" />} onClick={() => onViewFeedback(student)}>
                  View Full Feedback
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
