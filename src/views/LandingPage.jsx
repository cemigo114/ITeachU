import React from 'react';
import { Target, Users, Award, BarChart3, MessageSquare } from 'lucide-react';
import LumoMascot from '../components/LumoMascot';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const LandingPage = ({
  mascotEmotion,
  activeStep,
  setActiveStep,
  showStepDetail,
  setShowStepDetail,
  howItWorksSteps,
  onNavigateLogin,
  onLogin,
}) => {
  return (
    <div className="min-h-screen bg-neutral-50 view-enter">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-teal-50/40 to-plum-50/30" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
          <div className="flex flex-col items-center text-center stagger-children">
            <div className="w-[240px] h-[280px] -mb-12 animate-float">
              <LumoMascot emotion={mascotEmotion} size="medium" />
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-neutral-900 tracking-tight">
              Cognality Learning
            </h1>

            <p className="text-xl md:text-2xl text-neutral-500 mt-4 mb-12 font-body font-light max-w-2xl">
              Different minds, equal value — learning is more than a score.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <Button
                role="teacher"
                size="lg"
                className="w-64"
                onClick={() => onLogin('teacher', { name: 'Ms. Johnson', id: 'teacher_1' })}
              >
                I'm a Teacher
              </Button>
              <Button
                role="student"
                size="lg"
                className="w-64"
                onClick={() => onLogin('student', { name: 'Alex Rodriguez', id: 1 })}
              >
                I'm a Student
              </Button>
              <Button
                role="parent"
                size="lg"
                className="w-64"
                onClick={() => onLogin('parent', { name: 'Parent of Alex', id: 'parent_1', childId: 1 })}
              >
                I'm a Parent
              </Button>
            </div>

            <a
              href="https://drive.google.com/file/d/1asoeoDh-9WXbDVQJwv0WMdi0LrC-FWo0/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 text-brand-600 border-2 border-brand-200 rounded-xl font-semibold text-lg hover:bg-brand-50 hover:border-brand-300 transition-all duration-200"
            >
              Watch Demo
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Card variant="elevated" padding="lg" className="backdrop-blur-xl">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center text-neutral-900 mb-12">
            How It Works
          </h2>

          {showStepDetail && howItWorksSteps[activeStep] && (
            <div className="mb-8 p-6 bg-gradient-to-br from-brand-50 to-teal-50 rounded-2xl border border-brand-200/60 animate-scale-in">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  {howItWorksSteps[activeStep].illustration}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{howItWorksSteps[activeStep].icon}</span>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        howItWorksSteps[activeStep].color === 'indigo' ? 'bg-brand-100 text-brand-700' :
                        howItWorksSteps[activeStep].color === 'green' ? 'bg-teal-100 text-teal-700' :
                        'bg-plum-100 text-plum-700'
                      }`}>
                        {howItWorksSteps[activeStep].role}
                      </span>
                      <h3 className="text-2xl font-display font-bold text-neutral-900 mt-2">
                        {howItWorksSteps[activeStep].title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-neutral-600 text-lg font-body">
                    {howItWorksSteps[activeStep].description}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {howItWorksSteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => { setActiveStep(index); setShowStepDetail(true); }}
                  onMouseEnter={() => setActiveStep(index)}
                  className={`flex-shrink-0 w-48 p-6 rounded-2xl transition-all duration-300 snap-center cursor-pointer ${
                    activeStep === index
                      ? 'bg-gradient-to-br from-brand-600 to-teal-600 text-white scale-105 shadow-elevated'
                      : 'bg-neutral-50 text-neutral-700 hover:shadow-card hover:scale-[1.02] border border-neutral-200/60'
                  }`}
                >
                  <div className="text-4xl mb-3">{step.icon}</div>
                  <h4 className="font-display font-semibold text-sm leading-tight">
                    {step.title}
                  </h4>
                </button>
              ))}
            </div>

            <div className="flex justify-center gap-2 mt-6">
              {howItWorksSteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => { setActiveStep(index); setShowStepDetail(true); }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeStep === index
                      ? 'bg-brand-600 w-8'
                      : 'bg-neutral-300 w-2 hover:bg-neutral-400'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={onNavigateLogin}
              className="bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-700 hover:to-teal-700"
            >
              Get Started Today
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LandingPage;
