import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronRight, CheckCircle, Lock, Star } from 'lucide-react';
import StandardBadge from './StandardBadge';
import { API_ENDPOINTS } from '../config/api';

const TaskCollectionBrowser = ({ onSelectTask }) => {
  const [collections, setCollections] = useState([]);
  const [taskMap, setTaskMap] = useState({});
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(API_ENDPOINTS.collections).then(r => r.json()),
      fetch(API_ENDPOINTS.tasks).then(r => r.json())
    ]).then(([collData, taskData]) => {
      setCollections(collData.collections || []);
      const map = {};
      for (const t of (taskData.tasks || [])) {
        map[t.id] = t;
      }
      setTaskMap(map);
      setLoading(false);
    }).catch(error => {
      console.error('Error fetching data:', error);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-500">Loading task collections...</div>
      </div>
    );
  }

  // Collection grid view
  if (!selectedCollection) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold mb-2">Browse Tasks by Collection</h2>
          <p className="text-neutral-600">Choose a unit or topic to explore available tasks</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setSelectedCollection(collection)}
              className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-card transition-all duration-200 text-left group card-interactive border border-neutral-200/60"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-brand-100 rounded-xl group-hover:bg-brand-200 transition">
                  <BookOpen className="w-6 h-6 text-brand-600" />
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-brand-600 transition" />
              </div>

              <h3 className="font-display font-semibold text-lg mb-2">{collection.title}</h3>
              <p className="text-sm text-neutral-600 mb-3">{collection.description}</p>

              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Grade {collection.grade}
                </span>
                <span>{collection.tasks.length} tasks</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Task list view within selected collection
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedCollection(null)}
          className="text-brand-600 hover:text-brand-700 flex items-center gap-1 font-semibold"
        >
          ← Back to Collections
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-display font-bold mb-2">{selectedCollection.title}</h2>
        <p className="text-neutral-600">{selectedCollection.description}</p>
      </div>

      <div className="space-y-3">
        {selectedCollection.tasks.length === 0 ? (
          <div className="bg-neutral-50 rounded-xl p-8 text-center">
            <p className="text-neutral-500">No tasks available in this collection yet.</p>
          </div>
        ) : (
          selectedCollection.tasks.map((taskRef, index) => {
            const task = taskMap[taskRef.id];

            if (!task) return null;

            const isLocked = index > 0 && !taskRef.required;

            return (
              <div
                key={taskRef.id}
                className={`bg-white rounded-2xl shadow-soft border border-neutral-200/60 p-6 ${
                  isLocked ? 'opacity-60' : 'hover:shadow-card cursor-pointer card-interactive'
                } transition-all duration-200`}
                onClick={() => !isLocked && onSelectTask && onSelectTask(task)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-neutral-500">
                        Task {index + 1}
                      </span>
                      {taskRef.required && (
                        <span className="text-xs bg-coral-100 text-coral-700 px-2 py-1 rounded-full">
                          Required
                        </span>
                      )}
                      {isLocked && (
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <Lock className="w-3 h-3" />
                          Complete previous task first
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-semibold text-lg mb-2">{task.title}</h3>
                    <p className="text-sm text-neutral-600 mb-3">{task.description}</p>

                    <div className="flex items-center gap-3 text-sm text-neutral-500">
                      <span>{task.grade}</span>
                      {(task.standardId || task.standard || task.ccssCode) && (
                        <>
                          <span>•</span>
                          {task.standardId ? (
                            <StandardBadge standardId={task.standardId} standardCode={task.standard || task.ccssCode} />
                          ) : (
                            <span className="text-brand-600 font-medium">{task.standard || task.ccssCode}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isLocked ? (
                      <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-neutral-400" />
                      </div>
                    ) : (
                      <ChevronRight className="w-6 h-6 text-brand-600" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TaskCollectionBrowser;
