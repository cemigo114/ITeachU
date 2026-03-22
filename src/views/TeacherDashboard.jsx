import React from 'react';
import { BookOpen, BarChart3, LogOut } from 'lucide-react';
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

const TeacherDashboard = ({
  currentUser,
  assignments,
  onLogout,
  onNavigate,
  getBadge,
  EXAMPLE_TASKS,
}) => {
  return (
    <div className="min-h-screen bg-neutral-50 font-body view-enter">
      <PageHeader
        role="teacher"
        title="Teacher Dashboard"
        subtitle={`Welcome, ${currentUser?.name ?? 'Teacher'}`}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 stagger-children">
          <Card
            variant="interactive"
            accent="teacher"
            padding="lg"
            onClick={() => onNavigate('teacherBrowseTasks')}
            className="animate-slide-up"
          >
            <BookOpen className="w-12 h-12 text-brand-600 mb-3" aria-hidden />
            <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2">
              Browse Task Bank
            </h3>
            <p className="text-neutral-600 text-sm">
              View all {EXAMPLE_TASKS.length} available tasks and assign to students
            </p>
          </Card>

          <Card
            variant="interactive"
            accent="teacher"
            padding="lg"
            onClick={() => onNavigate('teacherReviewAssignments')}
            className="animate-slide-up"
          >
            <BarChart3 className="w-12 h-12 text-brand-600 mb-3" aria-hidden />
            <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2">
              Review Progress
            </h3>
            <p className="text-neutral-600 text-sm">View student work &amp; provide feedback</p>
          </Card>
        </div>

        <Card variant="elevated" padding="lg" className="animate-fade-in">
          <h2 className="text-xl font-display font-semibold text-neutral-900 mb-4">
            Recent Assignments
          </h2>
          <div className="space-y-3 stagger-children">
            {assignments.slice(0, 5).map((assignment) => (
              <Card
                key={assignment.id}
                variant="flat"
                padding="sm"
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-neutral-900">{assignment.studentName}</div>
                  <div className="text-sm text-neutral-600">{assignment.taskTitle}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge status={statusToBadgeStatus(assignment.status)} size="sm">
                    {assignment.status.replace('_', ' ')}
                  </Badge>
                  {assignment.status === 'completed' && (
                    <span
                      className={`text-sm font-semibold ${getBadge(assignment.evaluation?.totalScore || 0).color} text-white px-2 py-0.5 rounded-lg`}
                    >
                      {getBadge(assignment.evaluation?.totalScore || 0).icon}{' '}
                      {getBadge(assignment.evaluation?.totalScore || 0).name}
                    </span>
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

export default TeacherDashboard;
