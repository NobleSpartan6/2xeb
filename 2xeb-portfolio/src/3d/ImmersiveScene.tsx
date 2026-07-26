import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useConsole, ConsoleContext } from '../context/ConsoleContext';
import { ConsoleLane } from '../lib/types';
import { prefersReducedMotion } from '../hooks/useAnimations';

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

// --- FIELD SHAPE ---
// Influence extents, hoisted out of the per-cube loop. The SWE arm is a little
// over one cell pitch wide so a sliding cross always covers a full row of
// cells; narrower than the pitch and the arm falls between rows and flickers.
const SWE_CROSS_WIDTH = 0.5;
const SWE_CROSS_LENGTH = 3.8;
const ML_RADIUS = 5.5;
const VIDEO_SCAN_WIDTH = 2.0;
const MOUSE_RADIUS = 4;

/**
 * How fast a cell lights up, as a half-life in seconds. Trails already smooth
 * the way light *leaves* a cell; without a matching ramp on the way in, cells
 * jump from the near-black floor to full emissive in a single frame, which
 * bloom then amplifies into a visible pop.
 */
const LIGHT_RISE_HALF_LIFE = 0.045;

/**
 * Smooth 0..1 falloff: 1 at the centre, 0 at `extent`, with zero slope at both
 * ends. Replaces hard `if (distance < extent)` gates — a gate makes a cell's
 * contribution appear and vanish between frames as a pillar slides past it,
 * so cells at an influence boundary blink instead of fading.
 */
const smoothFalloff = (extent: number, distance: number): number => {
  if (distance >= extent) return 0;
  const t = 1 - distance / extent;
  return t * t * (3 - 2 * t);
};

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

// Click shockwave signal, in NDC (-1..1) with a timestamp for dedup
export interface PulseSignal {
  nx: number;
  ny: number;
  t: number;
}

// --- MAIN GRID COMPONENT ---
interface InteractiveGridProps {
  focusedDiscipline: ConsoleLane | null;
  gridSize: number;
  cellSize: number;
  pulse: PulseSignal | null;
}

const InteractiveGrid: React.FC<InteractiveGridProps> = ({ focusedDiscipline, gridSize, cellSize, pulse }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { mouse, viewport } = useThree();
  const totalCells = gridSize * gridSize;

  // Instance colors double as emitters: bloom picks up vColor² so lit cells
  // glow like neon while the near-black floor stays dark
  const gridMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ metalness: 0.7, roughness: 0.3, envMapIntensity: 0.5 });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        [
          '#include <emissivemap_fragment>',
          '#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )',
          '  totalEmissiveRadiance += vColor * vColor * 1.5;',
          '#endif',
        ].join('\n')
      );
    };
    return mat;
  }, []);

  // Trails: cells remember recent light and let it decay, so the pillars and
  // the cursor paint fading comet streaks instead of only occupying cells
  const trails = useMemo(
    () => ({
      r: new Float32Array(totalCells),
      g: new Float32Array(totalCells),
      b: new Float32Array(totalCells),
      h: new Float32Array(totalCells),
    }),
    [totalCells]
  );

  const lastPulseRef = useRef(0);

  /** Per-discipline presence, eased so focusing one cross-fades the others. */
  const focusWeights = useRef({ swe: 1, ml: 1, video: 1 });

  // Pillar states
  const pillars = useRef({
    swe: { position: new THREE.Vector3(0, 0, 0), velocity: new THREE.Vector3(), phase: 0 },
    ml: { position: new THREE.Vector3(5, 0, 3), velocity: new THREE.Vector3(), phase: 0 },
    video: { position: new THREE.Vector3(-5, 0, -2), velocity: new THREE.Vector3(), phase: 0 },
  });

  // Pre-compute grid positions. edgeFade dissolves the outermost cells into
  // darkness so the plane reads as infinite — parallax near the viewport
  // perimeter must never resolve a hard grid boundary.
  const gridData = useMemo(() => {
    const data: { x: number; z: number; idx: number; edgeFade: number }[] = [];
    const offset = (gridSize * (cellSize + GAP)) / 2;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = i * (cellSize + GAP) - offset;
        const z = j * (cellSize + GAP) - offset;
        const edge = Math.max(Math.abs(x), Math.abs(z)) / offset;
        const edgeFade = Math.pow(Math.min(1, Math.max(0, (1 - edge) / 0.3)), 1.4);
        data.push({ x, z, idx: i * gridSize + j, edgeFade });
      }
    }
    return data;
  }, [gridSize, cellSize]);

  // Wave field: the grid is a physical surface. Impulses (cursor wake,
  // click splashes) propagate as damped waves through neighbouring cells,
  // with momentum and interference — not scripted rings.
  const wave = useMemo(
    () => ({ h: new Float32Array(totalCells), v: new Float32Array(totalCells) }),
    [totalCells]
  );
  const prevMouseRef = useRef<{ x: number; z: number; init: boolean }>({ x: 0, z: 0, init: false });

  // Reduced motion: freeze the clock so pillars, waves and breathing hold a
  // static (still lit and colored) pose; the mouse highlight stays as direct
  // interaction feedback.
  const reduceMotion = useMemo(() => prefersReducedMotion(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const rawTime = state.clock.getElapsedTime();
    const time = reduceMotion ? 0 : rawTime;

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

    // Ease discipline presence toward its target rather than switching it:
    // flipping a boolean drops two thirds of the field's light in one frame.
    // Trails soften that on the way out, but the way back in was a hard pop.
    const kFocus = reduceMotion ? 1 : 1 - Math.exp(-6 * delta);
    const fw = focusWeights.current;
    fw.swe += ((!focusedDiscipline || focusedDiscipline === ConsoleLane.CODE ? 1 : 0) - fw.swe) * kFocus;
    fw.ml += ((!focusedDiscipline || focusedDiscipline === ConsoleLane.VISION ? 1 : 0) - fw.ml) * kFocus;
    fw.video += ((!focusedDiscipline || focusedDiscipline === ConsoleLane.DESIGN ? 1 : 0) - fw.video) * kFocus;
    const sweWeight = fw.swe;
    const mlWeight = fw.ml;
    const videoWeight = fw.video;

    // How far a cell can climb toward its instantaneous influence this frame
    const kRise = reduceMotion ? 1 : 1 - Math.pow(2, -Math.min(delta, 1 / 30) / LIGHT_RISE_HALF_LIFE);

    const pulseAmp = reduceMotion ? 0.4 : 1;

    // --- WAVE FIELD: inject impulses, then propagate ---
    const wh = wave.h, wv = wave.v;
    const step = cellSize + GAP;
    const half = (gridSize * step) / 2;
    const inject = (wx: number, wz: number, v: number, rad: number) => {
      const ci = Math.round((wx + half) / step);
      const cj = Math.round((wz + half) / step);
      for (let a = -rad; a <= rad; a++) {
        for (let b = -rad; b <= rad; b++) {
          const ii = ci + a, jj = cj + b;
          if (ii < 0 || jj < 0 || ii >= gridSize || jj >= gridSize) continue;
          const fall = 1 - Math.hypot(a, b) / (rad + 1);
          if (fall > 0) wv[ii * gridSize + jj] += v * fall;
        }
      }
    };

    // Click splash: press the surface down hard, physics does the rest
    if (pulse && pulse.t > lastPulseRef.current) {
      lastPulseRef.current = pulse.t;
      inject((pulse.nx * viewport.width) / 2, -(pulse.ny * viewport.height) / 2, -2.2 * pulseAmp, 2);
    }

    // Cursor wake: a moving pointer displaces the surface along its path
    const pm = prevMouseRef.current;
    if (pm.init) {
      const speed = Math.hypot(mouseX - pm.x, mouseZ - pm.z) / Math.max(delta, 0.001);
      if (speed > 2.5) {
        inject(mouseX, mouseZ, -Math.min(16, speed) * 0.05 * pulseAmp, 1);
      }
    }
    pm.x = mouseX;
    pm.z = mouseZ;
    pm.init = true;

    // Damped wave propagation (clamped dt for stability on slow frames)
    const dtw = Math.min(delta, 0.033);
    const c2 = 90;
    const wDamp = Math.exp(-4.5 * dtw);
    const N = gridSize;
    for (let i = 0; i < totalCells; i++) {
      const row = (i / N) | 0, col = i % N;
      const nL = col > 0 ? wh[i - 1] : wh[i];
      const nR = col < N - 1 ? wh[i + 1] : wh[i];
      const nU = row > 0 ? wh[i - N] : wh[i];
      const nD = row < N - 1 ? wh[i + N] : wh[i];
      wv[i] = (wv[i] + ((nL + nR + nU + nD) / 4 - wh[i]) * c2 * dtw) * wDamp;
    }
    for (let i = 0; i < totalCells; i++) wh[i] += wv[i] * dtw;

    // Frame-rate-independent trail decay (longer streaks: ~1.3s tails)
    const decay = Math.exp(-5 * delta);
    const tR = trails.r, tG = trails.g, tB = trails.b, tH = trails.h;

    for (let i = 0; i < totalCells; i++) {
      const { x, z, idx, edgeFade } = gridData[i];
      // Instantaneous influence for this frame (fed into the trail buffers)
      let ih = 0;
      let ir = 0, ig = 0, ib = 0;

      // === SWE INFLUENCE: Cross/Grid Pattern ===
      if (sweWeight > 0.002) {
        const dSweX = Math.abs(x - swePos.x);
        const dSweZ = Math.abs(z - swePos.z);

        // Two smoothly shouldered arms rather than a hard Manhattan test, so
        // the cross keeps its shape but its ends and edges fade as it slides
        const armH = smoothFalloff(SWE_CROSS_WIDTH, dSweZ) * smoothFalloff(SWE_CROSS_LENGTH, dSweX);
        const armV = smoothFalloff(SWE_CROSS_WIDTH, dSweX) * smoothFalloff(SWE_CROSS_LENGTH, dSweZ);
        const swe = Math.max(armH, armV) * sweWeight;

        if (swe > 0) {
          ih += swe * 1.2;
          ir += COLORS.swe.r * swe * 0.9;
          ig += COLORS.swe.g * swe * 0.9;
          ib += COLORS.swe.b * swe * 0.9;
        }
      }

      // === ML INFLUENCE: Ripple/Wave Pattern ===
      if (mlWeight > 0.002) {
        const dMl = Math.sqrt((x - mlPos.x) ** 2 + (z - mlPos.z) ** 2);

        if (dMl < ML_RADIUS) {
          const wave = Math.sin(dMl * 2 - time * 4) * 0.5 + 0.5;
          const ml = smoothFalloff(ML_RADIUS, dMl) * wave * mlWeight;

          ih += ml * 0.8;
          ir += COLORS.ml.r * ml * 0.8;
          ig += COLORS.ml.g * ml * 0.8;
          ib += COLORS.ml.b * ml * 0.8;
        }
      }

      // === VIDEO INFLUENCE: Scan Line ===
      if (videoWeight > 0.002) {
        const dVid = Math.abs(x - videoPos.x);

        if (dVid < VIDEO_SCAN_WIDTH) {
          // Vertical gradient based on z
          const zGradient = 0.5 + Math.sin(z * 0.5 + time * 2) * 0.3;
          const video = smoothFalloff(VIDEO_SCAN_WIDTH, dVid) * zGradient * videoWeight;

          ih += video * 0.5;
          ir += COLORS.video.r * video * 0.9;
          ig += COLORS.video.g * video * 0.9;
          ib += COLORS.video.b * video * 0.9;
        }
      }

      // === MOUSE INTERACTION ===
      const dMouse = Math.sqrt((x - mouseX) ** 2 + (z - mouseZ) ** 2);
      if (dMouse < MOUSE_RADIUS) {
        const hover = smoothFalloff(MOUSE_RADIUS, dMouse);
        ih += hover * 0.6;
        // Swiss Blue accent on mouse hover
        ir += COLORS.accent.r * hover * 0.3;
        ig += COLORS.accent.g * hover * 0.3;
        ib += COLORS.accent.b * hover * 0.3;
      }

      // === TRAILS: ramp up toward "now", decay away from it ===
      // Rising through kRise instead of jumping straight to `ih` keeps cells
      // from popping on at full emissive; the decay below is the comet tail.
      const hD = tH[i] * decay;
      const rD = tR[i] * decay;
      const gD = tG[i] * decay;
      const bD = tB[i] * decay;
      const hT = (tH[i] = ih > hD ? hD + (ih - hD) * kRise : hD);
      const rT = (tR[i] = ir > rD ? rD + (ir - rD) * kRise : rD);
      const gT = (tG[i] = ig > gD ? gD + (ig - gD) * kRise : gD);
      const bT = (tB[i] = ib > bD ? bD + (ib - bD) * kRise : bD);

      // === WAVE FIELD: ripples lift the surface and glow accent-blue ===
      const wH = wh[idx];
      const wGlow = Math.min(0.28, Math.abs(wH) * 0.35);

      // === SUBTLE BREATHING ===
      const breathe = Math.sin(time * 0.5 + idx * 0.01) * 0.03;
      const targetY = (hT + wH * 0.6 + breathe) * edgeFade;

      // Apply position
      _dummy.position.set(x, targetY - 0.5, z);
      _dummy.scale.set(1, Math.max(0.1, 0.3 + targetY * 0.5), 1);
      _dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _dummy.matrix);

      // Apply color: cool-tinted floor base so the surface always reads,
      // trails + wave glow on top, everything dissolving at the grid edge
      _color.setRGB(
        Math.min(1, (0.024 + rT + COLORS.accent.r * wGlow) * edgeFade),
        Math.min(1, (0.028 + gT + COLORS.accent.g * wGlow) * edgeFade),
        Math.min(1, (0.042 + bT + COLORS.accent.b * wGlow) * edgeFade)
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
      <primitive object={gridMaterial} attach="material" />
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

  const reduceMotion = useMemo(() => prefersReducedMotion(), []);

  useFrame((state) => {
    const time = reduceMotion ? 0 : state.clock.getElapsedTime();

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
  const { camera, mouse, viewport } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 12, 16));
  const reduceMotion = useMemo(() => prefersReducedMotion(), []);

  useFrame((state) => {
    // Tall/narrow viewports leave empty sky above the grid's horizon with the
    // wide-screen framing — steepen the pitch so the floor fills the frame.
    // tall: 0 on wide desktop → 1 on portrait.
    const tall = THREE.MathUtils.clamp((1.35 - viewport.aspect) / 0.9, 0, 1);
    const baseY = 12 + tall * 5;
    const baseZ = 16 - tall * 6.5;

    // Reduced motion: no viewport-wide parallax — hold the (aspect-correct)
    // framing without drift
    if (reduceMotion) {
      targetPos.current.set(0, baseY, baseZ);
      camera.position.lerp(targetPos.current, 0.1);
      camera.lookAt(0, -1, 0);
      return;
    }

    // Slow autonomous drift keeps the scene alive without a cursor;
    // mouse parallax layers on top
    // Parallax travel kept modest so the camera never pans far enough to
    // resolve the grid's edge
    const t = state.clock.getElapsedTime();
    const targetX = mouse.x * 2.2 + Math.sin(t * 0.08) * 0.9;
    const targetY = baseY + mouse.y * 1 + Math.sin(t * 0.05) * 0.3;
    const targetZ = baseZ - mouse.y * 2 + Math.cos(t * 0.06) * 0.5;

    targetPos.current.set(targetX, targetY, targetZ);

    // Smooth camera movement
    camera.position.lerp(targetPos.current, 0.03);
    camera.lookAt(0, -1, 0);
  });

  return null;
};

// --- READY DETECTOR ---
// Fires callback after first frame renders
const ReadyDetector: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  const hasCalledRef = useRef(false);

  useFrame(() => {
    if (!hasCalledRef.current) {
      hasCalledRef.current = true;
      // Small delay to ensure GPU has finished initial render
      setTimeout(onReady, 50);
    }
  });

  return null;
};

// --- MAIN SCENE COMPONENT ---
interface ImmersiveSceneProps {
  className?: string;
  onReady?: () => void;
  /** Click shockwave signal from the overlay (NDC coords + timestamp) */
  pulse?: PulseSignal | null;
}

const ImmersiveScene: React.FC<ImmersiveSceneProps> = ({ className = '', onReady, pulse = null }) => {
  const consoleCtx = useConsole();
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');
  const reduceMotion = useMemo(() => prefersReducedMotion(), []);

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
    // Cap at 1.5 everywhere: bloom's mipmap chain at DPR 2 on 1440p+ doubles
    // GPU work for sharpness the glow aesthetic doesn't need
    return [1, 1.5];
  };

  // FOV settings - wider on mobile, narrower on large screens for more detail
  const getFov = (): number => {
    if (isMobile) return 55;
    if (isLargeScreen) return 40;
    return 45;
  };

  // Fog settings based on screen size
  // Far fog pulled in so the grid boundary never resolves — the plane fades
  // into darkness before its edge, which is what sells "infinite"
  const getFog = (): [number, number] => {
    if (isMobile) return [10, 28];
    if (isLargeScreen) return [16, 42];
    return [14, 34];
  };

  const fogSettings = getFog();

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        dpr={getDpr()}
        camera={{ position: [0, 12, 16], fov: getFov(), near: 0.1, far: 100 }}
        // The hero content overlay sits above the canvas and would swallow
        // pointer events — source them from the app root so mouse parallax
        // and the cursor highlight work through it
        eventSource={document.getElementById('root') as HTMLElement}
        eventPrefix="client"
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

          {/* Faint star dust so the sky above the grid's horizon has depth
              instead of reading as dead black (same vocabulary as the 404) */}
          <Stars radius={70} depth={40} count={900} factor={2.5} saturation={0} fade speed={reduceMotion ? 0 : 0.6} />

          {/* Endless floor beneath the grid: the cells read as the lit
              portion of an infinite dark surface instead of an island in a
              void. Pillar point lights spill soft color pools onto it past
              the grid's edge; fog closes it into the horizon. */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.68, 0]}>
            <planeGeometry args={[300, 300]} />
            <meshStandardMaterial color="#080a10" metalness={0.3} roughness={0.9} />
          </mesh>

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
            pulse={pulse}
          />
          <PillarLights />
          <CameraRig />
          {onReady && <ReadyDetector onReady={onReady} />}

          {/* Bloom turns the emissive cells into neon light sources.
              Desktop only — mobile keeps the flat-lit look for performance.
              multisampling=0: MSAA on top of bloom is wasted GPU — the glow
              softens edges perceptually anyway */}
          {!isMobile && (
            <EffectComposer multisampling={0}>
              <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.38} luminanceSmoothing={0.22} radius={0.7} />
            </EffectComposer>
          )}
        </ConsoleContext.Provider>
      </Canvas>
    </div>
  );
};

export default ImmersiveScene;
