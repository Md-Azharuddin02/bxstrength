import React, { useState } from 'react';
import { PhoneInput } from '../../../components/PhoneInput';

interface ContactPhoneFieldProps {
  phone?: string;
  /** Saves the number; resolves true on success so the field can close. */
  onSave: (phone: string) => Promise<boolean>;
}

// Shows the client's number, or lets support add one when the ticket has none.
export const ContactPhoneField: React.FC<ContactPhoneFieldProps> = ({ phone, onSave }) => {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  if (phone) return <strong className="text-white">{phone}</strong>;

  if (!adding) {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-zinc-500">Not provided</span>
        <button type="button" onClick={() => setAdding(true)} className="text-[#CCFF00] text-[11px] font-bold underline cursor-pointer">+ Add contact number</button>
      </span>
    );
  }

  const save = async () => {
    setSaving(true);
    const ok = await onSave(draft);
    setSaving(false);
    if (ok) { setAdding(false); setDraft(''); }
  };

  return (
    <div className="mt-1 space-y-2">
      <PhoneInput value={draft} onChange={setDraft} label="Contact number" inputClassName="w-full bg-[#18181b] border border-zinc-700 text-white pl-[84px] pr-3 py-1.5 text-xs font-bold rounded-lg outline-none" />
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={saving} className="px-3 py-1 bg-[#CCFF00] text-black text-[10px] font-black uppercase rounded-md cursor-pointer disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" onClick={() => { setAdding(false); setDraft(''); }} className="px-3 py-1 text-zinc-400 text-[10px] font-bold uppercase cursor-pointer">Cancel</button>
      </div>
    </div>
  );
};
