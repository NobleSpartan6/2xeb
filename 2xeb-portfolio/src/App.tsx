import React from 'react';
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
import { ConsoleProvider } from './context/ConsoleContext';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <ConsoleProvider>
      <Router>
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#2563EB] selection:text-white overflow-x-hidden pb-12">
          <NavBar />
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/work" element={<Work />} />
            <Route path="/work/:slug" element={<ProjectDetail />} />
            <Route path="/ml-lab" element={<MLLab />} />
            <Route path="/video" element={<Video />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
          <FooterHUD />
        </div>
      </Router>
    </ConsoleProvider>
  );
};

export default App;