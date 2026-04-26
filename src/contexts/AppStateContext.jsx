import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import tasksData from '../data/tasks.json';
import { MOCK_STUDENTS, MOCK_ASSIGNMENTS, EVALUATION_CATEGORIES } from '../data/mockData';
import { API_ENDPOINTS } from '../config/api';

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
  if (totalScore >= 70) return { name: 'Great Explainer', icon: '⭐', color: 'bg-brand-500' };
  if (totalScore >= 50) return { name: 'Good Helper', icon: '👍', color: 'bg-teal-500' };
  return { name: 'Getting Started', icon: '🌱', color: 'bg-neutral-500' };
};

export function AppStateProvider({ children }) {
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState(MOCK_ASSIGNMENTS);
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

  const handleCreateAssignment = () => {
    if (!selectedTaskForAssignment || selectedStudentsForAssignment.length === 0) {
      alert('Please select a task and at least one student');
      return;
    }
    const taskId = selectedTaskForAssignment.id || selectedTaskForAssignment.slug;
    const duplicateStudentIds = selectedStudentsForAssignment.filter((studentId) =>
      assignments.some((a) => a.studentId === studentId && a.taskId === taskId)
    );

    const doAssign = (studentIds) => {
      if (studentIds.length === 0) { dismissConfirmModal(); return; }
      const newAssignments = studentIds.map((studentId) => {
        const student = MOCK_STUDENTS.find((s) => s.id === studentId);
        return {
          id: assignments.length + studentId,
          studentId: student.id, studentName: student.name,
          taskId, taskTitle: selectedTaskForAssignment.title,
          status: 'assigned', completedDate: null, messages: [],
        };
      });
      setAssignments((prev) => [...prev, ...newAssignments]);
      setSelectedTaskForAssignment(null);
      setSelectedStudentsForAssignment([]);
      dismissConfirmModal();
      navigate('/assign');
      showToast(`Task "${selectedTaskForAssignment.title}" assigned to ${studentIds.length} student(s)!`);
    };

    if (duplicateStudentIds.length > 0) {
      const duplicateNames = duplicateStudentIds
        .map((id) => MOCK_STUDENTS.find((s) => s.id === id)?.name)
        .filter(Boolean).join(', ');
      setConfirmModal({
        show: true, title: 'Duplicate Assignment',
        message: `${duplicateNames} already assigned "${selectedTaskForAssignment.title}". Assign anyway?`,
        onConfirm: () => doAssign(selectedStudentsForAssignment),
      });
      return;
    }
    doAssign(selectedStudentsForAssignment);
  };

  const value = {
    TASKS, EXAMPLE_TASKS, MOCK_STUDENTS, EVALUATION_CATEGORIES,
    assignments, setAssignments,
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
