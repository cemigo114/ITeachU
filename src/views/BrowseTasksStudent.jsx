import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import TaskCollectionBrowser from '../components/TaskCollectionBrowser';

const BrowseTasksStudent = ({ currentUser, onBack, onStartTeaching }) => {
  return (
    <div className="min-h-screen bg-neutral-50 font-body view-enter">
      <PageHeader
        role="student"
        title="Browse Tasks"
        subtitle="Explore available learning tasks"
        onBack={onBack}
      />

      <div className="max-w-7xl mx-auto p-6">
        <TaskCollectionBrowser
          onSelectTask={(task) => {
            const assignment = {
              id: Date.now(),
              studentId: currentUser?.id,
              studentName: currentUser?.name,
              taskId: task.id,
              taskTitle: task.title,
              status: 'in_progress',
              completedDate: null,
              messages: [],
            };
            onStartTeaching(assignment);
          }}
        />
      </div>
    </div>
  );
};

export default BrowseTasksStudent;
