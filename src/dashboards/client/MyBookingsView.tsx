import React from 'react';
import { Booking, Enquiry, ClassSchedule } from '../../types';
import { VelocityAPI } from '../../services/api';
import { Calendar, CheckCircle2, XCircle, Clock, MapPin, Tag, FileText, Send, Activity, MessageSquare, ShieldCheck } from 'lucide-react';

interface MyBookingsViewProps {
  bookings: Booking[];
  enquiries?: Enquiry[];
  classSchedules?: ClassSchedule[];
  onBookingsUpdated: () => void;
  onShowToast: (msg: string) => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  bookings,
  enquiries = [],
  classSchedules = [],
  onBookingsUpdated,
  onShowToast
}) => {
  const handleCancel = (id: string, code: string) => {
    try {
      VelocityAPI.cancelBooking(id);
      onShowToast(`Booking ${code} successfully cancelled.`);
      onBookingsUpdated();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to cancel booking');
    }
  };

  // Filter out any free consultation enquiries so this view remains strictly for paid sessions & assessments
  const assessmentEnquiries = enquiries.filter(e => 
    !e.subject?.toLowerCase().includes('consultation') && 
    !e.message?.toLowerCase().includes('[free consultation booked]')
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-[#111111] border border-gray-800 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#E52165]" />
            MY BOOKED SESSIONS & SUBMITTED ASSESSMENTS
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            View all confirmed class reservations, assigned class schedules, paid packages, and self-assessments.
          </p>
        </div>
      </div>

      {/* SECTION: APPROVED CLASS SCHEDULES & TIMETABLE */}
      {classSchedules.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 border-b border-gray-800 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            LIVE & APPROVED CLASS SCHEDULES ({classSchedules.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classSchedules.map((cls) => (
              <div
                key={cls.id}
                className="bg-[#111111] border border-emerald-900/60 p-6 flex flex-col justify-between transition-all hover:border-emerald-500/60 rounded"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 border border-amber-800 uppercase">
                      {cls.category}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-500 text-black rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Live & Approved
                    </span>
                  </div>

                  <h3 className="text-lg font-black uppercase text-white mb-1">{cls.title}</h3>
                  <p className="text-xs text-gray-300 flex items-center gap-1.5 mb-2 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-[#E52165]" />
                    <span>{cls.dayOfWeek} {cls.startTime} - {cls.endTime}</span>
                  </p>
                  
                  <div className="space-y-1.5 text-xs text-gray-400 border-t border-gray-800/80 pt-2.5 mt-2">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-500" />
                      <span>Assigned Coach / Trainer: <strong className="text-amber-300">{cls.trainerName}</strong></span>
                    </p>
                    {cls.instructions && (
                      <p className="text-[11px] text-zinc-300 bg-zinc-950 p-2 border border-zinc-800 rounded mt-1">
                        <strong className="text-amber-400 block text-[10px] uppercase">Instructions:</strong>
                        {cls.instructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 1: CONFIRMED CLASS SESSIONS */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 border-b border-gray-800 pb-2">
          <Clock className="w-4 h-4 text-[#E52165]" />
          CONFIRMED CLASS SESSIONS ({bookings.length})
        </h3>

        {bookings.length === 0 ? (
          <div className="bg-[#111111] border border-gray-800 p-8 text-center text-xs text-gray-400">
            <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p>No class bookings found under your account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className={`bg-[#111111] border p-6 flex flex-col justify-between transition-all ${
                  b.status === 'Confirmed'
                    ? 'border-gray-800 hover:border-[#E52165]/60'
                    : 'border-red-950/60 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 border border-emerald-800">
                      CODE: {b.bookingCode}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 ${
                        b.status === 'Confirmed'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-black uppercase text-white mb-1">{b.className}</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#E52165]" />
                    <span>Date: {b.date} • Time: {b.timeSlot}</span>
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span>Trainer: <strong className="text-gray-200">{b.trainerName}</strong></span>
                  </p>
                </div>

                {b.status === 'Confirmed' && (
                  <div className="mt-4 pt-4 border-t border-gray-800 flex justify-end">
                    <button
                      onClick={() => handleCancel(b.id, b.bookingCode)}
                      className="text-xs font-bold text-red-400 hover:text-red-300 uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" /> Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: CLIENT SUBMITTED ASSESSMENTS & FORM RECORDS */}
      <div className="space-y-4 pt-4 border-t border-gray-800">
        <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 border-b border-gray-800 pb-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          MY SUBMITTED ASSESSMENTS & FORM RECORDS ({assessmentEnquiries.length})
        </h3>

        {assessmentEnquiries.length === 0 ? (
          <div className="bg-[#111111] border border-gray-800 p-8 text-center text-xs text-gray-400">
            <Send className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p>No submitted assessments or form records found under your email.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assessmentEnquiries.map((enq) => (
              <div key={enq.id} className="bg-[#111111] border border-gray-800 p-5 rounded-none space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 border border-emerald-800/60">
                      REF: {enq.id}
                    </span>
                    <span className="text-xs font-black uppercase text-white tracking-wider">
                      {enq.subject}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(enq.createdAt).toLocaleDateString()} {new Date(enq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                      enq.status === 'resolved'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : enq.status === 'in_progress'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}>
                      {enq.status ? enq.status.replace('_', ' ') : 'SUBMITTED TO COACH'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900/90 p-4 border border-gray-800 text-xs text-gray-300 font-sans whitespace-pre-line leading-relaxed">
                  {enq.message}
                </div>

                <div className="text-[10px] text-gray-500 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Received by BxStrength Coaching Team</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
