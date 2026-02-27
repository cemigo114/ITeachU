import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronRight, CheckCircle, Lock, Star } from 'lucide-react';
import StandardBadge from './StandardBadge';
import { API_ENDPOINTS } from '../config/api';

const TaskCollectionBrowser = ({ onSelectTask }) => {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.collections);
      const data = await response.json();
      setCollections(data.collections || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading task collections...</div>
      </div>
    );
  }

  // Collection grid view
  if (!selectedCollection) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Browse Tasks by Collection</h2>
          <p className="text-gray-600">Choose a unit or topic to explore available tasks</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setSelectedCollection(collection)}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition text-left group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition" />
              </div>

              <h3 className="font-semibold text-lg mb-2">{collection.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{collection.description}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500">
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
          className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          ← Back to Collections
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">{selectedCollection.title}</h2>
        <p className="text-gray-600">{selectedCollection.description}</p>
      </div>

      <div className="space-y-3">
        {selectedCollection.tasks.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-500">No tasks available in this collection yet.</p>
          </div>
        ) : (
          selectedCollection.tasks.map((taskRef, index) => {
            // In a real app, fetch task details from TASKS object or API
            const task = getTaskById(taskRef.id);

            if (!task) return null;

            const isLocked = index > 0 && !taskRef.required;

            return (
              <div
                key={taskRef.id}
                className={`bg-white rounded-xl shadow-md p-6 ${
                  isLocked ? 'opacity-60' : 'hover:shadow-lg cursor-pointer'
                } transition`}
                onClick={() => !isLocked && onSelectTask && onSelectTask(task)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-gray-500">
                        Task {index + 1}
                      </span>
                      {taskRef.required && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Required
                        </span>
                      )}
                      {isLocked && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Lock className="w-3 h-3" />
                          Complete previous task first
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>

                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{task.grade}</span>
                      {task.standardId && (
                        <>
                          <span>•</span>
                          <StandardBadge standardId={task.standardId} standardCode={task.standard} />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isLocked ? (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-gray-400" />
                      </div>
                    ) : (
                      <ChevronRight className="w-6 h-6 text-indigo-600" />
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

const TASK_DETAILS = {
  stack_of_cups: {
    id: 'stack_of_cups',
    title: 'Stack of Cups Challenge',
    grade: 'Grade 8',
    standard: '8.F.B.4',
    standardId: '06f7e578-0d65-55d4-a817-77e4cd0a4b05',
    description: 'Teach AI to understand linear patterns in stacked cups'
  },
  smoothie_recipe: {
    id: 'smoothie_recipe',
    title: 'Smoothie Recipe Ratios',
    grade: 'Grade 6',
    standard: '6.RP.A.3',
    standardId: '62d0029e-9b81-5f08-b0bb-8ae1ddc9e8d0',
    description: 'Teach AI about ratios and proportional relationships'
  },
  basketball_heights: {
    id: 'basketball_heights',
    title: 'The Basketball Team Heights',
    grade: 'Grade 6',
    standard: '6.SP.A.2',
    description: 'Analyze height data and use statistical measures to understand team composition'
  },
  solar_energy: {
    id: 'solar_energy',
    title: 'Solar Panel Energy',
    grade: 'Grade 6',
    standard: '6.EE.A.1',
    description: 'Use expressions to calculate energy production from solar panels'
  },
  unit_rates: {
    id: 'unit_rates',
    title: 'Comparing Unit Rates',
    grade: 'Grade 6',
    standard: '6.RP.A.3',
    description: 'Find and compare unit rates to determine the better buy'
  }
};

const getTaskById = (taskId) => TASK_DETAILS[taskId];

export default TaskCollectionBrowser;
