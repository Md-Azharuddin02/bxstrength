import React from 'react';
import { Globe, Menu, Plus, RefreshCw } from 'lucide-react';
import { NotificationBell } from '../NotificationBell';
import { AuthUser } from './types';

interface SupportTopBarProps {
  title?: string;
  user: AuthUser;
  onOpenMenu: () => void;
  onNewInquiry: () => void;
  onRefresh: () => void;
  bell: React.ComponentProps<typeof NotificationBell>;
}

export const SupportTopBar: React.FC<SupportTopBarProps> = ({
  title,
  user,
  onOpenMenu,
  onNewInquiry,
  onRefresh,
  bell
}) => {
  return (
    <header className="shrink-0 h-14 bg-[#121214] border-b border-zinc-800 px-3 sm:px-5 flex items-center justify-between gap-3 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onOpenMenu} className="lg:hidden p-2 rounded-xl bg-[#18181b] border border-zinc-800 text-zinc-300 cursor-pointer" aria-label="Open menu">
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-bold truncate">{title}</h1>
          <p className="hidden sm:block text-[11px] text-zinc-500 truncate">{user?.name} · {user?.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onNewInquiry}
          className="bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black uppercase px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">Log New Inquiry</span>
        </button>
        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-[#18181b] border border-zinc-800 hover:bg-zinc-800 cursor-pointer"
          title="Refresh live data"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-[#CCFF00]" />
        </button>
        <a href="/" target="_blank" rel="noopener noreferrer" className="hidden md:flex p-2 rounded-xl bg-[#18181b] border border-zinc-800 hover:bg-zinc-800" title="Open BxStrength website" aria-label="View website">
          <Globe className="w-4 h-4 text-[#CCFF00]" />
        </a>
        <NotificationBell {...bell} />
      </div>
    </header>
  );
};
