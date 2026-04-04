import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

function formatMisconception(m) {
  if (m == null) return { text: '' };
  if (typeof m === 'string') return m;
  if (typeof m !== 'object') return String(m);
  const parts = [m.title, m.description].filter(Boolean);
  const text = parts.join(': ');
  if (m.type) return { text, type: m.type };
  return { text };
}

const TeacherTaskDetail = ({ task, onBack, onAssign }) => {
  if (!task) return null;

  const sections = task.sections || {};
  const misconceptions = sections.misconceptions || task.misconceptions || [];
  const mappingData = sections.mappingData || {};

  return (
    <div className="min-h-screen bg-neutral-50 font-body view-enter">
      <PageHeader
        role="teacher"
        title={task.title}
        subtitle={`${task.standard || task.ccssCode || ''} • ${task.grade}`}
        onBack={onBack}
      />

      <div className="max-w-5xl mx-auto p-6 space-y-4 stagger-children">
        <Card variant="elevated" padding="lg" className="animate-fade-in">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="brand" size="md">
              {task.standard || task.ccssCode}
            </Badge>
            <Badge variant="default" size="md">
              {task.grade}
            </Badge>
            <Badge variant="plum" size="md">
              {task.domain}
            </Badge>
          </div>

          <p className="text-neutral-700 mb-4">{task.description}</p>
          {task.standardDescription && (
            <p className="text-sm text-neutral-600 italic">{task.standardDescription}</p>
          )}
        </Card>

        {(sections.studentPrompt || task.problemStatement) && (
          <Card variant="elevated" padding="lg">
            <h2 className="text-lg font-display font-bold text-brand-900 mb-3">
              1. Student Prompt (Low Entry Point)
            </h2>
            <p className="text-neutral-700 whitespace-pre-line">
              {sections.studentPrompt || task.problemStatement}
            </p>
          </Card>
        )}

        {misconceptions.length > 0 && (
          <Card variant="elevated" padding="lg">
            <h2 className="text-lg font-display font-bold text-brand-900 mb-3">
              2. Possible Misconceptions
            </h2>
            <ul className="space-y-3">
              {misconceptions.map((raw, idx) => {
                const m = formatMisconception(raw);
                const text = typeof m === 'string' ? m : m.text;
                const type = typeof m === 'object' ? m.type : null;
                return (
                  <li key={idx} className="flex gap-3">
                    <span className="text-brand-600 font-semibold shrink-0">{idx + 1}.</span>
                    <div>
                      <span className="text-neutral-700">{text}</span>
                      {type && (
                        <span className="ml-2 text-xs text-neutral-400 italic">({type})</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {sections.patternRecognition && (
          <Card variant="elevated" padding="lg">
            <h2 className="text-lg font-display font-bold text-brand-900 mb-3">
              3. Pattern Recognition Prompt
            </h2>
            <p className="text-neutral-700 whitespace-pre-line">{sections.patternRecognition}</p>
          </Card>
        )}

        {sections.generalization && (
          <Card variant="elevated" padding="lg">
            <h2 className="text-lg font-display font-bold text-brand-900 mb-3">
              4. Generalization Question (Always/Sometimes/Never)
            </h2>
            <p className="text-neutral-700 whitespace-pre-line">{sections.generalization}</p>
          </Card>
        )}

        {sections.inference && (
          <Card variant="elevated" padding="lg">
            <h2 className="text-lg font-display font-bold text-brand-900 mb-3">
              5. Inference and Prediction
            </h2>
            <p className="text-neutral-700 whitespace-pre-line">{sections.inference}</p>
          </Card>
        )}

        {(mappingData.claims?.length > 0 || mappingData.evidence || mappingData.criticalThinking) && (
          <Card variant="elevated" padding="lg">
            <h2 className="text-lg font-display font-bold text-brand-900 mb-3">
              6. Mapping and Process Data
            </h2>
            <div className="space-y-3">
              {mappingData.claims?.length > 0 && (
                <div>
                  <h3 className="font-display font-semibold text-neutral-900 mb-1">Claims:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {mappingData.claims.map((claim, idx) => (
                      <li key={idx} className="text-neutral-700">{claim}</li>
                    ))}
                  </ul>
                </div>
              )}
              {mappingData.evidence && (
                <div>
                  <h3 className="font-display font-semibold text-neutral-900 mb-1">Evidence:</h3>
                  <p className="text-neutral-700">{mappingData.evidence}</p>
                </div>
              )}
              {mappingData.criticalThinking && (
                <div>
                  <h3 className="font-display font-semibold text-neutral-900 mb-1">
                    Process Data Revealing Critical Thinking:
                  </h3>
                  <p className="text-neutral-700">{mappingData.criticalThinking}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onBack}>
            Back to Task Bank
          </Button>
          <Button type="button" role="teacher" className="flex-1" onClick={() => onAssign(task)}>
            Assign to Students
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeacherTaskDetail;
