import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useConsole, ConsoleContext } from '../context/ConsoleContext';
import { ConsoleLane } from '../lib/types';

// --- RESPONSIVE CONFIGURATION ---
type ScreenSize = 'mobile' | 'desktop' | 'large' | 'ultrawide';

const getGridConfig = (screenSize: ScreenSize) => {
  switch (screenSize) {
    case 'mobile':
      return { gridSize: 24, cellSize: 0.6, gap: 0.08 };
    case 'desktop':
      return { gridSize: 40, cellSize: 0.5, gap: 0.08 };
    case 'large': // 1440p displays
      return { gridSize: 50, cellSize: 0.45, gap: 0.07 };
    case 'ultrawide': // 4K displays
      return { gridSize: 56, cellSize: 0.42, gap: 0.06 };
    default:
      return { gridSize: 40, cellSize: 0.5, gap: 0.08 };
  }
};

const getScreenSize = (width: number): ScreenSize => {
  if (width < 768) return 'mobile';
  if (width < 1920) return 'desktop';
  if (width < 2400) return 'large';
  return 'ultrawide';
};

const CELL_SIZE = 0.5;
const GAP = 0.08;

// Colors matching design system
const COLORS = {
  bg: '#050505',
  swe: new THREE.Color('#06B6D4'),      // Cyan - CODE
  ml: new THREE.Color('#84CC16'),        // Lime - VISION
  video: new THREE.Color('#F59E0B'),     // Amber - DESIGN
  accent: new THREE.Color('#2563EB'),    // Swiss Blue
  dim: new THREE.Color('#0a0a0a'),
};

// Reusable objects to avoid GC pressure
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _vec3 = new THREE.Vector3();

// --- PILLAR BEHAVIORS ---
// Each pillar represents a discipline with distinct movement patterns

interface PillarState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  phase: number;
}

// SWE: Precise, grid-snapped, architectural movement
const updateSWEPillar = (state: PillarState, time: number): void => {
  const speed = 0.6;
  const t = time * speed;

  // Quantized movement - snaps to grid intersections
  const gridStep = (CELL_SIZE + GAP) * 3;
  const targetX = Math.round(Math.sin(t * 0.7) * 8) * gridStep / 3;
  const targetZ = Math.round(Math.cos(t * 0.5) * 6) * gridStep / 3;

  // Smooth interpolation to target
  state.position.x += (targetX - state.position.x) * 0.08;
  state.position.z += (targetZ - state.position.z) * 0.08;
  state.phase = t;
};

// ML: Organic, flowing, neural-network-like patterns
const updateMLPillar = (state: PillarState, time: number): void => {
  const speed = 0.4;
  const t = time * speed;

  // Lissajous curves for organic wandering
  state.position.x = Math.sin(t * 1.3) * 6 + Math.cos(t * 0.5) * 3;
  state.position.z = Math.cos(t * 0.8) * 5 + Math.sin(t * 1.1) * 2;
  state.phase = t;
};

// VIDEO: Linear sweep, timeline-like scanning motion
const updateVideoPillar = (state: PillarState, time: number): void => {
  const speed = 0.35;
  const t = time * speed;

  // Horizontal sweep with subtle vertical drift
  state.position.x = Math.sin(t) * 10;
  state.position.z = Math.sin(t * 0.3) * 2;
  state.phase = t;
};

// --- MAIN GRID COMPONENT ---
interface InteractiveGridProps {
  focusedDiscipline: ConsoleLane | null;
  gridSize: number;
  cellSize: number;
}

const InteractiveGrid: React.FC<InteractiveGridProps> = ({ focusedDiscipline, gridSize, cellSize }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { mouse, viewport } = useThree();
  const totalCells = gridSize * gridSize;

  // Pillar states
  const pillars = useRef({
    swe: { position: new THREE.Vector3(0, 0, 0), velocity: new THREE.Vector3(), phase: 0 },
    ml: { position: new THREE.Vector3(5, 0, 3), velocity: new THREE.Vector3(), phase: 0 },
    video: { position: new THREE.Vector3(-5, 0, -2), velocity: new THREE.Vector3(), phase: 0 },
  });

  // Pre-compute grid positions
  const gridData = useMemo(() => {
    const data: { x: number; z: number; idx: number }[] = [];
    const offset = (gridSize * (cellSize + GAP)) / 2;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        data.push({
          x: i * (cellSize + GAP) - offset,
          z: j * (cellSize + GAP) - offset,
          idx: i * gridSize + j,
        });
      }
    }
    return data;
  }, [gridSize, cellSize]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    // Update pillar positions
    updateSWEPillar(pillars.current.swe, time);
    updateMLPillar(pillars.current.ml, time);
    updateVideoPillar(pillars.current.video, time);

    const swePos = pillars.current.swe.position;
    const mlPos = pillars.current.ml.position;
    const videoPos = pillars.current.video.position;

    // Mouse position in world space (approximate)
    const mouseX = (mouse.x * viewport.width) / 2;
    const mouseZ = -(mouse.y * viewport.height) / 2;

    // Determine which discipline influences should be active
    const showSwe = !focusedDiscipline || focusedDiscipline === ConsoleLane.CODE;
    const showMl = !focusedDiscipline || focusedDiscipline === ConsoleLane.VISION;
    const showVideo = !focusedDiscipline || focusedDiscipline === ConsoleLane.DESIGN;

    for (let i = 0; i < totalCells; i++) {
      const { x, z, idx } = gridData[i];
      let targetY = 0;
      let r = 0.03, g = 0.03, b = 0.03; // Base dark

      // === SWE INFLUENCE: Cross/Grid Pattern ===
      if (showSwe) {
        const dSweX = Math.abs(x - swePos.x);
        const dSweZ = Math.abs(z - swePos.z);
        const crossWidth = 0.3;
        const crossLength = 3.5;

        // Manhattan cross pattern
        const inCross = (dSweX < crossWidth && dSweZ < crossLength) ||
                        (dSweZ < crossWidth && dSweX < crossLength);

        if (inCross) {
          const dist = Math.min(dSweX, dSweZ);
          const intensity = Math.max(0, 1 - dist / crossWidth);
          const falloff = 1 - Math.max(dSweX, dSweZ) / crossLength;

          targetY += intensity * falloff * 1.2;
          r += COLORS.swe.r * intensity * falloff * 0.9;
          g += COLORS.swe.g * intensity * falloff * 0.9;
          b += COLORS.swe.b * intensity * falloff * 0.9;
        }
      }

      // === ML INFLUENCE: Ripple/Wave Pattern ===
      if (showMl) {
        const dMl = Math.sqrt((x - mlPos.x) ** 2 + (z - mlPos.z) ** 2);
        const mlRadius = 5.0;

        if (dMl < mlRadius) {
          const intensity = 1 - (dMl / mlRadius);
          const wave = Math.sin(dMl * 2 - time * 4) * 0.5 + 0.5;

          targetY += wave * intensity * 0.8;
          r += COLORS.ml.r * intensity * wave * 0.8;
          g += COLORS.ml.g * intensity * wave * 0.8;
          b += COLORS.ml.b * intensity * wave * 0.8;
        }
      }

      // === VIDEO INFLUENCE: Scan Line ===
      if (showVideo) {
        const dVid = Math.abs(x - videoPos.x);
        const scanWidth = 1.8;

        if (dVid < scanWidth) {
          const intensity = Math.pow(1 - dVid / scanWidth, 1.5);
          // Vertical gradient based on z
          const zGradient = 0.5 + Math.sin(z * 0.5 + time * 2) * 0.3;

          targetY += intensity * zGradient * 0.5;
          r += COLORS.video.r * intensity * zGradient * 0.9;
          g += COLORS.video.g * intensity * zGradient * 0.9;
          b += COLORS.video.b * intensity * zGradient * 0.9;
        }
      }

      // === MOUSE INTERACTION ===
      const dMouse = Math.sqrt((x - mouseX) ** 2 + (z - mouseZ) ** 2);
      const mouseRadius = 4;
      if (dMouse < mouseRadius) {
        const intensity = 1 - (dMouse / mouseRadius);
        targetY += intensity * 0.6;
        // Swiss Blue accent on mouse hover
        r += COLORS.accent.r * intensity * 0.4;
        g += COLORS.accent.g * intensity * 0.4;
        b += COLORS.accent.b * intensity * 0.4;
      }

      // === SUBTLE BREATHING ===
      const breathe = Math.sin(time * 0.5 + idx * 0.01) * 0.03;
      targetY += breathe;

      // Apply position
      _dummy.position.set(x, targetY - 0.5, z);
      _dummy.scale.set(1, Math.max(0.1, 0.3 + targetY * 0.5), 1);
      _dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _dummy.matrix);

      // Apply color with smooth clamping
      _color.setRGB(
        Math.min(1, r),
        Math.min(1, g),
        Math.min(1, b)
      );
      meshRef.current.setColorAt(i, _color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, totalCells]}>
      <boxGeometry args={[cellSize, 1, cellSize]} />
      <meshStandardMaterial
        metalness={0.7}
        roughness={0.3}
        envMapIntensity={0.5}
      />
    </instancedMesh>
  );
};

// --- PILLAR LIGHTS ---
const PillarLights: React.FC = () => {
  const sweRef = useRef<THREE.PointLight>(null);
  const mlRef = useRef<THREE.PointLight>(null);
  const videoRef = useRef<THREE.PointLight>(null);

  const pillars = useRef({
    swe: { position: new THREE.Vector3(), velocity: new THREE.Vector3(), phase: 0 },
    ml: { position: new THREE.Vector3(), velocity: new THREE.Vector3(), phase: 0 },
    video: { position: new THREE.Vector3(), velocity: new THREE.Vector3(), phase: 0 },
  });

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    updateSWEPillar(pillars.current.swe, time);
    updateMLPillar(pillars.current.ml, time);
    updateVideoPillar(pillars.current.video, time);

    if (sweRef.current) {
      sweRef.current.position.set(
        pillars.current.swe.position.x,
        2,
        pillars.current.swe.position.z
      );
    }
    if (mlRef.current) {
      mlRef.current.position.set(
        pillars.current.ml.position.x,
        2.5 + Math.sin(time * 2) * 0.5,
        pillars.current.ml.position.z
      );
    }
    if (videoRef.current) {
      videoRef.current.position.set(
        pillars.current.video.position.x,
        2,
        pillars.current.video.position.z
      );
    }
  });

  return (
    <>
      <pointLight ref={sweRef} color="#06B6D4" intensity={3} distance={10} decay={2} />
      <pointLight ref={mlRef} color="#84CC16" intensity={3} distance={10} decay={2} />
      <pointLight ref={videoRef} color="#F59E0B" intensity={3} distance={10} decay={2} />
    </>
  );
};

// --- CAMERA RIG ---
const CameraRig: React.FC = () => {
  const { camera, mouse } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 12, 16));

  useFrame(() => {
    // Parallax effect based on mouse
    const targetX = mouse.x * 3;
    const targetY = 12 + mouse.y * 1;
    const targetZ = 16 - mouse.y * 2;

    targetPos.current.set(targetX, targetY, targetZ);

    // Smooth camera movement
    camera.position.lerp(targetPos.current, 0.03);
    camera.lookAt(0, -1, 0);
  });

  return null;
};

// --- MAIN SCENE COMPONENT ---
interface ImmersiveSceneProps {
  className?: string;
}

const ImmersiveScene: React.FC<ImmersiveSceneProps> = ({ className = '' }) => {
  const consoleCtx = useConsole();
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');

  // Detect screen size for responsive 3D rendering
  useEffect(() => {
    const checkScreenSize = () => {
      setScreenSize(getScreenSize(window.innerWidth));
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const config = getGridConfig(screenSize);
  const isMobile = screenSize === 'mobile';
  const isLargeScreen = screenSize === 'large' || screenSize === 'ultrawide';

  // DPR settings based on screen size
  const getDpr = (): [number, number] => {
    if (isMobile) return [1, 1];
    if (isLargeScreen) return [1, 2]; // Higher DPR for sharper rendering on 1440p+
    return [1, 1.5];
  };

  // FOV settings - wider on mobile, narrower on large screens for more detail
  const getFov = (): number => {
    if (isMobile) return 55;
    if (isLargeScreen) return 40;
    return 45;
  };

  // Fog settings based on screen size
  const getFog = (): [number, number] => {
    if (isMobile) return [10, 30];
    if (isLargeScreen) return [18, 50]; // More visible depth on large screens
    return [15, 40];
  };

  const fogSettings = getFog();

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        dpr={getDpr()}
        camera={{ position: [0, 12, 16], fov: getFov(), near: 0.1, far: 100 }}
        gl={{
          antialias: !isMobile, // Disable antialiasing on mobile for performance
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isLargeScreen ? 1.3 : 1.2, // Slightly brighter on large screens
          powerPreference: 'high-performance',
        }}
      >
        <ConsoleContext.Provider value={consoleCtx}>
          <color attach="background" args={['#050505']} />
          <fog attach="fog" args={['#050505', fogSettings[0], fogSettings[1]]} />

          {/* Ambient lighting */}
          <ambientLight intensity={0.15} />

          {/* Main directional light */}
          <directionalLight
            position={[10, 15, 5]}
            intensity={0.4}
            color="#ffffff"
          />

          {/* Accent light from below */}
          <pointLight position={[0, -5, 0]} intensity={0.3} color="#2563EB" />

          <InteractiveGrid
            focusedDiscipline={consoleCtx.focusedDiscipline}
            gridSize={config.gridSize}
            cellSize={config.cellSize}
          />
          <PillarLights />
          <CameraRig />
        </ConsoleContext.Provider>
      </Canvas>
    </div>
  );
};

export default ImmersiveScene;
