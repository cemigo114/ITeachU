import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardList, BarChart3, Lightbulb, LogOut, Settings } from 'lucide-react';

function CognalityLogoMark() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5" />
      <path d="M5 8.5 Q8 5 11 8.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const teacherNav = [
  { to: '/assign', label: 'Assign', icon: ClipboardList },
  { to: '/report', label: 'Report', icon: BarChart3 },
  { to: '/recommendations', label: 'Recommendations', icon: Lightbulb },
];

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getPageInfo(pathname) {
  const routes = {
    '/assign/create': { title: 'Assign task', breadcrumb: [{ label: 'Task bank', to: '/assign' }] },
    '/assign/detail': { title: 'Task details', breadcrumb: [{ label: 'Task bank', to: '/assign' }] },
    '/assign': { title: 'Assign tasks' },
    '/report/feedback': { title: 'Student feedback', breadcrumb: [{ label: 'Class report', to: '/report' }] },
    '/report/student': { title: 'Student detail', breadcrumb: [{ label: 'Class report', to: '/report' }] },
    '/report': { title: 'Class report' },
    '/recommendations': { title: 'Recommendations' },
    '/setup': { title: 'Set up your class' },
    '/student': { title: 'My assignments' },
    '/parent': { title: "Your child's progress" },
  };
  for (const [path, info] of Object.entries(routes)) {
    if (pathname.startsWith(path)) return info;
  }
  return { title: 'Cognality' };
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'teacher';
  const pageInfo = getPageInfo(location.pathname);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Dark sidebar */}
      {isTeacher && (
        <aside className="w-[220px] bg-ink flex-shrink-0 flex flex-col py-5">
          {/* Logo */}
          <div className="px-5 pb-5 border-b border-white/[0.08] mb-3">
            <div className="w-8 h-8 bg-sage rounded-sm flex items-center justify-center mb-1.5">
              <CognalityLogoMark />
            </div>
            <span className="font-display text-sm text-white font-medium">Cognality</span>
          </div>

          {/* Class chip — clickable, navigates to class setup */}
          <button
            onClick={() => navigate('/setup')}
            className="mx-5 mb-4 w-[calc(100%-2.5rem)] text-left bg-white/5 border border-white/10 rounded-sm px-2.5 py-2 hover:bg-white/[0.08] hover:border-white/20 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <strong className="block text-white/85 font-medium text-xs">
                7th Grade Math · P3
              </strong>
              <Settings className="w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors" />
            </div>
            <span className="text-[11px] text-white/50">
              8 students · Ms. Rivera
            </span>
          </button>

          {/* Nav items */}
          <nav className="flex flex-col">
            {teacherNav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-5 py-2.5 text-[13px] border-l-[3px] transition-all duration-150 ${
                    isActive
                      ? 'text-white bg-white/[0.07] border-l-sage-light'
                      : 'text-white/45 border-l-transparent hover:text-white/80 hover:bg-white/[0.04]'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex-1" />

          {/* User info */}
          <div className="px-5 pt-3 border-t border-white/[0.08] flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sage flex items-center justify-center text-[11px] text-white font-medium flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] text-white/85 font-medium truncate">
                {user?.name}
              </span>
              <span className="block text-[10px] text-white/35 truncate">
                {user?.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-white/35 hover:text-white/70 transition-colors"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-surface">
        {/* Top bar */}
        <div className="bg-white border-b border-border px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {pageInfo.breadcrumb?.map((crumb, i) => (
              <React.Fragment key={crumb.to}>
                <button
                  onClick={() => navigate(crumb.to)}
                  className="text-[13px] text-muted hover:text-ink transition-colors"
                >
                  {crumb.label}
                </button>
                <span className="text-border text-[13px]">›</span>
              </React.Fragment>
            ))}
            <h1 className="font-display text-[17px] font-medium text-ink">
              {pageInfo.title}
            </h1>
          </div>
          {!isTeacher && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber flex items-center justify-center text-[11px] text-white font-medium">
                {getInitials(user?.name)}
              </div>
              <span className="text-[13px] font-medium text-ink">
                {user?.name}
              </span>
              <button
                onClick={logout}
                className="ml-2 text-muted hover:text-ink transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
