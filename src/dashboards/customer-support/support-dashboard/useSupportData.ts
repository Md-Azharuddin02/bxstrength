import { useState, useEffect } from 'react';
import { User, PaidPackageBooking, ConsultationBooking, AthleteAssessment, Enquiry } from '../../../types';
import { VelocityAPI } from '../../../services/api';
import { normalizeRole } from '../../../utils/auth';

// Live Coaches & Paid Bookings state for Customer Support Oversight
export const useSupportData = () => {
  const [coaches, setCoaches] = useState<User[]>([]);
  const [consultations, setConsultations] = useState<ConsultationBooking[]>([]);
  const [assessments, setAssessments] = useState<AthleteAssessment[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [paidBookings, setPaidBookings] = useState<PaidPackageBooking[]>(() => {
    try {
      const raw = localStorage.getItem('bxstrength_paid_bookings');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const loadData = async () => {
    try {
      const [uList, bookings, cons, assess, enqs] = await Promise.all([
        VelocityAPI.fetchUsers(),
        VelocityAPI.fetchPaidBookings(),
        VelocityAPI.fetchConsultations(),
        VelocityAPI.fetchAssessments(),
        VelocityAPI.fetchEnquiries(),
      ]);
      setCoaches(uList.filter(u => {
        const r = normalizeRole(u.role);
        return r === 'coach' || r === 'headcoach';
      }));
      setPaidBookings(bookings);
      setConsultations(Array.isArray(cons) ? cons : []);
      setAssessments(Array.isArray(assess) ? assess : []);
      setEnquiries(Array.isArray(enqs) ? enqs : []);
      setLoadError(false);
      try { localStorage.setItem('bxstrength_paid_bookings', JSON.stringify(bookings)); } catch {}
    } catch (e) {
      console.warn('Failed to load support dashboard data:', e);
      setLoadError(true);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('bxstrength_paid_bookings_updated', loadData);
    return () => window.removeEventListener('bxstrength_paid_bookings_updated', loadData);
  }, []);

  return { coaches, consultations, assessments, enquiries, loadError, paidBookings, loadData };
};
