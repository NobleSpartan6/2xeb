import React from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import { signOut } from '../../lib/session';
import SignIn from './SignIn';
import DeskList from './DeskList';
import DeskEditor from './DeskEditor';

/**
 * The Desk: where the Log gets written. Lives at /desk, outside the
 * portfolio's nav and HUD. Requires the desk session (see lib/session.ts);
 * without one it shows the sign-in form in place.
 */
const Desk: React.FC = () => {
  const session = useSession();
  const navigate = useNavigate();

  if (!session) return <SignIn />;

  const leave = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white font-sans selection:bg-[#2563EB] selection:text-white">
      <header className="sticky top-0 z-30 bg-[#050505]/90 backdrop-blur border-b border-[#1f1f1f]">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/desk" className="flex items-center gap-3 group">
            <div className="w-7 h-7 bg-[#0A0A0A] border border-[#262626] grid place-items-center group-hover:border-[#2563EB] transition-colors">
              <span className="text-[#2563EB] font-bold text-xs font-space-grotesk">EB</span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] font-mono group-hover:text-white transition-colors">
              Desk
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-[10px] uppercase tracking-widest font-mono text-[#737373]">
            <Link to="/log" className="hover:text-white transition-colors">
              Log ↗
            </Link>
            <button onClick={leave} className="hover:text-white transition-colors">
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-6">
        <Routes>
          <Route index element={<DeskList />} />
          {/* One route for "new" and an id, so creating a piece can swap the URL
              to its id without remounting the editor mid-keystroke. */}
          <Route path=":id" element={<DeskEditor />} />
        </Routes>
      </main>
    </div>
  );
};

export default Desk;
