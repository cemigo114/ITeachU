import React from 'react';
import { Users, BookOpen, UserCircle, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
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
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-[70px] h-[70px] mb-4 animate-float"
          >
            <LumoMascot emotion={mascotEmotion} size="small" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.1 }}
            className="text-3xl font-display font-bold text-neutral-900"
          >
            Cognality Learning
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.2 }}
            className="text-neutral-500 mt-2 font-body"
          >
            Transform assessment by teaching AI
          </motion.p>
        </div>

        <div className="space-y-3">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.button
                key={role.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.25 + index * 0.08 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
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
              </motion.button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default LoginView;
