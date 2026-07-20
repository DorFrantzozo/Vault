import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
  Users,
  Calendar,
  LogOut,
  Settings,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useLogoutMutation } from '../../store/api/authApi.js';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice.js';
import { RootState } from '../../store/store.js';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const [logout] = useLogoutMutation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(logoutUser());
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const mainMenu = [
    { name: 'לוח בקרה', path: '/dashboard', icon: LayoutDashboard },
    { name: 'לוח שנה', path: '/calendar', icon: CalendarDays },
    { name: 'ספר תנועות', path: '/ledger', icon: Receipt },
    { name: 'לקוחות', path: '/clients', icon: Users },
    { name: 'אירועים ותפעול', path: '/events', icon: Calendar },
  ];

  const preferenceMenu = [
    { name: 'הגדרות', path: '/settings', icon: Settings },
    { name: 'מרכז עזרה', path: '#help', icon: HelpCircle, disabled: true },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0d0e15] border-l border-zinc-800/80 w-64 p-4 text-zinc-300">
      {/* Brand Header */}
      <div className="flex items-center space-x-2.5 space-x-reverse px-2 py-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-indigo-500/20">
          <Sparkles className="w-4 h-4 text-white fill-white/20" />
        </div>
        <span className="text-base font-bold text-white tracking-tight">FinOps</span>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto">
        <div>
          <h3 className="px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            תפריט ראשי
          </h3>
          <nav className="space-y-1">
            {mainMenu.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 space-x-reverse px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <h3 className="px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            העדפות
          </h3>
          <nav className="space-y-1">
            {preferenceMenu.map((item) => {
              const Icon = item.icon;
              if (item.disabled) {
                return (
                  <a
                    key={item.name}
                    href={item.path}
                    className="flex items-center space-x-2.5 space-x-reverse px-3 py-2 rounded-lg text-xs font-medium text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-400 cursor-not-allowed transition-all"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Icon className="w-4 h-4 text-zinc-500" />
                    <span>{item.name}</span>
                  </a>
                );
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 space-x-reverse px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="pt-3 mt-auto border-t border-zinc-800/80">
        <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
          <div className="flex items-center space-x-2.5 space-x-reverse truncate">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/60 text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
              {(user?.username || 'A')[0].toUpperCase()}
            </div>

            <div className="truncate">
              <h4 className="text-xs font-semibold text-white truncate">
                {user?.username || 'admin'}
              </h4>
              <p className="text-[10px] text-zinc-400 truncate">
                מנהל מערכת
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors shrink-0"
            title="התנתק מהמערכת"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block fixed inset-y-0 right-0 z-30">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex-1 max-w-xs">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
