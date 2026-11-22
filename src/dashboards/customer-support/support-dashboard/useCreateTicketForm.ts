import React, { useState } from 'react';
import { SupportTicket, TicketCategory, TicketPriority, TicketSource } from '../../../types';
import { VelocityAPI } from '../../../services/api';

interface UseCreateTicketFormOptions {
  fetchTickets: () => void | Promise<void>;
  setSelectedTicket: (ticket: SupportTicket | null) => void;
  onShowToast: (msg: string) => void;
}

// Create Ticket Modal State
export const useCreateTicketForm = ({ fetchTickets, setSelectedTicket, onShowToast }: UseCreateTicketFormOptions) => {
  const [createTicketModalOpen, setCreateTicketModalOpen] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustEmail, setNewCustEmail] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustCountry, setNewCustCountry] = useState<string>('GB');
  const [newSubject, setNewSubject] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('General');
  const [newPriority, setNewPriority] = useState<TicketPriority>('normal');
  const [newSource, setNewSource] = useState<TicketSource>('Website Contact Form');

  const handleCreateNewTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustEmail || !newSubject || !newDesc) return;

    const created = VelocityAPI.createTicket({
      userName: newCustName,
      userEmail: newCustEmail,
      userPhone: newCustPhone,
      userCountry: newCustCountry,
      subject: newSubject,
      description: newDesc,
      category: newCategory,
      priority: newPriority,
      source: newSource,
      assignedAgent: 'CS Team'
    });

    setCreateTicketModalOpen(false);
    setNewCustName('');
    setNewCustEmail('');
    setNewCustPhone('');
    setNewSubject('');
    setNewDesc('');
    fetchTickets();
    setSelectedTicket(created);
    onShowToast(`New ticket #${created.id} logged successfully in CS Dashboard.`);
  };

  return {
    isOpen: createTicketModalOpen,
    open: () => setCreateTicketModalOpen(true),
    modalProps: {
      custName: newCustName,
      setCustName: setNewCustName,
      custEmail: newCustEmail,
      setCustEmail: setNewCustEmail,
      custPhone: newCustPhone,
      setCustPhone: setNewCustPhone,
      source: newSource,
      setSource: setNewSource,
      subject: newSubject,
      setSubject: setNewSubject,
      desc: newDesc,
      setDesc: setNewDesc,
      onSubmit: handleCreateNewTicketSubmit,
      onClose: () => setCreateTicketModalOpen(false)
    }
  };
};
