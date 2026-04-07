import React from 'react';
import { Home, Trophy } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import TeacherReport from '../components/teacherReport';
import StudentReport from '../components/StudentReport';

const FeedbackView = ({
  assignment,
  evaluationData,
  userRole,
  currentUser,
  getBadge,
  onFetchEvaluations,
  onBackToDashboard,
}) => {
  const resolveEvaluation = () => {
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
    return assignment.evaluation || null;
  };

  const evaluation = resolveEvaluation();
  const badge = getBadge(evaluation?.totalScore || 0);
  const messageCount = assignment.messages?.length ?? 0;

  return (
    <div className="min-h-screen bg-neutral-50 font-body view-enter">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-brand-600 text-white p-6 shadow-card">
        <div className="max-w-4xl mx-auto text-center animate-celebrate">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-95" aria-hidden />
          <h1 className="text-3xl font-display font-bold mb-2">Session Complete!</h1>
          <p className="text-teal-100 font-body">Here's how you did teaching Zippy</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Score card */}
        <Card variant="elevated" padding="lg" className="text-center animate-fade-in">
          <div className="mb-4">
            <div className={`${badge.color} text-white px-6 py-3 rounded-2xl inline-block text-2xl font-display font-bold mb-2 shadow-card`}>
              {badge.icon} {badge.name}
            </div>
          </div>
          <div className="flex justify-center gap-6 text-sm text-neutral-600">
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-brand-600">{messageCount}</div>
              <div>Messages sent</div>
            </div>
          </div>
        </Card>

        {/* Evaluation */}
        <Card variant="elevated" padding="lg" className="animate-fade-in">
          <h2 className="text-xl font-display font-semibold mb-4 text-neutral-900">Your Feedback</h2>

          {!evaluation ? (
            <div className="text-center py-6 text-neutral-500 font-body">
              <p>⏳ Evaluation in progress… check back in a moment.</p>
              <Button className="mt-4" variant="primary" onClick={onFetchEvaluations}>
                Refresh
              </Button>
            </div>
          ) : evaluation.error ? (
            <div className="text-center py-6 text-coral-600 font-body">
              <p>❌ {evaluation.message || 'Evaluation failed. Please contact your teacher.'}</p>
            </div>
          ) : userRole === 'student' ? (
            <StudentReport
              evaluation={evaluation}
              studentName={currentUser?.name?.split(' ')[0] || 'You'}
              taskTitle={assignment?.taskTitle}
              onStartNextSession={onBackToDashboard}
              onViewBadges={onBackToDashboard}
            />
          ) : (
            <TeacherReport evaluation={evaluation} />
          )}
        </Card>

        <Button
          role={userRole === 'student' ? 'student' : userRole === 'parent' ? 'parent' : undefined}
          fullWidth
          icon={<Home className="w-5 h-5" />}
          onClick={onBackToDashboard}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default FeedbackView;
