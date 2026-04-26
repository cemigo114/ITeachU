import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';

const MOCK_TASK_BANK = [
  {
    id: 'proportional_unit_rate',
    title: 'Proportional Relationships \u2014 Unit Rate',
    standard: '7.RP.A.2',
    preview: 'Zippy is confused about why 3/6 and 1/2 represent the same unit rate. Help them understand by explaining\u2026',
    tags: [
      { label: '\u2605 Popular', type: 'new' },
      { label: 'Grade 7', type: 'grade' },
      { label: '~15 min', type: 'grade' },
    ],
  },
  {
    id: 'integers_adding_negatives',
    title: 'Integers \u2014 Adding Negatives',
    standard: '7.NS.A.1',
    preview: 'Zippy keeps getting confused when adding a negative number. Teach them the number line strategy\u2026',
    tags: [
      { label: 'Grade 7', type: 'grade' },
      { label: '~12 min', type: 'grade' },
    ],
  },
  {
    id: 'percent_finding_whole',
    title: 'Percent \u2014 Finding the Whole',
    standard: '7.RP.A.3',
    preview: "Zippy can find a percent of a number but doesn't understand how to work backwards to find the whole\u2026",
    tags: [
      { label: 'Grade 7', type: 'grade' },
      { label: '~18 min', type: 'grade' },
    ],
  },
];

const STUDENT_LIST = [
  { initials: 'AM', name: 'Alex M.' },
  { initials: 'JT', name: 'Jamie T.' },
  { initials: 'PL', name: 'Priya L.' },
  { initials: 'OW', name: 'Omar W.' },
  { initials: 'CJ', name: 'Casey J.' },
  { initials: 'RN', name: 'Rohan N.' },
  { initials: 'ZB', name: 'Zoe B.' },
  { initials: 'DK', name: 'Danny K.' },
];

export default function AssignView() {
  const navigate = useNavigate();
  const { EXAMPLE_TASKS, showToast } = useAppState();

  const [selectedTaskId, setSelectedTaskId] = useState(MOCK_TASK_BANK[0].id);
  const [assignMode, setAssignMode] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [dueDate, setDueDate] = useState('2025-04-30');
  const [notes, setNotes] = useState('');

  const toggleStudent = (initials) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(initials)) {
        next.delete(initials);
      } else {
        next.add(initials);
      }
      return next;
    });
  };

  const handleAssign = () => {
    const task = MOCK_TASK_BANK.find((t) => t.id === selectedTaskId);
    if (task) {
      showToast?.(`Task "${task.title}" assigned to class!`);
    }
    navigate('/report');
  };

  // Use EXAMPLE_TASKS from context if available, fall back to MOCK_TASK_BANK
  const tasks = MOCK_TASK_BANK;

  return (
    <div style={{ padding: '1.5rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
        }}
      >
        {/* Left column — Task bank */}
        <div>
          <h3
            className="font-display text-ink"
            style={{
              fontSize: '1rem',
              fontWeight: 500,
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
            }}
          >
            Task bank
          </h3>

          {tasks.map((task) => {
            const isSelected = task.id === selectedTaskId;
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="cursor-pointer transition-all"
                style={{
                  background: isSelected ? '#e8f2ef' : '#ffffff',
                  border: `1.5px solid ${isSelected ? '#4a7c6f' : '#d8e4e0'}`,
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '10px',
                  boxShadow: isSelected
                    ? '0 4px 16px oklch(49% 0.08 162 / 0.12)'
                    : 'none',
                }}
              >
                {/* Header: title + standard badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    className="text-ink"
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      lineHeight: 1.4,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {task.title}
                  </div>
                  <span
                    className="bg-sage-pale text-sage-deep"
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '5px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {task.standard}
                  </span>
                </div>

                {/* Preview text */}
                <div
                  className="text-muted"
                  style={{
                    fontSize: '11.5px',
                    lineHeight: 1.65,
                  }}
                >
                  {task.preview}
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '9px' }}>
                  {task.tags.map((tag) => (
                    <span
                      key={tag.label}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        ...(tag.type === 'new'
                          ? { background: '#e8f2ef', color: '#2d5249' }
                          : {
                              background: '#f5f8f6',
                              border: '1px solid #d8e4e0',
                              color: '#7a8c85',
                            }),
                      }}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column — Assign to */}
        <div>
          <h3
            className="font-display text-ink"
            style={{
              fontSize: '1rem',
              fontWeight: 500,
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
            }}
          >
            Assign to
          </h3>

          {/* Who receives? */}
          <div
            style={{
              background: '#f5f8f6',
              border: '1.5px solid #d8e4e0',
              borderRadius: '8px',
              padding: '1rem',
            }}
          >
            <h4
              className="text-muted"
              style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '10px',
              }}
            >
              Who receives this task?
            </h4>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setAssignMode('all')}
                className="transition-all"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: `1.5px solid ${assignMode === 'all' ? '#4a7c6f' : '#d8e4e0'}`,
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: assignMode === 'all' ? 600 : 400,
                  background: assignMode === 'all' ? '#e8f2ef' : 'white',
                  color: assignMode === 'all' ? '#2d5249' : 'inherit',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Whole class
              </button>
              <button
                onClick={() => setAssignMode('select')}
                className="transition-all"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: `1.5px solid ${assignMode === 'select' ? '#4a7c6f' : '#d8e4e0'}`,
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: assignMode === 'select' ? 600 : 400,
                  background: assignMode === 'select' ? '#e8f2ef' : 'white',
                  color: assignMode === 'select' ? '#2d5249' : 'inherit',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Select students
              </button>
            </div>

            {/* Student selection chips (visible when Select students is active) */}
            {assignMode === 'select' && (
              <div
                className="flex flex-wrap gap-1.5 bg-white"
                style={{
                  marginTop: '10px',
                  padding: '0.5rem',
                  borderRadius: '8px',
                }}
              >
                {STUDENT_LIST.map((s) => {
                  const isChosen = selectedStudents.has(s.initials);
                  return (
                    <div
                      key={s.initials}
                      onClick={() => toggleStudent(s.initials)}
                      className="cursor-pointer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: isChosen ? '#e8f2ef' : '#ffffff',
                        border: `1px solid ${isChosen ? '#4a7c6f' : '#d8e4e0'}`,
                        borderRadius: '20px',
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        color: '#3d4840',
                        fontWeight: 400,
                      }}
                    >
                      <div
                        className="flex items-center justify-center font-semibold"
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#e8f2ef',
                          color: '#2d5249',
                          fontSize: '9px',
                        }}
                      >
                        {s.initials}
                      </div>
                      {s.name}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Due date + Notes */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                className="block text-ink-soft font-semibold uppercase"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  marginBottom: '5px',
                }}
              >
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white text-ink font-body focus:outline-none transition-colors"
                style={{
                  padding: '9px 12px',
                  border: '1.5px solid #d8e4e0',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label
                className="block text-ink-soft font-semibold uppercase"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  marginBottom: '5px',
                }}
              >
                Notes to students (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. This connects to what we did on Tuesday\u2026"
                className="w-full bg-white text-ink font-body focus:outline-none transition-colors"
                style={{
                  padding: '9px 12px',
                  border: '1.5px solid #d8e4e0',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          {/* Assign button */}
          <button
            onClick={handleAssign}
            className="w-full text-white font-medium transition-all"
            style={{
              padding: '11px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #4a7c6f 0%, #2d5249 100%)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'center',
              letterSpacing: '-0.01em',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Assign to class &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
