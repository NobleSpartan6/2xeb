import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { debug } from './lib/debug';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import FooterHUD from './components/FooterHUD';
import Home from './pages/Home';
import Work from './pages/Work';
import ProjectDetail from './pages/ProjectDetail';
import MLLab from './pages/MLLab';
import Video from './pages/Video';
import About from './pages/About';
import Contact from './pages/Contact';
import { ConsoleProvider, useConsole } from './context/ConsoleContext';
import { AuthProvider } from './context/AuthContext';

// Admin imports
import AdminLogin from './pages/admin/AdminLogin';
import AuthCallback from './pages/admin/AuthCallback';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/admin/ProtectedRoute';
import ResetPassword from './pages/admin/ResetPassword';

// Lazy load admin editors for better performance
const ProjectsEditor = React.lazy(() => import('./pages/admin/ProjectsEditor'));
const ExperienceEditor = React.lazy(() => import('./pages/admin/ExperienceEditor'));
const CaseStudiesEditor = React.lazy(() => import('./pages/admin/CaseStudiesEditor'));
const PagesEditor = React.lazy(() => import('./pages/admin/PagesEditor'));
const AuditLogViewer = React.lazy(() => import('./pages/admin/AuditLogViewer'));
const PublishContent = React.lazy(() => import('./pages/admin/PublishContent'));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Close chat drawer on route change to avoid misalignment when navigating
const CloseAgentOnRouteChange = () => {
  const { pathname } = useLocation();
  const { setIsAgentOpen } = useConsole();

  useEffect(() => {
    setIsAgentOpen(false);
  }, [pathname, setIsAgentOpen]);

  return null;
};

// Admin loading fallback
const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-pulse">
      <div className="w-8 h-8 bg-[#0A0A0A] border border-[#262626] grid place-items-center">
        <span className="text-[#2563EB] font-bold text-sm font-space-grotesk">EB</span>
      </div>
    </div>
  </div>
);

// Check if current path is admin
const useIsAdminRoute = () => {
  const { pathname } = useLocation();
  return pathname.startsWith('/admin');
};

// Wrapper to conditionally render NavBar/FooterHUD
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAdmin = useIsAdminRoute();

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#2563EB] selection:text-white overflow-x-hidden pb-12">
      <NavBar />
      <CloseAgentOnRouteChange />
      {children}
      <FooterHUD />
    </div>
  );
};

const App: React.FC = () => {
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Listen for PASSWORD_RECOVERY event from Supabase (implicit flow)
  useEffect(() => {
    // Check if URL hash contains recovery tokens (implicit flow)
    const hash = window.location.hash;
    const isRecoveryUrl = hash.includes('type=recovery') && hash.includes('access_token=');

    if (isRecoveryUrl) {
      debug.log('[App] Recovery tokens detected in URL hash');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      debug.log('[App] Auth event:', event, 'hasSession:', !!session);

      if (event === 'PASSWORD_RECOVERY') {
        debug.log('[App] Password recovery detected, showing reset form');
        setShowPasswordReset(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show password reset form if recovery mode is active
  if (showPasswordReset) {
    return (
      <AuthProvider>
        <ResetPassword />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <ConsoleProvider>
        <Router>
          <ScrollToTop />
          <PublicLayout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/work" element={<Work />} />
              <Route path="/work/:slug" element={<ProjectDetail />} />
              <Route path="/ml-lab" element={<MLLab />} />
              <Route path="/video" element={<Video />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/auth/callback" element={<AuthCallback />} />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route
                  path="projects"
                  element={
                    <React.Suspense fallback={<AdminLoadingFallback />}>
                      <ProjectsEditor />
                    </React.Suspense>
                  }
                />
                <Route
                  path="experience"
                  element={
                    <React.Suspense fallback={<AdminLoadingFallback />}>
                      <ExperienceEditor />
                    </React.Suspense>
                  }
                />
                <Route
                  path="case-studies"
                  element={
                    <React.Suspense fallback={<AdminLoadingFallback />}>
                      <CaseStudiesEditor />
                    </React.Suspense>
                  }
                />
                <Route
                  path="pages"
                  element={
                    <React.Suspense fallback={<AdminLoadingFallback />}>
                      <PagesEditor />
                    </React.Suspense>
                  }
                />
                <Route
                  path="audit"
                  element={
                    <React.Suspense fallback={<AdminLoadingFallback />}>
                      <AuditLogViewer />
                    </React.Suspense>
                  }
                />
                <Route
                  path="publish"
                  element={
                    <React.Suspense fallback={<AdminLoadingFallback />}>
                      <PublishContent />
                    </React.Suspense>
                  }
                />
              </Route>
            </Routes>
          </PublicLayout>
        </Router>
      </ConsoleProvider>
    </AuthProvider>
  );
};

export default App;