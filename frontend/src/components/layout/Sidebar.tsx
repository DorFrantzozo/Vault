import React from "react";
import {NavLink} from "react-router-dom";
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
  Briefcase,
  User,
  CreditCard,
} from "lucide-react";
import {useLogoutMutation} from "../../store/api/authApi.js";
import {useDispatch, useSelector} from "react-redux";
import {logoutUser} from "../../store/slices/authSlice.js";
import {RootState} from "../../store/store.js";
import {Button} from "../ui/button";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  setMobileOpen,
}) => {
  const [logout] = useLogoutMutation();
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(logoutUser());
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const mainMenu = [
    {name: "לוח בקרה", path: "/dashboard", icon: LayoutDashboard},
    {name: "אירועים ותפעול", path: "/events", icon: Calendar},
    {name: "חיובים קבועים", path: "/recurring", icon: CreditCard},
    {name: "ספר תנועות", path: "/ledger", icon: Receipt},
    {name: "לקוחות", path: "/clients", icon: Users},
    {name: "לוח שנה", path: "/calendar", icon: CalendarDays},
    {name: "יתרות וחובות", path: "/balances", icon: Briefcase},
  ];

  const preferenceMenu = [
    {name: "הגדרות", path: "/settings", icon: Settings},
    {name: "מרכז עזרה", path: "#help", icon: HelpCircle, disabled: true},
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-ink-black border-l border-white/10 w-64 p-6 text-white font-sans shadow-2xl">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 space-x-reverse px-2 py-2 mb-8">
        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-xl font-bold text-white tracking-tight font-heading block">
            Vault
          </span>
          <span className="block text-[11px] text-[#a3a19a] font-normal">
            ניהול כספים ותפעול
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto scrollbar-none">
        <div>
          <h3 className="px-3 text-xs font-semibold text-[#8b8983] uppercase tracking-[0.05em] mb-3 font-heading">
            תפריט ראשי
          </h3>
          <nav className="space-y-1.5">
            {mainMenu.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({isActive}) =>
                    `flex items-center space-x-3 space-x-reverse px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-canvas-cream text-ink-black shadow-xs"
                        : "text-[#b7b5ad] hover:text-white hover:bg-white/10"
                    }`
                  }
                >
                  {({isActive}) => (
                    <>
                      <Icon
                        className={`w-4 h-4 ${isActive ? "text-ink-black" : "text-[#8b8983]"}`}
                      />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <h3 className="px-3 text-xs font-semibold text-[#8b8983] uppercase tracking-[0.05em] mb-3 font-heading">
            העדפות
          </h3>
          <nav className="space-y-1.5">
            {preferenceMenu.map((item) => {
              const Icon = item.icon;
              if (item.disabled) {
                return (
                  <a
                    key={item.name}
                    href={item.path}
                    className="flex items-center space-x-3 space-x-reverse px-3.5 py-2.5 rounded-full text-xs font-medium text-white/30 cursor-not-allowed transition-all"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Icon className="w-4 h-4 text-white/30" />
                    <span>{item.name}</span>
                  </a>
                );
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({isActive}) =>
                    `flex items-center space-x-3 space-x-reverse px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-canvas-cream text-ink-black shadow-xs"
                        : "text-[#b7b5ad] hover:text-white hover:bg-white/10"
                    }`
                  }
                >
                  {({isActive}) => (
                    <>
                      <Icon
                        className={`w-4 h-4 ${isActive ? "text-ink-black" : "text-[#8b8983]"}`}
                      />
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
      <div className="pt-4 mt-auto border-t border-white/10">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center space-x-3 space-x-reverse truncate">
            <div className="w-8 h-8 rounded-full bg-ink-700 border border-white/10 text-white font-semibold flex items-center justify-center text-xs shrink-0">
              <User className="w-4 h-4 text-[#d8d6d0]" />
            </div>

            <div className="truncate">
              <h4 className="text-xs font-semibold text-white truncate">
                {user?.username || "אדמין"}
              </h4>
              <p className="text-[11px] text-[#b7b5ad] font-normal truncate mt-0.5">
                מנהל מערכת
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-[#b7b5ad] hover:text-danger hover:bg-white/10 shrink-0 h-8 w-8"
            title="התנתק מהמערכת"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Pinned Sidebar */}
      <aside className="hidden md:block fixed inset-y-0 right-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer — CSS transition, slides in from right */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside
            className="absolute top-0 right-0 h-full will-change-transform"
            style={{
              animation: "slideInRight 0.25s ease-out forwards",
            }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};
