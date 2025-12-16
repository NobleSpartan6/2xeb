import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Error boundary for Canvas
class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Reusable objects to avoid GC
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

// Floating debris using InstancedMesh for performance
const DebrisField: React.FC<{ matrixMode: boolean }> = ({ matrixMode }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 30;

  const positions = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 16,
      y: (Math.random() - 0.5) * 12,
      z: (Math.random() - 0.5) * 8 - 4,
      scale: Math.random() * 0.25 + 0.1,
      speed: Math.random() * 0.4 + 0.2,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    positions.forEach((p, i) => {
      _dummy.position.set(
        p.x,
        p.y + Math.sin(time * p.speed + p.offset) * 0.5,
        p.z
      );
      _dummy.rotation.set(
        Math.sin(time * p.speed + p.offset) * 0.5,
        Math.cos(time * p.speed * 0.7 + p.offset) * 0.5,
        0
      );
      _dummy.scale.setScalar(p.scale);
      _dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, _dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const color = matrixMode ? '#22c55e' : '#2563EB';

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
    </instancedMesh>
  );
};

// Central orb
const GlowingOrb: React.FC<{ matrixMode: boolean }> = ({ matrixMode }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.3;
      meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.2;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.2;
    }
  });

  const color = matrixMode ? '#22c55e' : '#2563EB';

  return (
    <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.4}>
      <group>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1.2, 1]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.8} />
        </mesh>
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2, 0.03, 16, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} />
        </mesh>
      </group>
    </Float>
  );
};

// Particle ring
const ParticleRing: React.FC<{ matrixMode: boolean }> = ({ matrixMode }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      const angle = (i / 300) * Math.PI * 2;
      const radius = 6 + Math.random() * 1.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  const color = matrixMode ? '#22c55e' : '#2563EB';

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.04} color={color} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
};

// 3D Scene
const Scene: React.FC<{ matrixMode: boolean }> = ({ matrixMode }) => {
  return (
    <>
      <color attach="background" args={['#050505']} />
      <GlowingOrb matrixMode={matrixMode} />
      <DebrisField matrixMode={matrixMode} />
      <ParticleRing matrixMode={matrixMode} />
      <Stars radius={40} depth={40} count={500} factor={3} saturation={0} fade speed={0.5} />
    </>
  );
};

// CSS Fallback background
const FallbackBackground: React.FC<{ matrixMode: boolean }> = ({ matrixMode }) => {
  const color = matrixMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(37, 99, 235, 0.1)';
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }}
    />
  );
};

// Terminal types
interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success';
  content: string;
}

const RESPONSES: Record<string, { type: 'output' | 'error' | 'success'; content: string }> = {
  help: {
    type: 'output',
    content: `Available commands:
  home     - Return to homepage
  ls       - List available pages
  whoami   - About the developer
  matrix   - ???
  clear    - Clear terminal
  exit     - Return home`,
  },
  ls: {
    type: 'output',
    content: `drwxr-xr-x  /
drwxr-xr-x  /work
drwxr-xr-x  /ml-lab
drwxr-xr-x  /video
drwxr-xr-x  /about
drwxr-xr-x  /contact
-rw-r--r--  /404  <-- you are here`,
  },
  whoami: {
    type: 'output',
    content: `eb - software engineer, creative technologist
Building at the intersection of code and creativity.
Currently lost in the void of a 404 page.`,
  },
  matrix: {
    type: 'success',
    content: `Wake up, Neo...
The Matrix has you...
Follow the white rabbit.

(try the konami code)`,
  },
  pwd: { type: 'output', content: '/dev/null/404' },
  cat: { type: 'error', content: 'cat: file not found (obviously)' },
  sudo: { type: 'error', content: 'Nice try. You are not in the sudoers file.' },
  rm: { type: 'error', content: 'rm: cannot remove: Permission denied' },
  hack: { type: 'success', content: `[ACCESSING MAINFRAME...]\nJust kidding. Nice try though.` },
  coffee: { type: 'error', content: "418: I'm a teapot" },
  ping: { type: 'output', content: 'PING reality: Request timed out. Reality not found.' },
};

// Glitch text component
const GlitchText: React.FC<{ text: string; matrixMode: boolean }> = ({ text, matrixMode }) => {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 100);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const baseColor = matrixMode ? '#22c55e' : '#2563EB';

  return (
    <div className="relative select-none">
      <span
        className="text-[100px] sm:text-[140px] md:text-[180px] font-bold font-space-grotesk leading-none"
        style={{
          color: baseColor,
          textShadow: glitch
            ? `2px 2px 0 #06B6D4, -2px -2px 0 #7C3AED, 0 0 30px ${baseColor}`
            : `0 0 30px ${baseColor}, 0 0 60px ${baseColor}40`,
          transform: glitch ? `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)` : 'none',
        }}
      >
        {text}
      </span>
      {glitch && (
        <>
          <span
            className="absolute inset-0 text-[100px] sm:text-[140px] md:text-[180px] font-bold font-space-grotesk leading-none opacity-70"
            style={{ color: '#06B6D4', transform: 'translate(3px, -3px)', clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)' }}
          >
            {text}
          </span>
          <span
            className="absolute inset-0 text-[100px] sm:text-[140px] md:text-[180px] font-bold font-space-grotesk leading-none opacity-70"
            style={{ color: '#7C3AED', transform: 'translate(-3px, 3px)', clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)' }}
          >
            {text}
          </span>
        </>
      )}
    </div>
  );
};

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { type: 'output', content: 'Page not found. You\'ve ventured into the void.' },
    { type: 'output', content: 'Type "help" for commands or "home" to escape.' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [matrixMode, setMatrixMode] = useState(false);
  const [konamiProgress, setKonamiProgress] = useState(0);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!terminalOpen && e.key.length === 1) {
        setTerminalOpen(true);
        return;
      }

      const expectedKey = KONAMI_CODE[konamiProgress];
      if (e.key === expectedKey || e.key.toLowerCase() === expectedKey) {
        const newProgress = konamiProgress + 1;
        setKonamiProgress(newProgress);
        if (newProgress === KONAMI_CODE.length) {
          setMatrixMode(true);
          setTerminalLines(prev => [...prev,
            { type: 'success', content: '>>> KONAMI CODE ACTIVATED <<<' },
            { type: 'success', content: 'Matrix mode enabled!' },
          ]);
          setKonamiProgress(0);
        }
      } else if (!['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
        setKonamiProgress(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiProgress, terminalOpen]);

  useEffect(() => {
    if (terminalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [terminalOpen]);

  const handleCommand = useCallback((cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    const newLines: TerminalLine[] = [{ type: 'input', content: `$ ${cmd}` }];

    if (trimmedCmd === 'home' || trimmedCmd === 'exit' || trimmedCmd === 'cd ~' || trimmedCmd === 'cd /') {
      newLines.push({ type: 'success', content: 'Redirecting to home...' });
      setTerminalLines(prev => [...prev, ...newLines]);
      setIsTransitioning(true);
      setTimeout(() => navigate('/'), 1500);
      return;
    }

    if (trimmedCmd === 'clear') {
      setTerminalLines([{ type: 'output', content: 'Terminal cleared. Still lost.' }]);
      return;
    }

    if (trimmedCmd.startsWith('cd ')) {
      const path = trimmedCmd.slice(3).replace('/', '');
      const validPaths = ['work', 'ml-lab', 'video', 'about', 'contact'];
      if (validPaths.includes(path)) {
        newLines.push({ type: 'success', content: `Navigating to /${path}...` });
        setTerminalLines(prev => [...prev, ...newLines]);
        setIsTransitioning(true);
        setTimeout(() => navigate(`/${path}`), 1500);
        return;
      }
      newLines.push({ type: 'error', content: `cd: ${path}: No such directory` });
    } else if (RESPONSES[trimmedCmd]) {
      newLines.push(RESPONSES[trimmedCmd]);
    } else if (trimmedCmd !== '') {
      newLines.push({ type: 'error', content: `command not found: ${trimmedCmd}` });
    }

    setTerminalLines(prev => [...prev, ...newLines]);
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCommand(currentInput);
    setCurrentInput('');
  };

  return (
    <div className={`h-screen w-screen bg-[#050505] relative overflow-hidden transition-all duration-1000 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <style>{`
        .terminal-cursor { animation: blink 1s step-end infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      {/* 3D Canvas with error boundary */}
      <CanvasErrorBoundary fallback={<FallbackBackground matrixMode={matrixMode} />}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          className="absolute inset-0"
          dpr={1}
          gl={{
            antialias: false,
            alpha: false,
            powerPreference: 'low-power',
            failIfMajorPerformanceCaveat: true,
          }}
          performance={{ min: 0.5 }}
        >
          <Suspense fallback={null}>
            <Scene matrixMode={matrixMode} />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.02]"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)' }}
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-8 px-4">
        {/* 404 Text */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <GlitchText text="404" matrixMode={matrixMode} />
          <p className="text-[#a3a3a3] font-mono text-sm mt-4">Page not found</p>
          <p className="text-[#525252] font-mono text-xs mt-1">You've drifted into the void</p>
        </div>

        {/* Terminal toggle */}
        {!terminalOpen && (
          <button
            onClick={() => setTerminalOpen(true)}
            className="mb-4 px-6 py-3 bg-[#0a0a0a]/80 backdrop-blur border border-[#333] hover:border-[#2563EB] transition-all duration-300 font-mono text-sm text-white"
          >
            Open Terminal
          </button>
        )}

        {/* Terminal window */}
        {terminalOpen && (
          <div className="w-full max-w-2xl">
            <div className="bg-[#1a1a1a]/90 backdrop-blur border border-[#333] border-b-0 rounded-t-lg px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <button onClick={() => setTerminalOpen(false)} className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
              </div>
              <span className="text-[#666] text-xs font-mono ml-2">void@2xeb:~/404</span>
            </div>

            <div
              ref={terminalRef}
              className="bg-[#0a0a0a]/90 backdrop-blur border border-[#333] border-t-0 rounded-b-lg p-4 h-[200px] overflow-y-auto font-mono text-sm"
            >
              {terminalLines.map((line, i) => (
                <div
                  key={i}
                  className={`whitespace-pre-wrap mb-1 ${
                    line.type === 'input' ? 'text-[#2563EB]' :
                    line.type === 'error' ? 'text-red-400' :
                    line.type === 'success' ? 'text-green-400' :
                    'text-[#a3a3a3]'
                  }`}
                >
                  {line.content}
                </div>
              ))}

              <form onSubmit={handleSubmit} className="flex items-center">
                <span className="text-[#2563EB] mr-2">$</span>
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    className="w-full bg-transparent text-white outline-none font-mono caret-transparent"
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <span
                    className="terminal-cursor text-white absolute top-0 pointer-events-none"
                    style={{ left: `${currentInput.length * 0.6}em` }}
                  >_</span>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => navigate('/'), 1000);
            }}
            className="group px-6 py-3 bg-[#0a0a0a]/80 backdrop-blur border border-[#333] hover:border-[#2563EB] transition-all duration-300 flex items-center gap-2"
          >
            <span className="text-[#2563EB] group-hover:translate-x-[-4px] transition-transform">&larr;</span>
            <span className="text-white font-mono text-sm">Go Home</span>
          </button>
        </div>

        <p className="mt-4 text-[#525252] text-xs font-mono">
          Press any key to open terminal • Try the konami code
        </p>
      </div>

      {/* Transition overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
            <div className="text-[#2563EB] font-mono animate-pulse">Escaping the void...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotFound;
