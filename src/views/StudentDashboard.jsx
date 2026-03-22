import React from 'react';
import { BookOpen, CheckCircle, LogOut, Target, Trophy } from 'lucide-react';
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

const StudentDashboard = ({
  currentUser,
  assignments,
  getBadge,
  onStartTeaching,
  onViewFeedback,
  onBrowseTasks,
  onLogout,
}) => {
  const studentAssignments = assignments.filter((a) => a.studentId === currentUser.id);
  const completedCount = studentAssignments.filter((a) => a.status === 'completed').length;
  const totalBadges = studentAssignments
    .filter((a) => a.status === 'completed')
    .map((a) => getBadge(a.evaluation?.totalScore || 0));

  return (
    <div className="min-h-screen bg-neutral-50 font-body view-enter">
      <PageHeader
        role="student"
        title="My Learning Dashboard"
        subtitle={`Welcome, ${currentUser?.name ?? 'Student'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<BookOpen className="w-4 h-4" />}
              className="!border-white/40 !text-white hover:!bg-white/15"
              onClick={onBrowseTasks}
            >
              Browse Tasks
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<LogOut className="w-4 h-4" />}
              className="!border-white/40 !text-white hover:!bg-white/15"
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 stagger-children">
          <Card variant="elevated" padding="lg" accent="student" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-8 h-8 text-brand-600" aria-hidden />
              <h3 className="text-lg font-display font-semibold text-neutral-900">Tasks Assigned</h3>
            </div>
            <p className="text-3xl font-display font-bold text-brand-600">{studentAssignments.length}</p>
          </Card>

          <Card variant="elevated" padding="lg" accent="student" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-8 h-8 text-teal-600" aria-hidden />
              <h3 className="text-lg font-display font-semibold text-neutral-900">Completed</h3>
            </div>
            <p className="text-3xl font-display font-bold text-teal-600">{completedCount}</p>
          </Card>

          <Card variant="elevated" padding="lg" accent="student" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-amber-500" aria-hidden />
              <h3 className="text-lg font-display font-semibold text-neutral-900">Badges Earned</h3>
            </div>
            <p className="text-3xl font-display font-bold text-amber-500">{completedCount}</p>
          </Card>
        </div>

        <Card variant="elevated" padding="lg" className="mb-6 animate-fade-in">
          <h2 className="text-xl font-display font-semibold text-neutral-900 mb-4">My Badges</h2>
          <div className="flex flex-wrap gap-3 stagger-children">
            {totalBadges.length > 0 ? (
              totalBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className={`${badge.color} text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-soft inline-flex items-center gap-2 animate-scale-in`}
                >
                  <span>{badge.icon}</span>
                  {badge.name}
                </span>
              ))
            ) : (
              <p className="text-neutral-500 font-body">Complete tasks to earn badges!</p>
            )}
          </div>
        </Card>

        <Card variant="elevated" padding="lg" className="animate-fade-in">
          <h2 className="text-xl font-display font-semibold text-neutral-900 mb-4">My Assignments</h2>
          <div className="space-y-3 stagger-children">
            {studentAssignments.map((assignment) => (
              <Card
                key={assignment.id}
                variant="flat"
                padding="md"
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-neutral-900 font-display">{assignment.taskTitle}</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    {assignment.status === 'completed'
                      ? `Completed ${assignment.completedDate}`
                      : assignment.status === 'in_progress'
                        ? 'Continue teaching...'
                        : 'Ready to start'}
                  </p>
                  <div className="mt-2">
                    <Badge status={statusToBadgeStatus(assignment.status)} size="sm" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {assignment.status === 'completed' ? (
                    <>
                      <span
                        className={`text-sm font-semibold ${getBadge(assignment.evaluation?.totalScore || 0).color} text-white px-3 py-1 rounded-lg shadow-soft`}
                      >
                        {getBadge(assignment.evaluation?.totalScore || 0).icon}{' '}
                        {getBadge(assignment.evaluation?.totalScore || 0).name}
                      </span>
                      <Button size="sm" role="student" onClick={() => onViewFeedback(assignment)}>
                        View Feedback
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" role="student" onClick={() => onStartTeaching(assignment)}>
                      {assignment.status === 'in_progress' ? 'Continue' : 'Start Teaching'}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
