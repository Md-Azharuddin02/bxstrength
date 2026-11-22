import React from 'react';
import { formatScheduledAt } from '../../../utils/schedule';
import { PaidPackageBooking, User } from '../../../types';
import { decodeHtmlEntities, formatMeetingUrl } from '../../../services/core/mappers';
import { PlanCustomizationBreakdown } from '../../../components/bookings/PlanCustomizationBreakdown';
import {
  Clock, UserCheck, CheckCircle2, Phone, Mail, ExternalLink, Video,
  Trash2, AlertCircle, ChevronDown, ChevronUp, MessageCircle
} from 'lucide-react';
import { SessionDeliveryTracker } from './SessionDeliveryTracker';
import { UserMaps } from './types';

interface PaidBookingCardProps {
  booking: PaidPackageBooking;
  user: User;
  userMaps: UserMaps;
  isExpanded: boolean;
  isAdmin: boolean;
  isHeadCoach: boolean;
  isCustomerSupport: boolean;
  onToggleExpand: () => void;
  onTakeMyself: (b: PaidPackageBooking) => void;
  onOpenAssign: (b: PaidPackageBooking) => void;
  onQuickSessionUpdate: (b: PaidPackageBooking, action: 'increment' | 'decrement') => void;
  onDelete: (id: string) => void;
}

export const PaidBookingCard: React.FC<PaidBookingCardProps> = ({
  booking: b,
  user,
  userMaps,
  isExpanded,
  isAdmin,
  isHeadCoach,
  isCustomerSupport,
  onToggleExpand,
  onTakeMyself,
  onOpenAssign,
  onQuickSessionUpdate,
  onDelete
}) => {
  const clientUser = (b.userId ? userMaps.byId.get(b.userId) : null) || userMaps.byEmail.get((b.clientEmail || '').toLowerCase().trim());

  const rawContactMethods: string[] = (
    Array.isArray(b.customizedDetails?.contactMethods) && b.customizedDetails.contactMethods.length > 0
      ? b.customizedDetails.contactMethods
      : clientUser?.contactMethods && clientUser.contactMethods.length > 0
      ? clientUser.contactMethods
      : b.customizedDetails?.preferredContactMethod
      ? (b.customizedDetails.preferredContactMethod === 'all' ? ['whatsapp', 'call', 'email'] : [b.customizedDetails.preferredContactMethod])
      : clientUser?.preferredContactMethod
      ? (clientUser.preferredContactMethod === 'all' ? ['whatsapp', 'call', 'email'] : [clientUser.preferredContactMethod])
      : []
  ).map((m: any) => String(m).toLowerCase().trim()).filter(Boolean);

  const allowsWhatsApp = rawContactMethods.includes('whatsapp') || rawContactMethods.includes('all');
  const allowsCall = rawContactMethods.includes('call') || rawContactMethods.includes('all');
  const allowsEmail = rawContactMethods.includes('email') || rawContactMethods.includes('all');
  const hasModeOfContact = allowsWhatsApp || allowsCall || allowsEmail;

  const effectivePhone = b.clientPhone || clientUser?.whatsappNumber || clientUser?.phone || '';

  return (
    <div
      className="bg-[#111111] border border-gray-800 hover:border-gray-700 transition-all rounded-xl p-5 space-y-4 relative overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30">
              {b.packageType}
            </span>
            <span className="text-[10px] font-mono text-gray-300 bg-zinc-900 border border-zinc-700/80 px-2 py-0.5 rounded">
              <strong className="text-zinc-400">ORDER ID:</strong> {b.id}
            </span>
            {(b.paymentId || b.orderId) && (
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-2 py-0.5 rounded">
                <strong className="text-zinc-500">TRANSACTION ID:</strong> {b.paymentId || b.orderId}
              </span>
            )}
            <span className="text-[10px] font-mono text-zinc-300 bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
              <Clock className="w-3 h-3 text-[#CCFF00]" /> {b.durationMinutes} Min / Session
            </span>
            <span className="text-[10px] text-gray-500">
              • {new Date(b.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h3 className="text-lg font-black uppercase text-white mt-1">
            {decodeHtmlEntities(b.packageName)}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {!isCustomerSupport && (
            <span className="text-sm font-black text-[#CCFF00] font-mono">
              £{b.totalPrice}
            </span>
          )}

          <span
            className={`text-xs font-black uppercase px-2.5 py-1 rounded-full border ${
              b.status === 'Completed'
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : b.status === 'Scheduled'
                ? 'bg-sky-950 text-sky-400 border-sky-800'
                : 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/40'
            }`}
          >
            {b.status}
          </span>
        </div>
      </div>

      {/* Client & Contact bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/40 border border-gray-800/80 p-3 rounded-lg text-xs">
        <div>
          <p className="text-gray-400 font-bold uppercase text-[10px]">Client</p>
          <p className="text-white font-bold text-sm">{b.clientName}</p>
          <p className="text-gray-400 text-[11px]">{b.clientEmail}</p>
          {effectivePhone && <p className="text-zinc-500 text-[11px]">{effectivePhone}</p>}
          {hasModeOfContact && (
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">Contact Mode:</span>
              {allowsWhatsApp && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <MessageCircle className="w-2.5 h-2.5" /> WhatsApp
                </span>
              )}
              {allowsCall && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800 flex items-center gap-1">
                  <Phone className="w-2.5 h-2.5" /> Call
                </span>
              )}
              {allowsEmail && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center gap-1">
                  <Mail className="w-2.5 h-2.5" /> Email
                </span>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="text-gray-400 font-bold uppercase text-[10px]">Assigned Coach</p>
          {b.assignedCoachName ? (
            <div>
              <p className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {b.assignedCoachName}
              </p>
              {b.assignedBy && <p className="text-gray-500 text-[10px]">Assigned by {b.assignedBy}</p>}
            </div>
          ) : (
            <p className="text-amber-400 font-semibold text-xs flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Unassigned
            </p>
          )}
        </div>

        <div>
          <p className="text-gray-400 font-bold uppercase text-[10px]">Scheduled Session</p>
          {formatScheduledAt(b.scheduledAt) ? (
            <p className="text-[#CCFF00] font-bold text-xs mt-0.5 mb-2.5">{formatScheduledAt(b.scheduledAt)}</p>
          ) : (
            <p className="text-gray-500 text-xs mt-0.5 mb-2.5">Not scheduled yet</p>
          )}
          <p className="text-gray-400 font-bold uppercase text-[10px]">Live Meeting Link</p>
          {b.meetingLink ? (
            <a
              href={formatMeetingUrl(b.meetingLink)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#CCFF00] hover:underline font-bold text-xs flex items-center gap-1 mt-0.5"
            >
              <Video className="w-3.5 h-3.5" />
              Join / Test Video Call
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <p className="text-gray-500 text-xs mt-0.5">Not set yet</p>
          )}
        </div>
      </div>

      {/* Session Delivery & Attendance Tracking Desk */}
      <SessionDeliveryTracker
        booking={b}
        isCustomerSupport={isCustomerSupport}
        onQuickSessionUpdate={onQuickSessionUpdate}
      />

      {/* Selected Focuses preview */}
      {b.sessionFocusList && b.sessionFocusList.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[10px] font-bold uppercase text-gray-400">Focuses:</span>
          {b.sessionFocusList.map((f, idx) => (
            <span key={idx} className="bg-zinc-800/90 text-zinc-300 border border-zinc-700/80 px-2 py-0.5 rounded text-[11px]">
              {decodeHtmlEntities(f)}
            </span>
          ))}
        </div>
      )}

      {/* Expandable Customization Breakdown */}
      {isExpanded && (
        <div className="mt-3">
          <PlanCustomizationBreakdown
            customizedDetails={b.customizedDetails}
            packageName={b.packageName}
            packageType={b.packageType}
            durationMinutes={b.durationMinutes}
            totalSessions={b.totalSessions}
            totalPrice={b.totalPrice}
            sessionFocusList={b.sessionFocusList}
          />
        </div>
      )}

      {/* Actions Desk: Assign Coach, Direct Contact, View Details, Delete */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          {!b.assignedCoachId ? (
            <>
              {!isCustomerSupport && (
                <button
                  type="button"
                  onClick={() => onTakeMyself(b)}
                  className="px-3 py-1.5 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(204,255,0,0.2)]"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Take Myself
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenAssign(b)}
                className="px-3 py-1.5 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(204,255,0,0.2)] border border-[#CCFF00]"
              >
                <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                Assign Coach & Link
              </button>
            </>
          ) : (!isCustomerSupport && b.assignedCoachId === user.id) ? (
            <>
              <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Assigned to You
              </span>

              <button
                type="button"
                onClick={() => onOpenAssign(b)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer border border-zinc-700"
              >
                <Video className="w-3.5 h-3.5 text-[#CCFF00]" />
                Edit Link & Notes
              </button>
            </>
          ) : (
            <>
              {!isCustomerSupport && (
                <button
                  type="button"
                  onClick={() => onTakeMyself(b)}
                  className="px-2.5 py-1.5 bg-[#CCFF00]/20 hover:bg-[#CCFF00]/30 text-[#CCFF00] font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer border border-[#CCFF00]/40"
                  title="Reassign to yourself"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Take Over (Me)
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenAssign(b)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer border border-zinc-700"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Reassign / Edit Link
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onToggleExpand}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
              isExpanded
                ? 'bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/40'
                : 'bg-black/60 hover:bg-zinc-800 text-gray-300 border border-gray-800'
            }`}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {isExpanded ? 'Hide Details' : 'View Full Details'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Contact Buttons - ONLY shown if athlete selected that mode of contact during booking */}
          {hasModeOfContact && (
            <>
              {allowsWhatsApp && effectivePhone && (
                <a
                  href={`https://wa.me/${effectivePhone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 text-xs font-bold rounded flex items-center gap-1"
                  title="Chat on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}

              {allowsCall && effectivePhone && (
                <a
                  href={`tel:${effectivePhone}`}
                  className="px-2.5 py-1.5 bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800 text-xs font-bold rounded flex items-center gap-1"
                  title="Call Athlete"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              )}

              {allowsEmail && b.clientEmail && (
                <a
                  href={`mailto:${b.clientEmail}?subject=BxStrength%20Training%20Session%20(${b.id})`}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold rounded flex items-center gap-1"
                  title="Email Athlete"
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
              )}
            </>
          )}

          {/* Delete for Admin / Head Coach */}
          {(isAdmin || isHeadCoach) && (
            <button
              type="button"
              onClick={() => onDelete(b.id)}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
              title="Delete booking"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
