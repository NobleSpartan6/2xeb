import React, { useEffect, useCallback } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Outlet,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';
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

// Lazy load 404 page (has heavy 3D components)
const NotFound = React.lazy(() => import('./pages/NotFound'));

// The Log (short writing) and its writing surface, the Desk. Lazy so the
// markdown renderer and the session module never enter the main bundle.
const Log = React.lazy(() => import('./pages/Log'));
const LogPost = React.lazy(() => import('./pages/LogPost'));
const Desk = React.lazy(() => import('./pages/desk/Desk'));

// Lazy load the easter egg terminal (pulls in the shader library) —
// it should never weigh down normal page loads
const MrRobotTerminal = React.lazy(() => import('./components/MrRobotTerminal'));

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
      '/log': 'Log',
      '/desk': 'Desk',
    };

    let title = 'Home';

    if (pathname.startsWith('/work/')) {
      title = 'Project';
    } else if (pathname.startsWith('/log/')) {
      title = 'Log';
    } else if (pathname.startsWith('/desk/')) {
      title = 'Desk';
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

  return (
    <React.Suspense fallback={null}>
      <MrRobotTerminal onClose={() => setIsEasterEggActive(false)} />
    </React.Suspense>
  );
};

// Check if current route is 404
const useIs404Route = () => {
  const { pathname } = useLocation();
  const validPaths = ['/', '/work', '/ml-lab', '/video', '/about', '/contact', '/friend', '/log', '/desk'];
  return (
    !validPaths.includes(pathname) &&
    !pathname.startsWith('/work/') &&
    !pathname.startsWith('/log/') &&
    !pathname.startsWith('/desk/')
  );
};

// Quiet placeholder while a lazy route's chunk arrives (the page paints its own header).
const RouteFallback = () => <div className="min-h-screen bg-[#050505]" aria-hidden />;

// Main layout wrapper
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const is404 = useIs404Route();
  // The Desk is a writing surface, not a page of the portfolio: no nav, no HUD.
  const isDesk = pathname.startsWith('/desk');

  // 404 page has its own full-screen layout
  if (is404 || isDesk) {
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
      {/* Film grain: one shared texture over every page (nav + footer included)
          so the whole site reads like one graded piece of footage. Plain alpha,
          no blend mode — mix-blend over the animated WebGL canvas forced a
          full-viewport recomposite on every 3D frame. */}
      <div
        aria-hidden
        className="fixed inset-0 z-[90] pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

// Layout route: everything that used to live directly under <Router>.
// A data router (createBrowserRouter) is required for View Transitions —
// Link viewTransition and useViewTransitionState are data-router features.
const RootLayout = () => (
  <>
    <ScrollToTop />
    <PageTitle />
    <EasterEggListener />
    <EasterEggOverlay />
    <MainLayout>
      <Outlet />
    </MainLayout>
  </>
);

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/work" element={<Work />} />
      <Route path="/work/:slug" element={<ProjectDetail />} />
      <Route path="/ml-lab" element={<MLLab />} />
      <Route path="/video" element={<Video />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/friend" element={<FriendRouteActivator />} />
      <Route path="/log" element={<React.Suspense fallback={<RouteFallback />}><Log /></React.Suspense>} />
      <Route path="/log/:slug" element={<React.Suspense fallback={<RouteFallback />}><LogPost /></React.Suspense>} />
      <Route path="/desk/*" element={<React.Suspense fallback={<RouteFallback />}><Desk /></React.Suspense>} />
      <Route path="*" element={
        <React.Suspense fallback={
          <div className="h-screen w-screen bg-[#050505] flex items-center justify-center">
            <div className="text-[#2563EB] font-mono animate-pulse">Loading...</div>
          </div>
        }>
          <NotFound />
        </React.Suspense>
      } />
    </Route>
  )
);

const App: React.FC = () => {
  return (
    <ConsoleProvider>
      <RouterProvider router={router} />
    </ConsoleProvider>
  );
};

export default App;
