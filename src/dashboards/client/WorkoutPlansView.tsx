import React, { useState, useEffect } from 'react';
import { User, BookingWorkoutPlan, PaidPackageBooking } from '../../types';
import { VelocityAPI } from '../../services/api';
import { Dumbbell, Calendar, UserCheck, Clock, Award, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface WorkoutPlansViewProps {
  programs?: any[];
  user?: User;
  onShowToast: (msg: string) => void;
}

export const WorkoutPlansView: React.FC<WorkoutPlansViewProps> = ({ user: propUser, onShowToast }) => {
  const currentUser = propUser || VelocityAPI.getCurrentUser();
  const [plans, setPlans] = useState<BookingWorkoutPlan[]>([]);
  const [bookings, setBookings] = useState<PaidPackageBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      if (!currentUser?.email) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [fetchedPlans, fetchedBookings] = await Promise.all([
          VelocityAPI.fetchBookingWorkoutPlans({ clientEmail: currentUser.email }),
          VelocityAPI.fetchPaidBookings({ email: currentUser.email })
        ]);
        setPlans(fetchedPlans);
        setBookings(fetchedBookings);
        // Expand the most recent active plan by default
        if (fetchedPlans.length > 0) {
          setExpandedPlanId(fetchedPlans[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load client workout programs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlans();
  }, [currentUser?.email]);

  const getStatusBadge = (plan: BookingWorkoutPlan) => {
    const today = new Date().toISOString().split('T')[0];
    if (plan.validFrom <= today && plan.validTo >= today) {
      return (
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ACTIVE THIS WEEK
        </span>
      );
    } else if (plan.validFrom > today) {
      return (
        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
          UPCOMING
        </span>
      );
    } else {
      return (
        <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
          PAST PROGRAM
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111111] border border-zinc-800 p-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-amber-400" />
            WORKOUT PROGRAMS
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Personalized training routines and exercise protocols assigned by your BxStrength coach.
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-[#111111] border border-zinc-800 p-12 text-center text-zinc-500 rounded-xl">
          Loading your workout programs...
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-[#111111] border border-zinc-800 p-12 text-center space-y-3 rounded-xl">
          <Dumbbell className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-black uppercase text-white tracking-wider">NO WORKOUT PROGRAM ASSIGNED YET</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            Your personal BxStrength coach is customizing your workout protocol. As soon as your weekly program is published, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const relatedBooking = bookings.find(b => b.id === plan.bookingId);
            const isExpanded = expandedPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className="bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden transition-all hover:border-zinc-700 shadow-lg"
              >
                {/* Plan Header Card */}
                <div 
                  onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/60 cursor-pointer hover:bg-zinc-900/40 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-white uppercase tracking-wide">
                        {plan.title}
                      </h3>
                      {getStatusBadge(plan)}
                      {relatedBooking && (
                        <span className="text-[10px] font-bold bg-zinc-800 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded uppercase">
                          {relatedBooking.packageName}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5 text-zinc-300">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        Valid: <strong className="text-white">{plan.validFrom}</strong> to <strong className="text-white">{plan.validTo}</strong>
                      </span>
                      <span className="flex items-center gap-1 text-amber-300 font-medium">
                        <UserCheck className="w-3.5 h-3.5" />
                        Coach: {plan.coachName || 'BxStrength Coaching Staff'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Full Routine'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Plan Body Formatted Content */}
                {isExpanded && (
                  <div className="p-6 bg-[#0c0c0d] border-t border-zinc-800/80 space-y-4">
                    <div 
                      className="prose prose-invert prose-sm max-w-none [&_h3]:text-amber-400 [&_h3]:font-black [&_h3]:text-base [&_h3]:mb-3 [&_h4]:text-white [&_h4]:font-bold [&_h4]:text-sm [&_h4]:mt-5 [&_h4]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_li]:text-zinc-300 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: plan.content }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
