import React from 'react';
import { Users, BookOpen, UserCircle, ChevronRight } from 'lucide-react';
import LumoMascot from '../components/LumoMascot';
import Card from '../components/ui/Card';

const LoginView = ({ mascotEmotion, onLogin }) => {
  const roles = [
    {
      key: 'teacher',
      icon: Users,
      label: 'Teacher',
      description: 'Assign tasks & review progress',
      user: { name: 'Ms. Johnson', id: 'teacher_1' },
      colorClasses: 'bg-brand-600 hover:bg-brand-700 text-white',
      subtextClass: 'text-brand-200',
    },
    {
      key: 'student',
      icon: BookOpen,
      label: 'Student',
      description: 'Teach AI & earn badges',
      user: { name: 'Alex Rodriguez', id: 1 },
      colorClasses: 'bg-teal-600 hover:bg-teal-700 text-white',
      subtextClass: 'text-teal-200',
    },
    {
      key: 'parent',
      icon: UserCircle,
      label: 'Parent',
      description: "View child's progress",
      user: { name: 'Parent of Alex', id: 'parent_1', childId: 1 },
      colorClasses: 'bg-plum-600 hover:bg-plum-700 text-white',
      subtextClass: 'text-plum-200',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 view-enter">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-neutral-50 to-teal-50/30" />

      <Card variant="elevated" padding="lg" className="relative max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="w-[70px] h-[70px] mb-4 animate-float">
            <LumoMascot emotion={mascotEmotion} size="medium" />
          </div>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Cognality Learning
          </h1>
          <p className="text-neutral-500 mt-2 font-body">
            Transform assessment by teaching AI
          </p>
        </div>

        <div className="space-y-3 stagger-children">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.key}
                onClick={() => onLogin(role.key, role.user)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 shadow-soft hover:shadow-card focus-ring ${role.colorClasses}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-display font-semibold">{role.label}</div>
                    <div className={`text-sm ${role.subtextClass}`}>{role.description}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 opacity-70" />
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default LoginView;
