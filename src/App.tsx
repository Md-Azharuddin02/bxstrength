import AppRoutes from './routes/AppRoutes';
import { useNavigate, useLocation } from 'react-router-dom';
import { PAGE_PATHS, pathToPage } from './routes';
import { normalizeRole } from './utils/auth';
import React, { useState, useEffect } from 'react';
import { ViewPage, Trainer, UserRole, SelfAssessmentData } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { SelfAssessmentModal } from './components/SelfAssessmentModal';
import { BookingModal } from './components/BookingModal';
import { MembershipModal } from './components/MembershipModal';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import {
  AdminDashboard,
  HeadCoachDashboard,
  CoachDashboard,
  CustomerSupportDashboard,
  ClientDashboard
} from './dashboards';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { OtpVerificationModal } from './components/auth/OtpVerificationModal';
import { SeoHead } from './components/SeoHead';
import { ScrollToTop } from './components/ScrollToTop';
import { FloatingActionWidget } from './components/ui/FloatingActionWidget';
import { ChatbotWidget } from './components/ui/ChatbotWidget';
import { ServiceCustomizationModal } from './components/ServiceCustomizationModal';
import { Preloader } from './components/ui/Preloader';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { CheckCircle2, X, WifiOff, AlertTriangle } from 'lucide-react';

const PORTAL_PAGES: ViewPage[] = ['dashboard'];

function AppContent() {
  const { user, logout } = useAuth();
  const network = useNetworkStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;

  // URL decides page (null = unknown URL / 404)
  const currentPage = pathToPage(pathname);
  const isPortal = currentPage !== null && PORTAL_PAGES.includes(currentPage);

  const setCurrentPage = (page: ViewPage) => navigate(PAGE_PATHS[page]);

function AppContent() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const network = useNetworkStatus();

  // Remember the page across reloads and browser restarts so a refresh doesn't look like a logout.
  const getInitialPage = (): ViewPage => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bx_current_page') as ViewPage;
      if (saved) return saved;
    }
    return 'home';
  };

  const [currentPage, setCurrentPage] = useState<ViewPage>(getInitialPage);

  const navigateToPage = (page: ViewPage) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bx_current_page', page);
    }
  };

  const handleLogout = (toastMsg = 'Signed out of session') => {
    logout();
    navigateToPage('home');
    showToast(toastMsg);
  };
  const [isLoadingSplash, setIsLoadingSplash] = useState<boolean>(true);
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
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
    const isSupportRoute = path.includes('support') || hash.includes('support') || search.includes('support');

    if (isSupportRoute) {
      if (isAuthLoading) return;
      if (!isAuthenticated || !user) {
        // Unauthenticated guest -> Protect route! Redirect to home & open login modal
        setCurrentPage('home');
        setLoginModalOpen(true);
        showToast('Authentication Required: Please sign in to access the Customer Support Workspace.');
        return;
      }

      const roleClean = (user.role || '').toLowerCase();
      const isSupportStaff = ['customer_support', 'support', 'admin', 'headcoach', 'coach'].includes(roleClean);

      if (!isSupportStaff) {
        // Regular client/user -> Redirect to client dashboard
        setCurrentPage('dashboard');
        showToast('Access Restricted: Customer Support Workspace is for authorized staff only.');
        return;
      }

      setCurrentPage('support_dashboard');
      return;
    }

  }, [isAuthenticated, user, isAuthLoading]);

  const navigateAndScroll = (page: ViewPage, elementId?: string) => {
    navigateToPage(page);
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
    const r = normalizeRole(role);
    // /dashboard shows the right dashboard for every role
    navigate('/dashboard');
    if (r === 'customersupport' || r === 'support') {
      showToast('Welcome to BxStrength Customer Support Workspace');
    } else if (['admin', 'headcoach', 'coach'].includes(r)) {
      showToast(`Welcome to BxStrength Admin CRM (${String(role).toUpperCase()} Session)`);
    } else {
    const roleClean = (role || '').toLowerCase();
    if (roleClean === 'customer_support' || roleClean === 'support') {
      navigateToPage('support_dashboard');
      showToast('Welcome to BxStrength Customer Support Workspace');
    } else if (roleClean === 'admin' || roleClean === 'headcoach' || roleClean === 'coach') {
      navigateToPage('admin');
      showToast(`Welcome to BxStrength Admin CRM (${role.toUpperCase()} Session)`);
    } else {
      navigateToPage('dashboard');
      showToast('Welcome to your BxStrength Client Performance Dashboard!');
    }
  };

  const openBookingFresh = () => {
    setSelectedClassForBooking(undefined);
    setSelectedTrainerForBooking(undefined);
    setBookingModalOpen(true);
  };

  const handleOpenBookingWithTrainer = (trainerName: string) => {
    setSelectedTrainerForBooking(trainerName);
    setSelectedClassForBooking(undefined);
    setBookingModalOpen(true);
  };

  const handleSelectTrainer = (trainer: Trainer) => {
    handleOpenBookingWithTrainer(trainer.name);
  };

  const handleSelectPlan = (planName: string) => {
    showToast(`Successfully registered for ${planName}! Welcome to BxStrength.`);
  };

  const handleAssessmentCompleteAndBook = (assessment: SelfAssessmentData) => {
    showToast(`Assessment submitted for ${assessment.name}! Opening consultation booking...`);
    setBookingModalOpen(true);
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
  // If viewing Dashboard or Admin CRM full-screen portal views
  if (currentPage === 'dashboard' && user) {
    const userRoleClean = (user.role || '').toLowerCase();
    if (['customer_support', 'support'].includes(userRoleClean)) {
      return (
        <CustomerSupportDashboard
          user={user}
          onShowToast={showToast}
          onNavigateHome={() => navigateToPage('home')}
          onLogout={() => handleLogout('Signed out of Customer Support Workspace')}
        />
      );
    }
      if (userRoleClean === 'admin') {
        return (
          <AdminDashboard
            user={user}
            onLogout={() => handleLogout('Signed out of Admin session')}
            onNavigateHome={() => navigateToPage('home')}
          />
        );
      }
      if (['headcoach', 'head_coach'].includes(userRoleClean)) {
        return (
          <HeadCoachDashboard
            user={user}
            onLogout={() => handleLogout('Signed out of Head Coach session')}
            onNavigateHome={() => navigateToPage('home')}
          />
        );
      }
      if (userRoleClean === 'coach') {
        return (
          <CoachDashboard
            user={user}
            onLogout={() => handleLogout('Signed out of Coach session')}
            onNavigateHome={() => navigateToPage('home')}
          />
        );
      }
      return (
        <ClientDashboard
          user={user}
          onLogout={() => handleLogout('Signed out of session')}
          onNavigateHome={() => navigateToPage('home')}
          onOpenBooking={() => setBookingModalOpen(true)}
        />
      );
    }

    if (currentPage === 'admin' && user) {
      const userRoleClean = (user.role || '').toLowerCase();
      if (userRoleClean === 'headcoach' || userRoleClean === 'head_coach') {
        return (
          <HeadCoachDashboard
            user={user}
            onLogout={() => handleLogout('Signed out of Head Coach session')}
            onNavigateHome={() => navigateToPage('home')}
          />
        );
      }
      if (userRoleClean === 'coach') {
        return (
          <CoachDashboard
            user={user}
            onLogout={() => handleLogout('Signed out of Coach session')}
            onNavigateHome={() => navigateToPage('home')}
          />
        );
      }
      return (
        <AdminDashboard
          user={user}
          onLogout={() => handleLogout('Signed out of Admin session')}
          onNavigateHome={() => navigateToPage('home')}
        />
      );
    }

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
          onOpenBooking={() => {
            setSelectedClassForBooking(undefined);
            setSelectedTrainerForBooking(undefined);
            setBookingModalOpen(true);
          }}
          onOpenAssessment={() => setAssessmentModalOpen(true)}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenLogin={() => setLoginModalOpen(true)}
          onOpenRegister={() => setRegisterModalOpen(true)}
        />
      )}

      {/* Page Routing Views */}
      <main className="flex-grow">
        <AppRoutes
          ready={!isLoadingSplash}
          onNavigate={(page) => setCurrentPage(page)}
          onOpenBooking={() => setBookingModalOpen(true)}
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
      {/* Global Header Navigation */}
      <Header
        currentPage={currentPage}
        onNavigate={(page) => {
          setSelectedBlogPostId(null);
          navigateToPage(page);
        }}
        onOpenBooking={() => {
          setSelectedClassForBooking(undefined);
          setSelectedTrainerForBooking(undefined);
          setBookingModalOpen(true);
        }}
        onOpenAssessment={() => setAssessmentModalOpen(true)}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenRegister={() => setRegisterModalOpen(true)}
      />

      {/* Page Routing Views */}
      <main className="flex-grow">
        {currentPage === 'home' && (
          <>
            <Hero
              onOpenBooking={() => {
                setSelectedClassForBooking(undefined);
                setSelectedTrainerForBooking(undefined);
                setBookingModalOpen(true);
              }}
              onOpenAssessment={() => setAssessmentModalOpen(true)}
            />

            <AssessmentSection
              onOpenAssessment={() => setAssessmentModalOpen(true)}
            />

            <TrustBar ready={!isLoadingSplash} />

            <BeforeAfterShowcase
              onOpenAssessment={() => setAssessmentModalOpen(true)}
              onOpenConsultation={() => setBookingModalOpen(true)}
            />

            <TransformationJourney
              onOpenAssessment={() => setAssessmentModalOpen(true)}
              onOpenConsultation={() => setBookingModalOpen(true)}
            />

            <ServicesSection
              onOpenBooking={() => {
                setSelectedClassForBooking(undefined);
                setSelectedTrainerForBooking(undefined);
                setBookingModalOpen(true);
              }}
              onSelectService={handleSelectService}
            />

            <TrainersSection
              onSelectTrainer={handleSelectTrainer}
              onNavigate={(page) => setCurrentPage(page)}
              onOpenBookingWithTrainer={handleOpenBookingWithTrainer}
            />

            <TestimonialsSection />

            <FaqSection
              onOpenConsultation={() => setBookingModalOpen(true)}
              onOpenAssessment={() => setAssessmentModalOpen(true)}
            />
          </>
        )}

        {currentPage === 'about' && (
          <AboutView
            onNavigate={(page) => setCurrentPage(page)}
            onOpenBooking={() => setBookingModalOpen(true)}
          />
        )}

        {currentPage === 'schedule' && (
          <ServicesSection
            onOpenBooking={() => setBookingModalOpen(true)}
            onSelectService={(service) => setSelectedServiceForCustomization(service)}
          />
        )}

        {currentPage === 'trainers' && (
          <div className="bg-[#0a0a0a] min-h-screen py-12">
            <TrainersSection
              onSelectTrainer={handleSelectTrainer}
              onNavigate={(page) => setCurrentPage(page)}
              onOpenBookingWithTrainer={handleOpenBookingWithTrainer}
            />
          </div>
        )}

        {currentPage === 'blog' && (
          <BlogView 
            initialSelectedPostId={selectedBlogPostId}
            onClearInitialPost={() => setSelectedBlogPostId(null)}
          />
        )}

        {currentPage === 'contact' && <ContactView />}

        {currentPage === 'terms' && <TermsView />}

        {currentPage === 'privacy' && <PrivacyView />}

        {currentPage === 'onboarding_terms' && <OnboardingTermsView />}

        {currentPage === 'support_dashboard' && (
          isAuthenticated && user && ['customer_support', 'support', 'admin', 'headcoach', 'coach'].includes((user.role || '').toLowerCase()) ? (
            <CustomerSupportDashboard
              user={user}
              onShowToast={showToast}
              onNavigateHome={() => setCurrentPage('home')}
              onLogout={() => {
                logout();
                setCurrentPage('home');
                showToast('Signed out of Customer Support Workspace');
              }}
            />
          ) : (
            <div className="bg-[#0a0a0c] min-h-screen flex items-center justify-center p-6 text-center text-white">
              <div className="bg-[#18181b] border border-zinc-800 p-8 rounded-2xl max-w-md space-y-4 shadow-2xl">
                <Lock className="w-12 h-12 text-[#CCFF00] mx-auto" />
                <h2 className="text-lg font-black uppercase">AUTHENTICATION REQUIRED</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  You must be logged in as an authorized Customer Support Staff member or System Admin to view this workspace.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setCurrentPage('home');
                      setLoginModalOpen(true);
                    }}
                    className="bg-[#CCFF00] text-black text-xs font-black uppercase px-6 py-3 rounded-xl cursor-pointer shadow-lg"
                  >
                    SIGN IN TO SUPPORT ACCOUNT
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* Global Footer */}
      {!isPortal && <Footer onNavigate={(page) => setCurrentPage(page)} />}

      {/* Interactive 5-Step Lead Diagnostic Self Assessment Modal */}
      <SelfAssessmentModal
        isOpen={assessmentModalOpen}
        onClose={() => setAssessmentModalOpen(false)}
        onCompleteAndBookConsultation={handleAssessmentCompleteAndBook}
      />

      {/* Discovery Consultation Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        preSelectedClass={selectedClassForBooking}
        preSelectedTrainer={selectedTrainerForBooking}
      />

      {/* Membership Modal */}
      <MembershipModal
        isOpen={membershipModalOpen}
        onClose={() => setMembershipModalOpen(false)}
        onSelectPlan={handleSelectPlan}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={navigateAndScroll}
        onOpenBookingWithClass={(className) => {
          setSelectedClassForBooking(className);
          setBookingModalOpen(true);
          setSearchModalOpen(false);
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

      {/* Auth Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
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

      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
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

      <OtpVerificationModal
        isOpen={otpModalOpen}
        email={otpEmail}
        onClose={() => setOtpModalOpen(false)}
        onOpenLogin={() => {
          setOtpModalOpen(false);
          setLoginModalOpen(true);
        }}
        onSuccessNavigate={handleAuthSuccessNavigate}
      />

      <ForgotPasswordModal
        isOpen={forgotPassModalOpen}
        onClose={() => setForgotPassModalOpen(false)}
        onOpenLogin={() => {
          setForgotPassModalOpen(false);
          setLoginModalOpen(true);
        }}
      />

      <ServiceCustomizationModal
        isOpen={serviceCustomizationModalOpen}
        onClose={() => setServiceCustomizationModalOpen(false)}
        service={selectedServiceForCustomization}
        onNavigateToDashboard={() => setCurrentPage('dashboard')}
      />

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
            onOpenConsultation={() => setBookingModalOpen(true)}
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