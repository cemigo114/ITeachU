import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const TeacherTaskDetail = ({ task, onBack, onAssign }) => {
  if (!task) return null;

  return (
    <div className="min-h-screen bg-neutral-50 font-body view-enter">
      <PageHeader
        role="teacher"
        title={task.title}
        subtitle={`${task.standard} • ${task.grade}`}
        onBack={onBack}
      />

      <div className="max-w-5xl mx-auto p-6 space-y-4 stagger-children">
        <Card variant="elevated" padding="lg" className="animate-fade-in">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="brand" size="md">
              {task.standard}
            </Badge>
            <Badge variant="default" size="md">
              {task.grade}
            </Badge>
            <Badge variant="plum" size="md">
              {task.domain}
            </Badge>
          </div>

          <p className="text-neutral-700 mb-4">{task.description}</p>
          <p className="text-sm text-neutral-600 italic">{task.standardDescription}</p>
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="text-lg font-display font-bold text-brand-900 mb-3">
            1. Student Prompt (Low Entry Point)
          </h2>
          <p className="text-neutral-700">{task.sections.studentPrompt}</p>
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="text-lg font-display font-bold text-brand-900 mb-3">
            2. Possible Misconceptions
          </h2>
          <ul className="space-y-2">
            {task.sections.misconceptions.map((misconception, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="text-brand-600 font-semibold shrink-0">{idx + 1}.</span>
                <span className="text-neutral-700">{misconception}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="text-lg font-display font-bold text-brand-900 mb-3">
            3. Pattern Recognition Prompt
          </h2>
          <p className="text-neutral-700">{task.sections.patternRecognition}</p>
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="text-lg font-display font-bold text-brand-900 mb-3">
            4. Generalization Question (Always/Sometimes/Never)
          </h2>
          <p className="text-neutral-700">{task.sections.generalization}</p>
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="text-lg font-display font-bold text-brand-900 mb-3">
            5. Inference and Prediction
          </h2>
          <p className="text-neutral-700">{task.sections.inference}</p>
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="text-lg font-display font-bold text-brand-900 mb-3">
            6. Mapping and Process Data
          </h2>
          <div className="space-y-3">
            <div>
              <h3 className="font-display font-semibold text-neutral-900 mb-1">Claims:</h3>
              <ul className="list-disc list-inside space-y-1">
                {task.sections.mappingData.claims.map((claim, idx) => (
                  <li key={idx} className="text-neutral-700">
                    {claim}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display font-semibold text-neutral-900 mb-1">Evidence:</h3>
              <p className="text-neutral-700">{task.sections.mappingData.evidence}</p>
            </div>
            <div>
              <h3 className="font-display font-semibold text-neutral-900 mb-1">
                Process Data Revealing Critical Thinking:
              </h3>
              <p className="text-neutral-700">{task.sections.mappingData.criticalThinking}</p>
            </div>
          </div>
        </Card>

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
