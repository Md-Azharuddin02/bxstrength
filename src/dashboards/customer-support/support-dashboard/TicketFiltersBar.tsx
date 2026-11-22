import React from 'react';
import { Search } from 'lucide-react';
import { SortBy } from './types';
import { Select } from '../../../components/ui/Select';

interface TicketFiltersBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  sourceFilter: string;
  onSourceChange: (value: string) => void;
  sortBy: SortBy;
  onSortChange: (value: SortBy) => void;
  onClear: () => void;
}

// One toolbar: search + filters (source select replaces the old channel pills)
export const TicketFiltersBar: React.FC<TicketFiltersBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  sourceFilter,
  onSourceChange,
  sortBy,
  onSortChange,
  onClear
}) => {
  return (
    <div className="flex flex-col xl:flex-row gap-2 bg-[#121214] p-2 rounded-xl border border-zinc-800">
      <div className="relative flex-1 min-w-0">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, email, phone, ticket or booking ID"
          aria-label="Search tickets"
          className="w-full bg-[#18181b] border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#CCFF00]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label="Status" value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className="bg-[#18181b] border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#CCFF00] cursor-pointer">
          <option value="all">All statuses</option>
          <option value="new">New / open</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In progress</option>
          <option value="waiting_customer">Awaiting client</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </Select>
        <Select aria-label="Priority" value={priorityFilter} onChange={(e) => onPriorityChange(e.target.value)} className="bg-[#18181b] border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#CCFF00] cursor-pointer">
          <option value="all">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </Select>
        <Select aria-label="Channel" value={sourceFilter} onChange={(e) => onSourceChange(e.target.value)} className="bg-[#18181b] border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#CCFF00] cursor-pointer">
          <option value="all">All channels</option>
          <option value="Website Contact Form">Website form</option>
          <option value="Chatbot">Chatbot</option>
          <option value="Booking">Consultation / booking</option>
          <option value="Payment">Payment & billing</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Callback Request">Phone callback</option>
        </Select>
        <Select aria-label="Sort" value={sortBy} onChange={(e) => onSortChange(e.target.value as SortBy)} className="bg-[#18181b] border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#CCFF00] cursor-pointer">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="priority">Highest priority</option>
        </Select>
        {(statusFilter !== 'all' || priorityFilter !== 'all' || sourceFilter !== 'all' || searchTerm) && (
          <button
            onClick={onClear}
            className="text-sm text-zinc-400 hover:text-white px-2 py-2 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
