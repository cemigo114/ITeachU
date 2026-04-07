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
          selectedCollection.tasks.map((task, index) => {
            const isLocked = index > 0 && !task.required;

            return (
              <div
                key={task.id}
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
                      {task.required && (
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
                      <span>Grade {task.grade}</span>
                      {task.standard && (
                        <>
                          <span>•</span>
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">{task.standard}</span>
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

export default TaskCollectionBrowser;
