import AppRoutes from './routes/AppRoutes';
import { useNavigate, useLocation } from 'react-router-dom';
import { PAGE_PATHS, pathToPage } from './routes';
import { normalizeRole } from './utils/auth';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ViewPage, Trainer, UserRole, SelfAssessmentData } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SeoHead } from './components/SeoHead';
import { ScrollToTop } from './components/ScrollToTop';
import { FloatingActionWidget } from './components/ui/FloatingActionWidget';
import { ChatbotWidget } from './components/ui/ChatbotWidget';
import { Preloader } from './components/ui/Preloader';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { CheckCircle2, X, WifiOff, AlertTriangle } from 'lucide-react';

// Dashboards load on demand so public visitors don't download staff code
const AdminDashboard = lazy(() => import('./dashboards/admin').then(m => ({ default: m.AdminDashboard })));
const HeadCoachDashboard = lazy(() => import('./dashboards/head-coach').then(m => ({ default: m.HeadCoachDashboard })));
const CoachDashboard = lazy(() => import('./dashboards/coach').then(m => ({ default: m.CoachDashboard })));
const CustomerSupportDashboard = lazy(() => import('./dashboards/customer-support').then(m => ({ default: m.CustomerSupportDashboard })));
const ClientDashboard = lazy(() => import('./dashboards/client').then(m => ({ default: m.ClientDashboard })));

// Modals load the first time they open, then stay mounted so their state behaves as before
const SelfAssessmentModal = lazy(() => import('./components/SelfAssessmentModal').then(m => ({ default: m.SelfAssessmentModal })));
const BookingModal = lazy(() => import('./components/BookingModal').then(m => ({ default: m.BookingModal })));
const MembershipModal = lazy(() => import('./components/MembershipModal').then(m => ({ default: m.MembershipModal })));
const SearchModal = lazy(() => import('./components/SearchModal').then(m => ({ default: m.SearchModal })));
const LoginModal = lazy(() => import('./components/auth/LoginModal').then(m => ({ default: m.LoginModal })));
const RegisterModal = lazy(() => import('./components/auth/RegisterModal').then(m => ({ default: m.RegisterModal })));
const ForgotPasswordModal = lazy(() => import('./components/auth/ForgotPasswordModal').then(m => ({ default: m.ForgotPasswordModal })));
const OtpVerificationModal = lazy(() => import('./components/auth/OtpVerificationModal').then(m => ({ default: m.OtpVerificationModal })));
const ServiceCustomizationModal = lazy(() => import('./components/ServiceCustomizationModal').then(m => ({ default: m.ServiceCustomizationModal })));

function KeepAfterOpen({ open, children }: { open: boolean; children: React.ReactNode }) {
  const [hasOpened, setHasOpened] = useState(open);
  if (open && !hasOpened) setHasOpened(true);
  // Own boundary per modal, so loading one never hides another that is already open
  return hasOpened ? <Suspense fallback={null}>{children}</Suspense> : null;
}

const PORTAL_PAGES: ViewPage[] = ['dashboard'];

function AppContent() {
  const { user, logout, isAuthenticated } = useAuth();
  const network = useNetworkStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;

  // URL decides page (null = unknown URL / 404)
  const currentPage = pathToPage(pathname);
  const isPortal = currentPage !== null && PORTAL_PAGES.includes(currentPage);

  const setCurrentPage = (page: ViewPage) => navigate(PAGE_PATHS[page]);
  const [isLoadingSplash, setIsLoadingSplash] = useState<boolean>(true);
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [pendingBooking, setPendingBooking] = useState<null | (() => void)>(null);
  const [assessmentModalOpen, setAssessmentModalOpen] = useState<boolean>(false);
  const [membershipModalOpen, setMembershipModalOpen] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [registerModalOpen, setRegisterModalOpen] = useState<boolean>(false);
  const [forgotPassModalOpen, setForgotPassModalOpen] = useState<boolean>(false);
  const [otpModalOpen, setOtpModalOpen] = useState<boolean>(false);
  const [otpEmail, setOtpEmail] = useState<string>('');
  const [selectedClassForBooking, setSelectedClassForBooking] = useState<string | undefined>(undefined);
  const [selectedTrainerForBooking, setSelectedTrainerForBooking] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [serviceCustomizationModalOpen, setServiceCustomizationModalOpen] = useState<boolean>(false);
  const [serviceModalSuspended, setServiceModalSuspended] = useState<boolean>(false);
  const [selectedServiceForCustomization, setSelectedServiceForCustomization] = useState<any>(null);
  
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSelectService = (srv: any) => {
    setSelectedServiceForCustomization(srv);
    setServiceCustomizationModalOpen(true);
  };

  // Open the reset-password modal when the URL asks for it
  useEffect(() => {
    if (
      pathname.includes('reset-password') ||
      location.search.includes('reset-password') ||
      location.hash.includes('reset-password')
    ) {
      setForgotPassModalOpen(true);
    }
  }, [pathname, location.search, location.hash]);

  // Messages sent by route guards (ProtectedRoute) through navigation state
  useEffect(() => {
    const s = location.state as { openLogin?: boolean; denied?: string } | null;
    if (!s) return;
    if (s.openLogin) {
      setLoginModalOpen(true);
      showToast('Please sign in to continue.');
    }
    if (s.denied) {
      showToast('Access restricted: you do not have permission for that page.');
    }
    navigate(location.pathname + location.search, { replace: true, state: null });
  }, [location.state]);

  const navigateAndScroll = (page: ViewPage, elementId?: string) => {
    setCurrentPage(page);
    setSearchModalOpen(false);
    if (elementId) {
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAuthSuccessNavigate = (role: UserRole) => {
    if (serviceCustomizationModalOpen) {
      setServiceModalSuspended(false);
      showToast('You are signed in. Continue with your service checkout.');
      return;
    }
    if (pendingBooking) {
      const run = pendingBooking;
      setPendingBooking(null);
      run();
      return;
    }
    const r = normalizeRole(role);
    // /dashboard shows the right dashboard for every role
    navigate('/dashboard');
    if (r === 'customersupport' || r === 'support') {
      showToast('Welcome to BxStrength Customer Support Workspace');
    } else if (['admin', 'headcoach', 'coach'].includes(r)) {
      showToast(`Welcome to BxStrength Admin CRM (${String(role).toUpperCase()} Session)`);
    } else {
      showToast('Welcome to your BxStrength Client Performance Dashboard!');
    }
  };

  // Consultation booking requires an account: prompt login/register first, then run the booking.
  const openBookingGuarded = (opener: () => void) => {
    if (isAuthenticated) {
      opener();
    } else {
      setPendingBooking(() => opener);
      setLoginModalOpen(true);
    }
  };

  const openBookingFresh = () => openBookingGuarded(() => {
    setSelectedClassForBooking(undefined);
    setSelectedTrainerForBooking(undefined);
    setBookingModalOpen(true);
  });

  const handleOpenBookingWithTrainer = (trainerName: string) => openBookingGuarded(() => {
    setSelectedTrainerForBooking(trainerName);
    setSelectedClassForBooking(undefined);
    setBookingModalOpen(true);
  });

  // Catch-all gate: whatever opens the consultation while logged out is rerouted to
  // login (any preselected class/trainer is kept), then the booking reopens after sign in.
  useEffect(() => {
    if (bookingModalOpen && !isAuthenticated) {
      setBookingModalOpen(false);
      setPendingBooking(() => () => setBookingModalOpen(true));
      setLoginModalOpen(true);
    }
  }, [bookingModalOpen, isAuthenticated]);

  const handleSelectTrainer = (trainer: Trainer) => {
    handleOpenBookingWithTrainer(trainer.name);
  };

  const handleSelectPlan = (planName: string) => {
    showToast(`Successfully registered for ${planName}! Welcome to BxStrength.`);
  };

  const handleAssessmentCompleteAndBook = (assessment: SelfAssessmentData) => {
    showToast(`Assessment submitted for ${assessment.name}! Opening your free 15-min demo...`);
    // Same gate as the other Book buttons: sign in first, then the booking opens
    // prefilled from the authenticated account.
    openBookingFresh();
  };

  // The portal (dashboard) for the logged-in user, chosen by role.
  // Route guards in AppRoutes decide who may reach it.
  const signOut = (label: string) => () => {
    navigate("/", { replace: true });
    logout();
    showToast(`Signed Out of ${label}`);
  };

  const common = {
    user: user!,
    onNavigateHome: () => navigate("/"),
  };
  
  //Client Portal
  const clientPortal = user ? (
    <ClientDashboard
      {...common}
      onLogout={signOut("session")}
      onOpenBooking={() => setBookingModalOpen(true)}
    />
  ) : null;

  //Coach Portal
  const coachPortal = user ? (
    <CoachDashboard
      {...common}
      onLogout={signOut("Coach session")}
    />
  ) : null;

  //Head Coach Portal
  const headCoachPortal = user ? (
    <HeadCoachDashboard
      {...common}
      onLogout={signOut("Head Coach session")}
    />
  ) : null;

  //Admin Portal
  const adminPortal = user ? (
    <AdminDashboard
      {...common}
      onLogout={signOut("Admin session")}
    />
  ) : null;

  //Support Portal
  const supportPortal = user ? (
    <CustomerSupportDashboard
      {...common}
      onShowToast={showToast}
      onLogout={signOut("Customer Support Workspace")}
    />
  ) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col selection:bg-white selection:text-black">
      <ScrollToTop />
      {/* Dynamic SEO Meta Head Manager */}
      <SeoHead currentPage={currentPage} />

    
      {/* 3-5 Sec Animated Preloader Splash Screen */}
      {isLoadingSplash && <Preloader onComplete={() => setIsLoadingSplash(false)} />}

      {/* Network Status Banner */}
      {!network.isOnline ? (
        <div className="bg-red-950/90 border-b border-red-800 text-red-300 text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 z-40">
          <WifiOff className="w-4 h-4 text-red-400" />
          <span>NETWORK CONNECTION OFFLINE: OPERATING IN CACHED LOCAL MODE</span>
        </div>
      ) : network.isSlowConnection ? (
        <div className="bg-amber-950/90 border-b border-amber-800 text-amber-300 text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 z-40">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>SLOW INTERNET DETECTED: ACTIVATING SKELETON PLACEHOLDERS FOR SMOOTH NAVIGATION</span>
        </div>
      ) : null}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18181b] text-white border-l-4 border-white px-5 py-4 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 rounded-lg border border-zinc-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-xs font-bold uppercase tracking-wide">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Header Navigation (hidden on full-screen dashboards) */}
      {!isPortal && (
        <Header
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          onOpenBooking={openBookingFresh}
          onOpenAssessment={() => setAssessmentModalOpen(true)}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenLogin={() => setLoginModalOpen(true)}
          onOpenRegister={() => setRegisterModalOpen(true)}
        />
      )}

      {/* Page Routing Views */}
      <main className="flex-grow">
        <Suspense
          fallback={
            <div role="status" className="min-h-[60vh] flex items-center justify-center text-xs font-bold uppercase tracking-wider text-zinc-400">
              Loading…
            </div>
          }
        >
        <AppRoutes
          ready={!isLoadingSplash}
          onNavigate={(page) => setCurrentPage(page)}
          onOpenBooking={openBookingFresh}
          onOpenBookingFresh={openBookingFresh}
          onOpenAssessment={() => setAssessmentModalOpen(true)}
          onSelectService={handleSelectService}
          onOpenBookingWithTrainer={handleOpenBookingWithTrainer}
          onSelectTrainer={handleSelectTrainer}
          clientPortal={clientPortal}
          coachPortal={coachPortal}
          headCoachPortal={headCoachPortal}
          adminPortal={adminPortal}
          supportPortal={supportPortal}
        />
        </Suspense>
      </main>

      {/* Global Footer */}
      {!isPortal && <Footer onNavigate={(page) => setCurrentPage(page)} />}

      {/* Interactive 5-Step Lead Diagnostic Self Assessment Modal */}
      <KeepAfterOpen open={assessmentModalOpen}>
        <SelfAssessmentModal
          isOpen={assessmentModalOpen}
          onClose={() => setAssessmentModalOpen(false)}
          onCompleteAndBookConsultation={handleAssessmentCompleteAndBook}
        />
      </KeepAfterOpen>

      {/* Discovery Consultation Booking Modal */}
      <KeepAfterOpen open={bookingModalOpen && isAuthenticated}>
        <BookingModal
          isOpen={bookingModalOpen && isAuthenticated}
          onClose={() => setBookingModalOpen(false)}
          onNavigateToDashboard={() => { setBookingModalOpen(false); navigate('/dashboard'); }}
          preSelectedClass={selectedClassForBooking}
          preSelectedTrainer={selectedTrainerForBooking}
        />
      </KeepAfterOpen>

      {/* Membership Modal */}
      <KeepAfterOpen open={membershipModalOpen}>
        <MembershipModal
          isOpen={membershipModalOpen}
          onClose={() => setMembershipModalOpen(false)}
          onSelectPlan={handleSelectPlan}
        />
      </KeepAfterOpen>

      {/* Search Modal */}
      <KeepAfterOpen open={searchModalOpen}>
        <SearchModal
          isOpen={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          onNavigate={navigateAndScroll}
          onOpenBookingWithClass={(className) => {
            setSearchModalOpen(false);
            openBookingGuarded(() => {
              setSelectedClassForBooking(className);
              setBookingModalOpen(true);
            });
          }}
          onOpenBookingWithTrainer={(trainerName) => {
            handleOpenBookingWithTrainer(trainerName);
            setSearchModalOpen(false);
          }}
          onSelectPlan={(planName) => {
            handleSelectPlan(planName);
            setSearchModalOpen(false);
          }}
          onSelectBlogPost={(postId) => {
            setSearchModalOpen(false);
            navigate(`/blog/${postId}`);
          }}
        />
      </KeepAfterOpen>

      {/* Auth Modals */}
      <KeepAfterOpen open={loginModalOpen}>
        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => {
            setLoginModalOpen(false);
            setServiceModalSuspended(false);
          }}
          onOpenRegister={() => {
            setLoginModalOpen(false);
            setRegisterModalOpen(true);
          }}
          onOpenForgotPassword={() => {
            setLoginModalOpen(false);
            setForgotPassModalOpen(true);
          }}
          onRequireOtp={(emailToVerify) => {
            setLoginModalOpen(false);
            setOtpEmail(emailToVerify);
            setOtpModalOpen(true);
          }}
          onSuccessNavigate={handleAuthSuccessNavigate}
        />
      </KeepAfterOpen>

      <KeepAfterOpen open={registerModalOpen}>
        <RegisterModal
          isOpen={registerModalOpen}
          onClose={() => {
            setRegisterModalOpen(false);
            setServiceModalSuspended(false);
          }}
          onOpenLogin={() => {
            setRegisterModalOpen(false);
            setLoginModalOpen(true);
          }}
          onRequireOtp={(emailToVerify) => {
            setRegisterModalOpen(false);
            setOtpEmail(emailToVerify);
            setOtpModalOpen(true);
          }}
          onSuccessNavigate={handleAuthSuccessNavigate}
        />
      </KeepAfterOpen>

      <KeepAfterOpen open={otpModalOpen}>
        <OtpVerificationModal
          isOpen={otpModalOpen}
          email={otpEmail}
          onClose={() => {
            setOtpModalOpen(false);
            setServiceModalSuspended(false);
          }}
          onOpenLogin={() => {
            setOtpModalOpen(false);
            setLoginModalOpen(true);
          }}
          onSuccessNavigate={handleAuthSuccessNavigate}
        />
      </KeepAfterOpen>

      <KeepAfterOpen open={forgotPassModalOpen}>
        <ForgotPasswordModal
          isOpen={forgotPassModalOpen}
          onClose={() => {
            setForgotPassModalOpen(false);
            setServiceModalSuspended(false);
          }}
          onOpenLogin={() => {
            setForgotPassModalOpen(false);
            setLoginModalOpen(true);
          }}
        />
      </KeepAfterOpen>

      <KeepAfterOpen open={serviceCustomizationModalOpen}>
        <ServiceCustomizationModal
          isOpen={serviceCustomizationModalOpen}
          suspended={serviceModalSuspended}
          onClose={() => {
            setServiceCustomizationModalOpen(false);
            setServiceModalSuspended(false);
          }}
          service={selectedServiceForCustomization}
          onNavigateToDashboard={() => setCurrentPage('dashboard')}
          onRequireLogin={() => {
            setServiceModalSuspended(true);
            setRegisterModalOpen(false);
            setLoginModalOpen(true);
          }}
        />
      </KeepAfterOpen>

      {/* Floating Action Suite: AI Chatbot, WhatsApp, Email, Go-To-Top */}
      {!isPortal && (
        <>
          <FloatingActionWidget
            isChatbotOpen={isChatbotOpen}
            onToggleChatbot={() => setIsChatbotOpen(!isChatbotOpen)}
          />
          <ChatbotWidget
            isOpen={isChatbotOpen}
            onClose={() => setIsChatbotOpen(false)}
            hideFloatingButton={true}
            onOpenConsultation={openBookingFresh}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
