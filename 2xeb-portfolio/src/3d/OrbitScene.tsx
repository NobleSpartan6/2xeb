import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '../data';

// --- CONFIGURATION ---
// A wider, dense grid for a landscape feel
const GRID_X = 32;
const GRID_Z = 24;
const TILE_SIZE = 0.6;
const GAP = 0.2; // Slightly larger gap for "Swiss" separation
const TOTAL_TILES = GRID_X * GRID_Z;

// --- REUSABLE OBJECTS ---
// avoid garbage collection in the render loop
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _targetColor = new THREE.Color();

// --- AGENT BEHAVIORS ---

// SWE: The Architect (Blue)
// Behavior: Discrete, grid-snapped movement. Logic and Structure.
const updateSWE = (ref: React.MutableRefObject<THREE.Group | null>, time: number) => {
  if (!ref.current) return { x: 0, z: 0 };
  
  // Quantized movement logic
  const speed = 0.8;
  const t = time * speed;
  
  // Calculate target grid coordinates
  const targetX = Math.round(Math.sin(t) * 10) * (TILE_SIZE + GAP);
  const targetZ = Math.round(Math.cos(t * 0.7) * 6) * (TILE_SIZE + GAP);
  
  // Smoothly slide to the quantized position (like a cursor)
  ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, targetX, 0.15);
  ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, targetZ, 0.15);
  ref.current.position.y = 2.0;

  return { x: ref.current.position.x, z: ref.current.position.z };
};

// ML: The Network (Violet)
// Behavior: Smooth, organic, chaotic orbiting. Data and Flow.
const updateML = (ref: React.MutableRefObject<THREE.Group | null>, time: number) => {
  if (!ref.current) return { x: 0, z: 0 };
  
  const speed = 0.5;
  // Lissajous curve for organic wandering
  const x = Math.sin(time * speed * 1.3) * 8 + Math.cos(time * speed * 0.5) * 4;
  const z = Math.cos(time * speed * 0.8) * 5 + Math.sin(time * speed * 1.5) * 2;
  
  ref.current.position.x = x;
  ref.current.position.z = z;
  ref.current.position.y = 2.5 + Math.sin(time * 2) * 0.5;

  return { x: x, z: z };
};

// VIDEO: The Scanner (Cyan)
// Behavior: Linear sweep. Time and Rendering.
const updateVideo = (ref: React.MutableRefObject<THREE.Group | null>, time: number) => {
  if (!ref.current) return { x: 0, z: 0 };
  
  const speed = 0.4;
  const range = 12;
  // Simple harmonic motion on X axis (Left <-> Right scan)
  const x = Math.sin(time * speed) * range;
  
  ref.current.position.x = x;
  ref.current.position.z = 0; // Stays centered on Z
  ref.current.position.y = 2.0;

  return { x: x, z: 0 };
};

const LogicFloor = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Agent Refs (Visuals + Lights)
  const sweRef = useRef<THREE.Group>(null);
  const mlRef = useRef<THREE.Group>(null);
  const videoRef = useRef<THREE.Group>(null);

  const { mouse, viewport } = useThree();

  // Initial Grid Setup
  const initialData = useMemo(() => {
    const data = [];
    const offsetX = (GRID_X * (TILE_SIZE + GAP)) / 2;
    const offsetZ = (GRID_Z * (TILE_SIZE + GAP)) / 2;
    
    for (let i = 0; i < GRID_X; i++) {
      for (let j = 0; j < GRID_Z; j++) {
        data.push({
          x: i * (TILE_SIZE + GAP) - offsetX,
          z: j * (TILE_SIZE + GAP) - offsetZ,
          baseY: -2,
          id: Math.random() // For phase offsets
        });
      }
    }
    return data;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    // Update Agent Positions
    const swePos = updateSWE(sweRef, time);
    const mlPos = updateML(mlRef, time);
    const videoPos = updateVideo(videoRef, time);

    // Interactive: Mouse Parallax & Influence
    // Project 2D mouse to rough 3D position
    const mouseX = (mouse.x * viewport.width) / 2;
    const mouseZ = -(mouse.y * viewport.height) / 2;

    // Loop through every tile to update Position and Color
    for (let i = 0; i < TOTAL_TILES; i++) {
      const { x, z, baseY, id } = initialData[i];
      let targetY = baseY;
      
      // Accumulate color channels based on influence
      let r = 0.05, g = 0.05, b = 0.05; // Base dark grey

      // --- INTERACTION LOGIC ---

      // 1. SWE Influence (Structure)
      // Logic: Raises blocks in a rigid "Manhattan" cross shape from the agent
      const dSweX = Math.abs(x - swePos.x);
      const dSweZ = Math.abs(z - swePos.z);
      // Determine if within the "cross" cursor
      const isCross = (dSweX < 0.4 && dSweZ < 4) || (dSweZ < 0.4 && dSweX < 4);
      
      if (isCross) {
        // Lift logic
        const dist = Math.max(dSweX, dSweZ);
        targetY += (1.5 - dist * 0.3);
        
        // Color: Swiss Blue (#2563EB) -> RGB: 0.14, 0.38, 0.92
        const intensity = Math.max(0, 1 - dist/4);
        r += 0.14 * intensity;
        g += 0.38 * intensity;
        b += 0.92 * intensity;
      }

      // 2. ML Influence (Organic)
      // Logic: Creates a smooth sine-wave ripple around the agent
      const dMl = Math.sqrt(Math.pow(x - mlPos.x, 2) + Math.pow(z - mlPos.z, 2));
      const mlRadius = 5.0;
      if (dMl < mlRadius) {
        const intensity = 1 - (dMl / mlRadius);
        // Wave equation
        targetY += Math.sin(dMl * 1.5 - time * 3) * 0.6 * intensity;
        
        // Color: Violet/Indigo (#7C3AED) -> RGB: 0.48, 0.22, 0.92
        r += 0.48 * intensity * 0.8;
        g += 0.22 * intensity * 0.8;
        b += 0.92 * intensity * 0.8;
      }

      // 3. Video Influence (Scanner)
      // Logic: Illuminates a "Scan line" (Z-axis band) that moves with X
      const dVid = Math.abs(x - videoPos.x);
      const vidWidth = 2.5;
      if (dVid < vidWidth) {
        const intensity = Math.pow(1 - dVid/vidWidth, 2); // Sharp falloff
        targetY += intensity * 0.4; // Slight raise
        
        // Color: Cyan (#06B6D4) -> RGB: 0.02, 0.71, 0.83
        r += 0.02 * intensity;
        g += 0.71 * intensity;
        b += 0.83 * intensity;
      }

      // 4. Mouse Hover (The "Touch")
      const dMouse = Math.sqrt(Math.pow(x - mouseX, 2) + Math.pow(z - mouseZ, 2));
      if (dMouse < 6) {
        targetY += (6 - dMouse) * 0.15;
        // White highlight
        r += 0.1 * (6 - dMouse)/6;
        g += 0.1 * (6 - dMouse)/6;
        b += 0.1 * (6 - dMouse)/6;
      }

      // Idle "Breathing"
      targetY += Math.sin(time * 0.8 + id * 10) * 0.05;

      // --- APPLY UPDATES ---
      _dummy.position.set(x, targetY, z);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _dummy.matrix);

      _targetColor.setRGB(r, g, b);
      meshRef.current.setColorAt(i, _targetColor);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
      {/* AGENT MARKERS (Invisible or minimal, primarily logic/light sources) */}
      <group ref={sweRef}>
        <pointLight color={COLORS.swe} distance={6} intensity={4} decay={2} />
      </group>
      <group ref={mlRef}>
        <pointLight color={COLORS.ml} distance={6} intensity={4} decay={2} />
      </group>
      <group ref={videoRef}>
        <pointLight color={COLORS.video} distance={8} intensity={4} decay={2} />
      </group>

      {/* THE GRID */}
      <instancedMesh 
        ref={meshRef} 
        args={[undefined, undefined, TOTAL_TILES]}
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[TILE_SIZE, 1.5, TILE_SIZE]} />
        <meshPhysicalMaterial 
          color="#050505"
          metalness={0.8}
          roughness={0.2}
          clearcoat={0.5}
          reflectivity={0.5}
        />
      </instancedMesh>
    </>
  );
};

const BackgroundEnvironment = () => {
  // A subtle static dot grid for background depth
  const points = useMemo(() => {
    const p = [];
    for(let x = -30; x <= 30; x+=2) {
      for(let z = -15; z <= 15; z+=2) {
        if (Math.random() > 0.8) continue; // Sparse
        p.push(x * 2, -5 + Math.random() * 2, z * 2 - 10);
      }
    }
    return new Float32Array(p);
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          count={points.length / 3} 
          array={points} 
          itemSize={3} 
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#333" sizeAttenuation transparent opacity={0.4} />
    </points>
  )
}

const CameraRig = () => {
  const { camera, mouse } = useThree();
  
  useFrame(() => {
    // Parallax effect
    const targetX = mouse.x * 1.5;
    const targetY = mouse.y * 0.5 + 16; // Camera height
    const targetZ = 14 + mouse.y * 2;

    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.y += (targetY - camera.position.y) * 0.02;
    camera.position.z += (targetZ - camera.position.z) * 0.02;
    camera.lookAt(0, -2, 0);
  });

  return null;
}

const OrbitScene: React.FC = () => {
  return (
    <div className="w-full h-full absolute inset-0 bg-[#020202]">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 16, 14], fov: 35 }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0
        }}
      >
        <fog attach="fog" args={['#020202', 12, 35]} />
        
        {/* Base ambient for visibility */}
        <ambientLight intensity={0.15} color="#ffffff" />
        
        {/* Main Directional for shadows */}
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={0.5} 
          color="#ffffff" 
          castShadow 
        />

        <BackgroundEnvironment />
        <LogicFloor />
        <CameraRig />
      </Canvas>
    </div>
  );
};

export default OrbitScene;