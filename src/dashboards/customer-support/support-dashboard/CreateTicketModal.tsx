import React from 'react';
import { X } from 'lucide-react';
import { TicketSource } from '../../../types';
import { PhoneInput } from '../../../components/PhoneInput';

interface CreateTicketModalProps {
  custName: string;
  setCustName: (v: string) => void;
  custEmail: string;
  setCustEmail: (v: string) => void;
  custPhone: string;
  setCustPhone: (v: string) => void;
  source: TicketSource;
  setSource: (v: TicketSource) => void;
  subject: string;
  setSubject: (v: string) => void;
  desc: string;
  setDesc: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  custName,
  setCustName,
  custEmail,
  setCustEmail,
  custPhone,
  setCustPhone,
  source,
  setSource,
  subject,
  setSubject,
  desc,
  setDesc,
  onSubmit,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
      <form onSubmit={onSubmit} className="bg-[#18181b] border-0 sm:border border-zinc-800 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg p-4 sm:p-6 rounded-none sm:rounded-2xl space-y-4 shadow-2xl animate-in zoom-in-95 overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-black uppercase text-[#CCFF00]">LOG NEW CUSTOMER INQUIRY / TICKET</h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Customer Name *</label>
            <input
              type="text"
              required
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Customer Email *</label>
            <input
              type="email"
              required
              value={custEmail}
              onChange={(e) => setCustEmail(e.target.value)}
              placeholder="e.g. john@example.co.uk"
              className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
            />
          </div>

          <PhoneInput
            label="Phone Number"
            value={custPhone}
            onChange={setCustPhone}
            inputClassName="w-full bg-[#121214] border border-zinc-800 rounded-xl pl-[104px] pr-2.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
          />

          <div>
            <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as TicketSource)}
              className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
            >
              <option value="Website Contact Form">Website Contact Form</option>
              <option value="Chatbot">Chatbot</option>
              <option value="Booking">Booking</option>
              <option value="Payment">Payment</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Callback Request">Callback Request</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Subject / Overview *</label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of inquiry..."
            className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Full Description *</label>
          <textarea
            required
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Detailed customer inquiry content..."
            rows={3}
            className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold uppercase rounded-lg hover:bg-zinc-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black uppercase rounded-lg shadow cursor-pointer"
          >
            CREATE TICKET
          </button>
        </div>
      </form>
    </div>
  );
};
