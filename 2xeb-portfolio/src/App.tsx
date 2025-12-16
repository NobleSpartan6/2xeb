import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
import { useEasterEgg } from './hooks/useEasterEgg';
import MrRobotTerminal from './components/MrRobotTerminal';

// Lazy load 404 page (has heavy 3D components)
const NotFound = React.lazy(() => import('./pages/NotFound'));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Dynamic page title hook
const usePageTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageTitles: Record<string, string> = {
      '/': 'Home',
      '/work': 'Work',
      '/ml-lab': 'ML Lab',
      '/video': 'Video',
      '/about': 'About',
      '/contact': 'Contact',
    };

    let title = 'Home';

    if (pathname.startsWith('/work/')) {
      title = 'Project';
    } else if (pageTitles[pathname]) {
      title = pageTitles[pathname];
    }

    document.title = `eb - ${title}`;
  }, [pathname]);
};

const PageTitle = () => {
  usePageTitle();
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

// Easter egg keyboard listener - type "friend" anywhere to activate
const EasterEggListener = () => {
  const { setIsEasterEggActive } = useConsole();

  const handleActivate = useCallback(() => {
    setIsEasterEggActive(true);
  }, [setIsEasterEggActive]);

  useEasterEgg({ onActivate: handleActivate });

  return null;
};

// Easter egg route activator - /friend route
const FriendRouteActivator = () => {
  const navigate = useNavigate();
  const { setIsEasterEggActive } = useConsole();

  useEffect(() => {
    setIsEasterEggActive(true);
    // Navigate to home after activating, so URL doesn't stay on /friend
    navigate('/', { replace: true });
  }, [setIsEasterEggActive, navigate]);

  return null;
};

// Easter egg overlay renderer
const EasterEggOverlay = () => {
  const { isEasterEggActive, setIsEasterEggActive } = useConsole();

  if (!isEasterEggActive) return null;

  return <MrRobotTerminal onClose={() => setIsEasterEggActive(false)} />;
};

// Check if current route is 404
const useIs404Route = () => {
  const { pathname } = useLocation();
  const validPaths = ['/', '/work', '/ml-lab', '/video', '/about', '/contact', '/friend'];
  return !validPaths.includes(pathname) && !pathname.startsWith('/work/');
};

// Main layout wrapper
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const is404 = useIs404Route();

  // 404 page has its own full-screen layout
  if (is404) {
    return <>{children}</>;
  }

  return (
    <div
      className={`min-h-[100dvh] bg-[#050505] text-white font-sans selection:bg-[#2563EB] selection:text-white overflow-x-hidden ${isHome ? '' : 'pb-12'}`}
      style={{ minHeight: '-webkit-fill-available' }}
    >
      <NavBar />
      <CloseAgentOnRouteChange />
      {children}
      <FooterHUD />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ConsoleProvider>
      <Router>
        <ScrollToTop />
        <PageTitle />
        <EasterEggListener />
        <EasterEggOverlay />
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/work" element={<Work />} />
            <Route path="/work/:slug" element={<ProjectDetail />} />
            <Route path="/ml-lab" element={<MLLab />} />
            <Route path="/video" element={<Video />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/friend" element={<FriendRouteActivator />} />
            <Route path="*" element={
              <React.Suspense fallback={
                <div className="h-screen w-screen bg-[#050505] flex items-center justify-center">
                  <div className="text-[#2563EB] font-mono animate-pulse">Loading...</div>
                </div>
              }>
                <NotFound />
              </React.Suspense>
            } />
          </Routes>
        </MainLayout>
      </Router>
    </ConsoleProvider>
  );
};

export default App;
