import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import tasksData from '../data/tasks.json';
import { EVALUATION_CATEGORIES } from '../data/mockData';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from './AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const AppStateContext = createContext(null);

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const TASKS = Object.fromEntries(
  Object.entries(tasksData.tasks).map(([id, task]) => [snakeToCamel(id), task])
);

const EXAMPLE_TASKS = Object.values(tasksData.tasks);

const getBadge = (totalScore) => {
  if (totalScore >= 85) return { name: 'Master Teacher', icon: '🏆', color: 'bg-yellow-500' };
  if (totalScore >= 70) return { name: 'Great Explainer', icon: '⭐', color: 'bg-sage' };
  if (totalScore >= 50) return { name: 'Good Helper', icon: '👍', color: 'bg-amber' };
  return { name: 'Getting Started', icon: '🌱', color: 'bg-muted' };
};

export function AppStateProvider({ children }) {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [classStudents, setClassStudents] = useState([]);
  const [currentClassId, setCurrentClassId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState(null);
  const [selectedStudentsForAssignment, setSelectedStudentsForAssignment] = useState([]);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);
  const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  const [evaluationData, setEvaluationData] = useState(null);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [collectionView, setCollectionView] = useState('all');

  const showToast = (message) => setToast({ message, visible: true });
  const dismissToast = useCallback(() => setToast(prev => ({ ...prev, visible: false })), []);
  const dismissConfirmModal = () => setConfirmModal({ show: false, title: '', message: '', onConfirm: null });

  // Fetch real assignments from backend when user is authenticated
  const fetchAssignments = useCallback(async () => {
    if (!token) return;
    setLoadingAssignments(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error('Error fetching assignments:', e);
    } finally {
      setLoadingAssignments(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      fetchAssignments();
    }
  }, [user, token, fetchAssignments]);

  // Fetch real students from teacher's class
  useEffect(() => {
    if (!token || !user || user.role !== 'teacher') return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/classes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.classes?.length > 0) {
          const cls = data.classes[0];
          setCurrentClassId(cls.id);
          const detailRes = await fetch(`${API_BASE_URL}/api/classes/${cls.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            const students = (detail.members || [])
              .filter(m => m.role === 'student')
              .map(m => ({
                id: m.userId,
                name: m.user?.name || 'Student',
                email: m.user?.email || '',
                grade: '',
              }));
            setClassStudents(students);
          }
        }
      } catch {}
    })();
  }, [token, user]);

  const fetchEvaluations = async () => {
    setLoadingEvaluations(true);
    try {
      const r = await fetch(API_ENDPOINTS.teacherConversations);
      if (!r.ok) throw new Error('Failed');
      setEvaluationData(await r.json());
    } catch (e) {
      console.error('Error fetching evaluations:', e);
      setEvaluationData(null);
    } finally {
      setLoadingEvaluations(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedTaskForAssignment || selectedStudentsForAssignment.length === 0) {
      alert('Please select a task and at least one student');
      return;
    }
    const taskId = selectedTaskForAssignment.id || selectedTaskForAssignment.slug;
    const taskTitle = selectedTaskForAssignment.title;

    try {
      const res = await fetch(`${API_BASE_URL}/api/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          classId: currentClassId,
          taskId,
          taskTitle,
          studentIds: selectedStudentsForAssignment,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Task "${taskTitle}" assigned to ${data.created} student(s)!`);
        setSelectedTaskForAssignment(null);
        setSelectedStudentsForAssignment([]);
        dismissConfirmModal();
        fetchAssignments();
        navigate('/assign');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to assign task');
      }
    } catch (e) {
      console.error('Assignment error:', e);
      alert('Could not connect to server');
    }
  };

  const updateAssignment = useCallback(async (assignmentId, updates) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchAssignments();
      }
    } catch (e) {
      console.error('Error updating assignment:', e);
    }
  }, [token, fetchAssignments]);

  const value = {
    TASKS, EXAMPLE_TASKS, MOCK_STUDENTS: classStudents, EVALUATION_CATEGORIES,
    assignments, setAssignments, loadingAssignments, fetchAssignments, updateAssignment,
    selectedTaskForAssignment, setSelectedTaskForAssignment,
    selectedStudentsForAssignment, setSelectedStudentsForAssignment,
    selectedTaskForDetail, setSelectedTaskForDetail,
    selectedAssignmentForReview, setSelectedAssignmentForReview,
    selectedStudentForDetail, setSelectedStudentForDetail,
    evaluationData, loadingEvaluations, fetchEvaluations,
    handleCreateAssignment,
    toast, showToast, dismissToast,
    confirmModal, dismissConfirmModal,
    getBadge,
    searchQuery, setSearchQuery,
    selectedGrade, setSelectedGrade,
    selectedDomain, setSelectedDomain,
    showFilters, setShowFilters,
    collectionView, setCollectionView,
    navigate,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}
