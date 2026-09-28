import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useConsole, ConsoleContext } from '../context/ConsoleContext';
import { ConsoleLane } from '../lib/types';
import { useReducedMotion } from '../hooks/useAnimations';
import { MAX_STEP, approach, rateFromLerp60, budgetDpr, CadenceMonitor } from './frame';

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

// Per-second rates, tuned as per-frame lerps at 60 fps (see frame.ts)
const SWE_SNAP_RATE = rateFromLerp60(0.08);
const CAMERA_RATE = rateFromLerp60(0.03);
const CAMERA_SETTLE_RATE = rateFromLerp60(0.1);

/** Wave sim substep ceiling. Holds the 60 fps behaviour at any frame rate. */
const WAVE_STEP = 1 / 60;

// --- FIELD SHAPE ---
// Influence extents, hoisted out of the per-cube loop.
//
// Cells stepping on and off IS the aesthetic — the shapes are meant to read as
// discrete blocks lighting as they pass, pixel-style. The one sizing rule: a
// shape must be at least one cell pitch wide. The original 0.3 arm was thinner
// than a cell, so as it slid it kept falling between rows and whole arms
// flickered. Width is expressed in pitches so it holds at every breakpoint.
const SWE_ARM_PITCHES = 1.1;
const SWE_CROSS_LENGTH = 3.8;
const ML_RADIUS = 5.5;
const VIDEO_SCAN_WIDTH = 2.0;
const MOUSE_RADIUS = 4;

/**
 * Clock rate under prefers-reduced-motion. Freezing the clock (0) parks the
 * three shapes in a permanent saturated pose — the video scan sits at centre
 * burning a blown-out white column, which looks broken, and "reduced motion
 * means fewer and gentler, not zero". The pillars are small, slow, local
 * colour drifts on a dark field, not viewport-scale motion; camera parallax
 * and click shockwaves stay curbed separately.
 */
const REDUCED_TIME_SCALE = 0.3;

/**
 * Resting colour of an untouched cell — the permanent lattice.
 *
 * This is what stops the field reading as blocks being created and deleted. If
 * an unlit cell settles to the background colour, then "lit" and "unlit" become
 * "exists" and "doesn't exist", and light crossing the grid can only look like
 * cubes blinking in and out no matter how smoothly it's ramped. Holding the
 * floor visible makes the surface permanent, so light moving over it reads as
 * illumination instead.
 *
 * Cool-tinted to sit with the palette, and well under the bloom threshold
 * (0.38) so the resting surface never glows. `edgeFade` still dissolves the
 * perimeter into the fog, so the plane keeps reading as infinite.
 */
const FLOOR_R = 0.034;
const FLOOR_G = 0.039;
const FLOOR_B = 0.055;

// --- PILLAR BEHAVIORS ---
// Each pillar represents a discipline with distinct movement patterns

// SWE: Precise, grid-snapped, architectural movement
const updateSWEPillar = (position: THREE.Vector3, time: number, dt: number): void => {
  const t = time * 0.6;

  // Quantized movement - snaps to grid intersections
  const gridStep = (CELL_SIZE + GAP) * 3;
  const targetX = Math.round(Math.sin(t * 0.7) * 8) * gridStep / 3;
  const targetZ = Math.round(Math.cos(t * 0.5) * 6) * gridStep / 3;

  // Glide to the snapped target at a per-second rate, so the step reads the
  // same at 30, 60 and 120 fps
  const k = approach(SWE_SNAP_RATE, dt);
  position.x += (targetX - position.x) * k;
  position.z += (targetZ - position.z) * k;
};

// ML: Organic, flowing, neural-network-like patterns
const updateMLPillar = (position: THREE.Vector3, time: number): void => {
  const t = time * 0.4;

  // Lissajous curves for organic wandering
  position.x = Math.sin(t * 1.3) * 6 + Math.cos(t * 0.5) * 3;
  position.z = Math.cos(t * 0.8) * 5 + Math.sin(t * 1.1) * 2;
};

// VIDEO: Linear sweep, timeline-like scanning motion
const updateVideoPillar = (position: THREE.Vector3, time: number): void => {
  const t = time * 0.35;

  // Horizontal sweep with subtle vertical drift
  position.x = Math.sin(t) * 10;
  position.z = Math.sin(t * 0.3) * 2;
};

/**
 * One clock and one set of pillar positions for the whole scene, advanced once
 * per frame by `MotionDriver` before anything reads them.
 *
 * The clock is accumulated, not read off the wall: each frame adds a clamped
 * step times `timeScale`. So flipping reduce-motion changes the *speed* of the
 * shapes instead of teleporting them (0.3 × a wall clock jumps from t=100 to
 * t=30), a paused or backgrounded scene resumes where it stopped, and the grid
 * and its lights can't drift apart because they read the same positions.
 */
interface SceneMotion {
  /** Scene time in seconds, slowed under reduced motion. */
  time: number;
  /** This frame's real step in seconds, clamped to MAX_STEP. */
  dt: number;
  /** Eases toward 1, or REDUCED_TIME_SCALE under reduced motion. */
  timeScale: number;
  swe: THREE.Vector3;
  ml: THREE.Vector3;
  video: THREE.Vector3;
}

const createSceneMotion = (): SceneMotion => ({
  time: 0,
  dt: 0,
  timeScale: 1,
  swe: new THREE.Vector3(0, 0, 0),
  ml: new THREE.Vector3(5, 0, 3),
  video: new THREE.Vector3(-5, 0, -2),
});

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
  motion: SceneMotion;
}

const InteractiveGrid: React.FC<InteractiveGridProps> = ({ focusedDiscipline, gridSize, cellSize, pulse, motion }) => {
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

  /** The grid layout the instance buffers were last seeded for. */
  const seededFor = useRef<unknown>(null);

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

  /**
   * SWE arm width in world units, pinned to the cell pitch so the sliding arm
   * always covers a full row of cells at every breakpoint (the pitch changes
   * with `cellSize`). Sub-pitch widths fall between rows and flicker.
   */
  const sweCrossWidth = useMemo(() => (cellSize + GAP) * SWE_ARM_PITCHES, [cellSize]);
  const prevMouseRef = useRef<{ x: number; z: number; init: boolean }>({ x: 0, z: 0, init: false });

  // Reduced motion slows the shared clock (MotionDriver) rather than freezing
  // it; here it only curbs the viewport-scale effects: shockwave amplitude and
  // the focus cross-fade.
  const reduceMotion = useReducedMotion();

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { time, dt: delta } = motion;
    const matrices = mesh.instanceMatrix.array as Float32Array;

    // Cells never rotate and only move in y, so each instance matrix is a
    // fixed x/z translation plus a y scale and offset. Seed the fixed parts
    // once per layout; per frame only two floats per cell change, instead of
    // composing a full matrix through an Object3D for every cube.
    if (seededFor.current !== gridData) {
      for (let i = 0; i < totalCells; i++) {
        const o = i * 16;
        matrices.fill(0, o, o + 16);
        matrices[o] = 1;
        matrices[o + 10] = 1;
        matrices[o + 15] = 1;
        matrices[o + 12] = gridData[i].x;
        matrices[o + 14] = gridData[i].z;
      }
      if (mesh.instanceColor?.count !== totalCells) {
        mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(totalCells * 3), 3);
      }
      seededFor.current = gridData;
    }
    const colors = mesh.instanceColor!.array as Float32Array;

    const swePos = motion.swe;
    const mlPos = motion.ml;
    const videoPos = motion.video;

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
      inject((pulse.nx * viewport.width) / 2, -(pulse.ny * viewport.height) / 2, -2.0 * pulseAmp, 3);
    }

    // Cursor wake: a moving pointer displaces the surface along its path
    const pm = prevMouseRef.current;
    if (pm.init) {
      const speed = Math.hypot(mouseX - pm.x, mouseZ - pm.z) / Math.max(delta, 0.001);
      if (speed > 2.5) {
        inject(mouseX, mouseZ, -Math.min(16, speed) * 0.045 * pulseAmp, 2);
      }
    }
    pm.x = mouseX;
    pm.z = mouseZ;
    pm.init = true;

    // Damped wave propagation. Substepped so a 30 fps frame runs two 60 fps
    // steps: the ripples travel at the same real speed under a power-saving
    // frame cap instead of the old single clamped step (half speed at 30).
    const substeps = Math.min(4, Math.max(1, Math.ceil(delta / WAVE_STEP - 1e-6)));
    const dtw = delta / substeps;
    const c2 = 90;
    const wDamp = Math.exp(-4.5 * dtw);
    const N = gridSize;
    for (let s = 0; s < substeps; s++) {
      for (let i = 0; i < totalCells; i++) {
        const row = (i / N) | 0, col = i % N;
        const nL = col > 0 ? wh[i - 1] : wh[i];
        const nR = col < N - 1 ? wh[i + 1] : wh[i];
        const nU = row > 0 ? wh[i - N] : wh[i];
        const nD = row < N - 1 ? wh[i + N] : wh[i];
        wv[i] = (wv[i] + ((nL + nR + nU + nD) / 4 - wh[i]) * c2 * dtw) * wDamp;
      }
      for (let i = 0; i < totalCells; i++) wh[i] += wv[i] * dtw;
    }

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

        // Manhattan cross pattern — hard-edged and architectural on purpose
        const inCross = (dSweX < sweCrossWidth && dSweZ < SWE_CROSS_LENGTH) ||
                        (dSweZ < sweCrossWidth && dSweX < SWE_CROSS_LENGTH);

        if (inCross) {
          const dist = Math.min(dSweX, dSweZ);
          const intensity = Math.max(0, 1 - dist / sweCrossWidth) * sweWeight;
          const falloff = 1 - Math.max(dSweX, dSweZ) / SWE_CROSS_LENGTH;

          ih += intensity * falloff * 1.2;
          ir += COLORS.swe.r * intensity * falloff * 0.9;
          ig += COLORS.swe.g * intensity * falloff * 0.9;
          ib += COLORS.swe.b * intensity * falloff * 0.9;
        }
      }

      // === ML INFLUENCE: Ripple/Wave Pattern ===
      if (mlWeight > 0.002) {
        const dMl = Math.sqrt((x - mlPos.x) ** 2 + (z - mlPos.z) ** 2);

        if (dMl < ML_RADIUS) {
          const wave = Math.sin(dMl * 2 - time * 4) * 0.5 + 0.5;
          // Linear cone, as originally written: it already reaches zero at the
          // radius, so it never popped — and its even falloff is what makes the
          // ripple read as organic rather than as a soft dome.
          const intensity = 1 - dMl / ML_RADIUS;
          const ml = intensity * wave * mlWeight;

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
          // pow(1.5), as originally written: already zero at the edge, and the
          // soft leading/trailing gradient is what makes the sweep read as a
          // scan pass rather than a hard bar
          const u = 1 - dVid / VIDEO_SCAN_WIDTH;
          const intensity = u * Math.sqrt(u);
          const video = intensity * zGradient * videoWeight;

          ih += video * 0.5;
          ir += COLORS.video.r * video * 0.9;
          ig += COLORS.video.g * video * 0.9;
          ib += COLORS.video.b * video * 0.9;
        }
      }

      // === MOUSE INTERACTION ===
      const dMouse = Math.sqrt((x - mouseX) ** 2 + (z - mouseZ) ** 2);
      if (dMouse < MOUSE_RADIUS) {
        const hover = 1 - dMouse / MOUSE_RADIUS;
        ih += hover * 0.6;
        // Swiss Blue accent on mouse hover
        ir += COLORS.accent.r * hover * 0.3;
        ig += COLORS.accent.g * hover * 0.3;
        ib += COLORS.accent.b * hover * 0.3;
      }

      // === TRAILS: keep the brighter of "now" and the decaying memory ===
      // Attack is instant on purpose: blocks stepping on crisply as a shape
      // arrives is the pixel look, and the permanent floor keeps the step
      // reading as "lit" rather than "created". The decay is the comet tail.
      const hT = (tH[i] = Math.max(ih, tH[i] * decay));
      const rT = (tR[i] = Math.max(ir, tR[i] * decay));
      const gT = (tG[i] = Math.max(ig, tG[i] * decay));
      const bT = (tB[i] = Math.max(ib, tB[i] * decay));

      // === WAVE FIELD: ripples lift the surface and glow accent-blue ===
      const wH = wh[idx];
      const wGlow = Math.min(0.28, Math.abs(wH) * 0.35);

      // === SUBTLE BREATHING ===
      const breathe = Math.sin(time * 0.5 + idx * 0.01) * 0.03;
      const targetY = (hT + wH * 0.6 + breathe) * edgeFade;

      // Apply position: y scale and y offset (see the seeding above)
      const o = i * 16;
      matrices[o + 5] = Math.max(0.1, 0.3 + targetY * 0.5);
      matrices[o + 13] = targetY - 0.5;

      // Apply color: permanent floor, trails + wave glow on top, everything
      // dissolving at the grid edge. Linear values, as Color.setRGB stored them.
      const c = i * 3;
      colors[c] = Math.min(1, (FLOOR_R + rT + COLORS.accent.r * wGlow) * edgeFade);
      colors[c + 1] = Math.min(1, (FLOOR_G + gT + COLORS.accent.g * wGlow) * edgeFade);
      colors[c + 2] = Math.min(1, (FLOOR_B + bT + COLORS.accent.b * wGlow) * edgeFade);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;
  });

  return (
    // The grid fills the frame from every camera pose, so culling can only
    // cost a bounding-sphere pass over every instance
    <instancedMesh ref={meshRef} args={[undefined, undefined, totalCells]} frustumCulled={false}>
      <boxGeometry args={[cellSize, 1, cellSize]} />
      <primitive object={gridMaterial} attach="material" />
    </instancedMesh>
  );
};

// --- MOTION DRIVER ---
// Quality given up, in order, when frames keep missing their beat. Motion is
// never on the list: a softer or glow-less grid that moves beats a sharp one
// that stutters.
const QUALITY_STEPS = [
  { dpr: 1, bloom: true },
  { dpr: 0.85, bloom: true },
  { dpr: 0.7, bloom: true },
  { dpr: 0.7, bloom: false },
] as const;

/**
 * Advances the shared clock and pillars once per frame, ahead of every other
 * subscriber (negative priority runs first without taking over rendering).
 * Also watches cadence: two windows in a row of frames missing their beat
 * step quality down one notch for the rest of the visit. Only down, never
 * back up, so it can't oscillate; a 30 fps power-saving cap is a steady beat
 * and never trips it.
 */
const MotionDriver: React.FC<{ motion: SceneMotion; onStruggling: () => void }> = ({ motion, onStruggling }) => {
  const reduceMotion = useReducedMotion();
  const monitor = useMemo(() => new CadenceMonitor(), []);
  const strikes = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, MAX_STEP);
    const m = motion;
    m.dt = dt;
    m.timeScale += ((reduceMotion ? REDUCED_TIME_SCALE : 1) - m.timeScale) * approach(4, dt);
    const sceneDt = dt * m.timeScale;
    m.time += sceneDt;

    updateSWEPillar(m.swe, m.time, sceneDt);
    updateMLPillar(m.ml, m.time);
    updateVideoPillar(m.video, m.time);

    const verdict = monitor.sample(delta);
    if (verdict === 'struggling') {
      if (++strikes.current >= 2) {
        strikes.current = 0;
        onStruggling();
      }
    } else if (verdict) {
      strikes.current = 0;
    }
  }, -1);

  return null;
};

// --- PILLAR LIGHTS ---
const PillarLights: React.FC<{ motion: SceneMotion }> = ({ motion }) => {
  const sweRef = useRef<THREE.PointLight>(null);
  const mlRef = useRef<THREE.PointLight>(null);
  const videoRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    sweRef.current?.position.set(motion.swe.x, 2, motion.swe.z);
    mlRef.current?.position.set(motion.ml.x, 2.5 + Math.sin(motion.time * 2) * 0.5, motion.ml.z);
    videoRef.current?.position.set(motion.video.x, 2, motion.video.z);
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
const CameraRig: React.FC<{ motion: SceneMotion }> = ({ motion }) => {
  const { camera, mouse, viewport } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 12, 16));
  const reduceMotion = useReducedMotion();

  useFrame(() => {
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
      camera.position.lerp(targetPos.current, approach(CAMERA_SETTLE_RATE, motion.dt));
      camera.lookAt(0, -1, 0);
      return;
    }

    // Slow autonomous drift keeps the scene alive without a cursor;
    // mouse parallax layers on top
    // Parallax travel kept modest so the camera never pans far enough to
    // resolve the grid's edge
    const t = motion.time;
    const targetX = mouse.x * 2.2 + Math.sin(t * 0.08) * 0.9;
    const targetY = baseY + mouse.y * 1 + Math.sin(t * 0.05) * 0.3;
    const targetZ = baseZ - mouse.y * 2 + Math.cos(t * 0.06) * 0.5;

    targetPos.current.set(targetX, targetY, targetZ);

    // Smooth camera movement
    camera.position.lerp(targetPos.current, approach(CAMERA_RATE, motion.dt));
    camera.lookAt(0, -1, 0);
  });

  return null;
};

// --- CONTEXT LOSS GUARD ---
// Without preventDefault the browser never offers a restored context, so a
// canvas that loses one (VRAM pressure, GPU reset, tab backgrounded on some
// drivers) stays dead for the rest of the session.
const ContextGuard: React.FC<{ onLost: () => void }> = ({ onLost }) => {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      console.warn('[ImmersiveScene] WebGL context lost — remounting the canvas');
      onLost();
    };
    canvas.addEventListener('webglcontextlost', handleLost);
    return () => canvas.removeEventListener('webglcontextlost', handleLost);
  }, [gl, onLost]);

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
  // Rounded to 64px steps so a drag-resize doesn't re-render (and reallocate
  // the framebuffer) on every pixel. Seeded from the real width so the grid is
  // built at its final size once, instead of mounting at 40² and rebuilding.
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1280 : Math.round(window.innerWidth / 64) * 64
  );
  const [canvasKey, setCanvasKey] = useState(0);
  const reduceMotion = useReducedMotion();
  // Outlives canvas remounts (context loss), so a fresh canvas picks the
  // shapes up where the old one left them
  const [motion] = useState(createSceneMotion);
  const [qualityStep, setQualityStep] = useState(0);
  const quality = QUALITY_STEPS[qualityStep];

  const handleStruggling = useCallback(() => {
    setQualityStep((step) => Math.min(step + 1, QUALITY_STEPS.length - 1));
  }, []);

  // Say so out loud: from the outside, a deliberately softened scene and a
  // rendering bug look alike
  useEffect(() => {
    if (qualityStep === 0) return;
    console.info(
      `[ImmersiveScene] frames are missing their beat — ${
        quality.bloom ? `rendering at ${Math.round(quality.dpr * 100)}% resolution` : 'dropping the glow pass'
      } to keep the motion smooth`
    );
  }, [qualityStep, quality]);

  // The terminal easter egg covers the hero with its own full-screen shader.
  // Two WebGL loops for one visible scene is the worst case on a battery, so
  // the hidden one stops drawing; the accumulated clock resumes it in place.
  const paused = consoleCtx.isEasterEggActive;

  // Detect screen size for responsive 3D rendering
  useEffect(() => {
    const onResize = () => setViewportWidth(Math.round(window.innerWidth / 64) * 64);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // A lost context leaves a dead canvas on screen — the hero looks frozen and
  // never recovers. Remount to acquire a fresh one.
  const handleContextLost = useCallback(() => {
    setTimeout(() => setCanvasKey((k) => k + 1), 300);
  }, []);

  const screenSize = getScreenSize(viewportWidth);
  const config = getGridConfig(screenSize);
  const isMobile = screenSize === 'mobile';
  const isLargeScreen = screenSize === 'large' || screenSize === 'ultrawide';

  /**
   * Device pixel ratio, capped by a *rendered width* budget rather than a flat
   * ratio (see budgetDpr: a lost context or single-digit FPS both read as the
   * hero being frozen), then scaled by the cadence governor. On a high-density
   * panel the glow aesthetic carries the softness anyway.
   */
  const dpr = useMemo(
    () => Math.max(0.5, budgetDpr(viewportWidth, isMobile) * quality.dpr),
    [isMobile, viewportWidth, quality.dpr]
  );

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
        key={canvasKey}
        dpr={dpr}
        frameloop={paused ? 'never' : 'always'}
        camera={{ position: [0, 12, 16], fov: getFov(), near: 0.1, far: 100 }}
        // The hero content overlay sits above the canvas and would swallow
        // pointer events — source them from the app root so mouse parallax
        // and the cursor highlight work through it
        eventSource={document.getElementById('root') as HTMLElement}
        eventPrefix="client"
        gl={{
          // EffectComposer renders the scene into its own target, so the
          // canvas's MSAA buffer is allocated but never sampled — pure cost,
          // and at 1440p+ a large chunk of VRAM. Mobile never had it either.
          antialias: false,
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

          <MotionDriver motion={motion} onStruggling={handleStruggling} />
          <InteractiveGrid
            focusedDiscipline={consoleCtx.focusedDiscipline}
            gridSize={config.gridSize}
            cellSize={config.cellSize}
            pulse={pulse}
            motion={motion}
          />
          <PillarLights motion={motion} />
          <CameraRig motion={motion} />
          <ContextGuard onLost={handleContextLost} />
          {onReady && <ReadyDetector onReady={onReady} />}

          {/* Bloom turns the emissive cells into neon light sources.
              Desktop only — mobile keeps the flat-lit look for performance.
              multisampling=0: MSAA on top of bloom is wasted GPU — the glow
              softens edges perceptually anyway */}
          {!isMobile && quality.bloom && (
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
