import React, { useState } from 'react';
import { Announcement } from '../../types';
import { VelocityAPI } from '../../services/api';
import { ShieldAlert, Plus, Send, Trash2, Edit2, X } from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Select } from '../../components/ui/Select';

interface AnnouncementsManagerProps {
  announcements: Announcement[];
  onAnnouncementsUpdated: () => void;
  onShowToast: (msg: string) => void;
}

export const AnnouncementsManager: React.FC<AnnouncementsManagerProps> = ({
  announcements,
  onAnnouncementsUpdated,
  onShowToast
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState<'all' | 'client' | 'coach' | 'staff'>('all');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [deletingAnn, setDeletingAnn] = useState<{ id: string; title: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      onShowToast('Title and message are required');
      return;
    }

    if (editingAnn) {
      VelocityAPI.updateAnnouncement(editingAnn.id, {
        title,
        message,
        targetRole,
        priority
      });
      onShowToast(`Updated announcement "${title}" successfully!`);
      setEditingAnn(null);
    } else {
      VelocityAPI.createAnnouncement(title, message, targetRole, priority);
      onShowToast(`Broadcast announcement "${title}" successfully!`);
    }

    setTitle('');
    setMessage('');
    onAnnouncementsUpdated();
  };

  const handleEditOpen = (a: Announcement) => {
    setEditingAnn(a);
    setTitle(a.title);
    setMessage(a.message);
    setTargetRole(a.targetRole);
    setPriority(a.priority);
  };

  const handleDeleteTrigger = (id: string, annTitle: string) => {
    setDeletingAnn({ id, title: annTitle });
  };

  const confirmDelete = () => {
    if (deletingAnn) {
      VelocityAPI.deleteAnnouncement(deletingAnn.id);
      onShowToast(`Deleted announcement "${deletingAnn.title}"`);
      setDeletingAnn(null);
      onAnnouncementsUpdated();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111111] border border-gray-800 p-6">
        <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#8C532B]" />
          GLOBAL ANNOUNCEMENTS & PUSH NOTIFICATIONS
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Broadcast, edit, and delete club updates or special event alerts across user dashboards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dispatch Form */}
        <div className="bg-[#111111] border border-gray-800 p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-white border-b border-gray-800 pb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-[#E52165]" />
            {editingAnn ? `EDIT ANNOUNCEMENT` : `DISPATCH NEW ANNOUNCEMENT`}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Notice Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Olympic Deadlift Platform Installed"
                className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 text-sm outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Target Tier</label>
                <Select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as any)}
                  className="w-full bg-gray-900 border border-gray-800 text-white px-2 py-2 text-xs outline-none"
                >
                  <option value="all">All Users</option>
                  <option value="client">Clients Only</option>
                  <option value="coach">Coaches Only</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Priority</label>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-gray-900 border border-gray-800 text-white px-2 py-2 text-xs outline-none"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Message Content *</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the full notification message..."
                className="w-full bg-gray-900 border border-gray-800 text-white p-3 text-xs outline-none resize-none"
                required
              />
            </div>

            <div className="flex gap-2">
              {editingAnn && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAnn(null);
                    setTitle('');
                    setMessage('');
                  }}
                  className="w-1/3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold py-3 uppercase border border-gray-700"
                >
                  CANCEL
                </button>
              )}
              <button
                type="submit"
                className={`w-full ${editingAnn ? 'w-2/3 bg-emerald-600 hover:bg-emerald-500' : 'bg-[#8C532B] hover:bg-[#70401E]'} text-white text-xs font-black tracking-widest py-3 uppercase shadow-md transition-all`}
              >
                {editingAnn ? 'UPDATE ANNOUNCEMENT' : 'DISPATCH ANNOUNCEMENT'}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Announcements List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#111111] border border-gray-800 p-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-white border-b border-gray-800 pb-3">
              ACTIVE BROADCAST HISTORY ({announcements.length})
            </h3>

            <div className="space-y-3 mt-4">
              {announcements.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-gray-800 rounded-xl bg-gray-950/50 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#CCFF00] flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6 text-[#CCFF00]" />
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">No Active Broadcast Notices</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Use the dispatch form on the left to broadcast club updates, workout news, or emergency announcements to your athletes.
                  </p>
                </div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="bg-gray-900 border border-gray-800 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-gray-400">
                      <span className="font-bold text-white text-sm">{a.title}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditOpen(a)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="Edit Announcement"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(a.id, a.title)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-mono ml-1">{new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{a.message}</p>
                    <div className="pt-2 flex items-center justify-between text-[10px] text-gray-500 border-t border-gray-800/80">
                      <span>Target: <strong className="text-gray-300 uppercase">{a.targetRole}</strong></span>
                      <span>Author: <strong className="text-pink-400">{a.authorName}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deletingAnn}
        title="DELETE ANNOUNCEMENT"
        message={`Are you sure you want to delete the broadcast notice "${deletingAnn?.title}"?`}
        type="danger"
        confirmText="DELETE NOTICE"
        cancelText="KEEP NOTICE"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingAnn(null)}
      />
    </div>
  );
};
