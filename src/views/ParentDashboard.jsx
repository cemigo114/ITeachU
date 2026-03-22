import React from 'react';
import { CheckCircle, LogOut, Target, Trophy } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

function statusToBadgeStatus(status) {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'assigned') return 'assigned';
  return 'pending';
}

const ParentDashboard = ({ currentUser, assignments, getBadge, onViewFeedback, onLogout }) => {
  const childAssignments = assignments.filter((a) => a.studentId === currentUser.childId);
  const completedCount = childAssignments.filter((a) => a.status === 'completed').length;
  const childName =
    childAssignments[0]?.studentName ||
    assignments.find((a) => a.studentId === currentUser.childId)?.studentName ||
    'your child';

  return (
    <div className="min-h-screen bg-neutral-50 font-body view-enter">
      <PageHeader
        role="parent"
        title="Parent Dashboard"
        subtitle={`Viewing progress for ${childName}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<LogOut className="w-4 h-4" />}
            className="!border-white/40 !text-white hover:!bg-white/15"
            onClick={onLogout}
          >
            Logout
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 stagger-children">
          <Card variant="elevated" padding="lg" accent="parent" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-8 h-8 text-brand-600" aria-hidden />
              <h3 className="text-lg font-display font-semibold text-neutral-900">Total Tasks</h3>
            </div>
            <p className="text-3xl font-display font-bold text-brand-600">{childAssignments.length}</p>
          </Card>

          <Card variant="elevated" padding="lg" accent="parent" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-8 h-8 text-teal-600" aria-hidden />
              <h3 className="text-lg font-display font-semibold text-neutral-900">Completed</h3>
            </div>
            <p className="text-3xl font-display font-bold text-teal-600">{completedCount}</p>
          </Card>

          <Card variant="elevated" padding="lg" accent="parent" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-amber-500" aria-hidden />
              <h3 className="text-lg font-display font-semibold text-neutral-900">Badges</h3>
            </div>
            <p className="text-3xl font-display font-bold text-amber-500">{completedCount}</p>
          </Card>
        </div>

        <Card variant="elevated" padding="lg" className="animate-fade-in">
          <h2 className="text-xl font-display font-semibold text-neutral-900 mb-4">Recent Activity</h2>
          <div className="space-y-3 stagger-children">
            {childAssignments.map((assignment) => {
              const badge = getBadge(assignment.evaluation?.totalScore || 0);
              return (
                <Card
                  key={assignment.id}
                  variant="flat"
                  padding="md"
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 font-display">{assignment.taskTitle}</h3>
                    <p className="text-sm text-neutral-600 mt-1 font-body">
                      {assignment.status === 'completed'
                        ? `Completed ${assignment.completedDate}`
                        : assignment.status === 'in_progress'
                          ? 'In progress...'
                          : 'Assigned'}
                    </p>
                    <div className="mt-2">
                      <Badge status={statusToBadgeStatus(assignment.status)} size="sm" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {assignment.status === 'completed' && (
                      <>
                        <span
                          className={`${badge.color} text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-soft inline-flex items-center gap-2`}
                        >
                          {badge.icon} {badge.name}
                        </span>
                        <Button size="sm" role="parent" onClick={() => onViewFeedback(assignment)}>
                          View Details
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ParentDashboard;
