import React from 'react';
import type { User } from '../../types';
import {
  LayoutDashboard, Package, Video, ClipboardCheck, Users, Mail, MessageSquare, Lock,
  LogOut, Settings, PanelLeftClose, PanelLeftOpen, X,
} from 'lucide-react';

export type SupportTab =
  | 'dashboard' | 'paid_bookings' | 'free_consultations' | 'assessments' | 'coaches_workload'
  | 'inbox' | 'enquiries' | 'audit_logs';

export const SUPPORT_NAV: { id: SupportTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'paid_bookings', label: 'Paid Bookings & Dispatch', icon: Package },
  { id: 'free_consultations', label: 'Free Demo Sessions', icon: Video },
  { id: 'assessments', label: 'Athlete Assessments', icon: ClipboardCheck },
  { id: 'coaches_workload', label: 'Coach Workload', icon: Users },
  { id: 'inbox', label: 'Support Tickets', icon: Mail },
  { id: 'enquiries', label: 'Enquiries', icon: MessageSquare },
  { id: 'audit_logs', label: 'Audit Logs', icon: Lock },
];

interface Props {
  active: SupportTab;
  onSelect: (tab: SupportTab) => void;
  unread: Record<string, number>;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout?: () => void;
  user?: User | null;
  onEditProfile: () => void;
}

export const SupportSidebar: React.FC<Props> = ({ active, onSelect, unread, collapsed, onToggleCollapse, mobileOpen, onCloseMobile, onLogout, user, onEditProfile }) => (
  <>
    {mobileOpen && <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={onCloseMobile} aria-hidden />}
    <aside
      aria-label="Support navigation"
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#121214] border-r border-zinc-800 flex flex-col transition-all duration-200
        lg:static lg:z-auto lg:translate-x-0 ${collapsed ? 'lg:w-[68px]' : 'lg:w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-zinc-800">
        <span className={`text-sm font-black uppercase tracking-wider text-[#CCFF00] ${collapsed ? 'lg:hidden' : ''}`}>BxStrength CS</span>
        <button onClick={onCloseMobile} className="lg:hidden text-zinc-400 hover:text-white" aria-label="Close menu"><X className="w-5 h-5" /></button>
        <button onClick={onToggleCollapse} className="hidden lg:block text-zinc-400 hover:text-white" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {SUPPORT_NAV.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          const count = unread[id] || 0;
          return (
            <button
              key={id}
              onClick={() => { onSelect(id); onCloseMobile(); }}
              title={collapsed ? label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00] ${collapsed ? 'lg:justify-center' : ''} ${
                isActive ? 'bg-[#CCFF00] text-black font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className={`truncate text-left ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
              {count > 0 && (
                <span className={`bg-red-500 text-white text-[10px] font-mono font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center ${collapsed ? 'lg:absolute lg:top-0.5 lg:right-0.5' : 'ml-auto'}`}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-zinc-800 shrink-0 space-y-1">
        {user && (
          <button onClick={() => { onEditProfile(); onCloseMobile(); }} title="Edit profile" className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-800/60 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00] ${collapsed ? 'lg:justify-center' : ''}`}>
            <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`} alt="" className="w-8 h-8 rounded-full object-cover border border-[#CCFF00]/60 shrink-0" />
            <span className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="block text-sm text-white truncate">{user.name}</span>
              <span className="block text-xs text-zinc-500 truncate">Customer support</span>
            </span>
            <Settings className={`w-4 h-4 text-zinc-500 shrink-0 ${collapsed ? 'lg:hidden' : ''}`} aria-hidden />
          </button>
        )}
        {onLogout && (
          <button onClick={onLogout} title="Log out" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${collapsed ? 'lg:justify-center' : ''}`}>
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}>Log out</span>
          </button>
        )}
      </div>
    </aside>
  </>
);
