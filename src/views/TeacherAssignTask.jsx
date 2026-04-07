import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import StandardBadge from '../components/StandardBadge';

const TeacherAssignTask = ({
  selectedTask,
  setSelectedTask,
  TASKS,
  MOCK_STUDENTS,
  selectedStudents,
  setSelectedStudents,
  onCreateAssignment,
  onBack,
}) => {
  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedStudents(MOCK_STUDENTS.map((s) => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const toggleStudent = (studentId, checked) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-body view-enter">
      <PageHeader role="teacher" title="Assign New Task" onBack={onBack} />

      <div className="max-w-4xl mx-auto p-6 space-y-6 stagger-children">
        <Card variant="elevated" padding="lg" className="animate-fade-in">
          <h2 className="text-xl font-display font-semibold text-neutral-900 mb-4">
            Step 1: Choose Task
          </h2>

          {selectedTask ? (
            <div className="p-4 rounded-2xl border-2 border-brand-600 bg-brand-50/80">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-lg text-neutral-900 mb-1">
                    {selectedTask.title}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-2">{selectedTask.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <Badge variant="default" size="sm">
                      {selectedTask.grade}
                    </Badge>
                    {selectedTask.standardId ? (
                      <StandardBadge
                        standardId={selectedTask.standardId}
                        standardCode={selectedTask.standard}
                      />
                    ) : (
                      <Badge variant="brand" size="sm">
                        {selectedTask.standard}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setSelectedTask(null)}
                >
                  Change Task
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
              {Object.values(TASKS).map((task) => (
                <Card
                  key={task.id}
                  variant="interactive"
                  accent="teacher"
                  padding="md"
                  onClick={() => setSelectedTask(task)}
                  className="text-left border-2 border-neutral-200 hover:border-brand-300"
                >
                  <h3 className="font-display font-semibold text-lg text-neutral-900 mb-1">
                    {task.title}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-2">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <Badge variant="default" size="sm">
                      {task.grade}
                    </Badge>
                    <StandardBadge standardId={task.standardId} standardCode={task.standard || task.ccssCode} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {selectedTask && (
          <Card variant="elevated" padding="lg" className="animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-xl font-display font-semibold text-neutral-900">
                Step 2: Select Students
              </h2>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === MOCK_STUDENTS.length}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  className="w-5 h-5 rounded border-neutral-300 text-brand-600 focus:ring-brand-500 focus:ring-2"
                />
                <span className="font-semibold text-brand-600 text-sm sm:text-base">
                  Assign to All Students
                </span>
              </label>
            </div>

            <div className="space-y-2 stagger-children">
              {MOCK_STUDENTS.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100 cursor-pointer hover:bg-neutral-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={(e) => toggleStudent(student.id, e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-300 text-brand-600 focus:ring-brand-500 focus:ring-2 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-neutral-900">{student.name}</div>
                    <div className="text-sm text-neutral-600">
                      {student.grade} Grade • {student.email}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </Card>
        )}

        {selectedTask && selectedStudents.length > 0 && (
          <Button
            type="button"
            role="teacher"
            fullWidth
            size="lg"
            onClick={onCreateAssignment}
            className="animate-scale-in"
          >
            Assign Task to {selectedStudents.length} Student(s)
          </Button>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignTask;
