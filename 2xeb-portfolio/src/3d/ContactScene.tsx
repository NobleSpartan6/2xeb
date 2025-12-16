import React, { useRef, useMemo, useEffect, Suspense, useState, createContext, useContext } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Colors matching design system
const COLORS = {
  bg: '#050505',
  primary: new THREE.Color('#2563EB'),    // Swiss Blue - primary for contact
  secondary: new THREE.Color('#06B6D4'),  // Cyan accent
  success: new THREE.Color('#22c55e'),    // Green for success
  dim: new THREE.Color('#0a0a0a'),
};

// Reusable objects to avoid GC
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

// Responsive config
const getGridConfig = (isMobile: boolean) => ({
  gridSize: isMobile ? 28 : 44,
  cellSize: isMobile ? 0.5 : 0.45,
  gap: 0.08,
});

// ============================================================================
// Interaction Context - Shared state between React and Three.js
// ============================================================================
interface InteractionState {
  focusedField: string | null;
  isSubmitting: boolean;
  isSuccess: boolean;
  triggerPulse: number; // timestamp to trigger pulse
}

const InteractionContext = createContext<InteractionState>({
  focusedField: null,
  isSubmitting: false,
  isSuccess: false,
  triggerPulse: 0,
});

// ============================================================================
// Interactive Grid - Responds to form interactions
// ============================================================================
interface ContactGridProps {
  isMobile: boolean;
}

const ContactGrid: React.FC<ContactGridProps> = ({ isMobile }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { mouse, viewport } = useThree();
  const interaction = useContext(InteractionContext);
  const config = getGridConfig(isMobile);
  const { gridSize, cellSize, gap } = config;
  const totalCells = gridSize * gridSize;

  // Pulse states
  const pulsesRef = useRef<Array<{ radius: number; startTime: number; color: THREE.Color }>>([]);
  const lastTriggerRef = useRef(0);

  // Pre-compute grid positions
  const gridData = useMemo(() => {
    const data: { x: number; z: number; idx: number; distFromCenter: number }[] = [];
    const offset = (gridSize * (cellSize + gap)) / 2;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = i * (cellSize + gap) - offset;
        const z = j * (cellSize + gap) - offset;
        data.push({
          x,
          z,
          idx: i * gridSize + j,
          distFromCenter: Math.sqrt(x * x + z * z),
        });
      }
    }
    return data;
  }, [gridSize, cellSize, gap]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    // Add new pulse when triggered
    if (interaction.triggerPulse > lastTriggerRef.current) {
      lastTriggerRef.current = interaction.triggerPulse;
      const pulseColor = interaction.isSuccess ? COLORS.success : COLORS.primary;
      pulsesRef.current.push({ radius: 0, startTime: time, color: pulseColor.clone() });
    }

    // Update pulses
    pulsesRef.current = pulsesRef.current.filter(pulse => {
      pulse.radius = (time - pulse.startTime) * (interaction.isSubmitting ? 4 : 3);
      return pulse.radius < 25; // Remove when expanded beyond grid
    });

    // Add continuous subtle pulse when submitting
    if (interaction.isSubmitting) {
      const submitPulseRadius = ((time * 5) % 15);
      if (pulsesRef.current.length < 3) {
        // Keep adding pulses while submitting
        const existing = pulsesRef.current.find(p => Math.abs(p.radius - submitPulseRadius) < 2);
        if (!existing && submitPulseRadius < 1) {
          pulsesRef.current.push({ radius: 0, startTime: time, color: COLORS.secondary.clone() });
        }
      }
    }

    // Mouse position in world space
    const mouseX = (mouse.x * viewport.width) / 2;
    const mouseZ = -(mouse.y * viewport.height) / 2;

    // Determine active color based on state
    const activeColor = interaction.isSuccess ? COLORS.success :
                        interaction.isSubmitting ? COLORS.secondary :
                        COLORS.primary;

    for (let i = 0; i < totalCells; i++) {
      const { x, z, idx, distFromCenter } = gridData[i];
      let targetY = 0;
      let r = 0.02, g = 0.02, b = 0.02; // Base dark

      // === PULSE WAVES ===
      for (const pulse of pulsesRef.current) {
        const pulseWidth = interaction.isSubmitting ? 3 : 2.5;
        const pulseDist = Math.abs(distFromCenter - pulse.radius);

        if (pulseDist < pulseWidth) {
          const intensity = Math.pow(1 - pulseDist / pulseWidth, 2);
          const fade = Math.max(0, 1 - pulse.radius / 20);

          targetY += intensity * fade * 1.0;
          r += pulse.color.r * intensity * fade * 0.8;
          g += pulse.color.g * intensity * fade * 0.8;
          b += pulse.color.b * intensity * fade * 0.8;
        }
      }

      // === FORM FOCUS EFFECT ===
      if (interaction.focusedField) {
        // Create a gentle wave pattern when focused
        const focusWave = Math.sin(distFromCenter * 0.5 - time * 2) * 0.5 + 0.5;
        const focusIntensity = Math.max(0, 1 - distFromCenter / 12) * focusWave * 0.3;

        targetY += focusIntensity * 0.4;
        r += activeColor.r * focusIntensity * 0.4;
        g += activeColor.g * focusIntensity * 0.4;
        b += activeColor.b * focusIntensity * 0.4;
      }

      // === SUCCESS CELEBRATION ===
      if (interaction.isSuccess) {
        const celebrationWave = Math.sin(distFromCenter * 0.8 - time * 3) * 0.5 + 0.5;
        const celebrationIntensity = celebrationWave * 0.25;

        targetY += celebrationIntensity * 0.5;
        r += COLORS.success.r * celebrationIntensity * 0.5;
        g += COLORS.success.g * celebrationIntensity * 0.5;
        b += COLORS.success.b * celebrationIntensity * 0.5;
      }

      // === MOUSE INTERACTION ===
      const dMouse = Math.sqrt((x - mouseX) ** 2 + (z - mouseZ) ** 2);
      const mouseRadius = isMobile ? 3.5 : 5;
      if (dMouse < mouseRadius) {
        const intensity = Math.pow(1 - dMouse / mouseRadius, 1.5);
        targetY += intensity * 0.9;
        r += activeColor.r * intensity * 0.6;
        g += activeColor.g * intensity * 0.6;
        b += activeColor.b * intensity * 0.6;
      }

      // === AMBIENT BREATHING ===
      // Gentle wave that moves across the grid
      const breatheWave = Math.sin(time * 0.8 + x * 0.3 + z * 0.3) * 0.5 + 0.5;
      const breathe = breatheWave * 0.12 + Math.sin(time * 0.5) * 0.05;
      targetY += breathe;

      // Add subtle color breathing
      const colorBreath = Math.sin(time * 0.6 + distFromCenter * 0.1) * 0.5 + 0.5;
      r += 0.015 * colorBreath;
      g += 0.015 * colorBreath;
      b += 0.025 * colorBreath;

      // Apply position with smoothing
      _dummy.position.set(x, targetY - 0.5, z);
      _dummy.scale.set(1, Math.max(0.1, 0.2 + targetY * 0.5), 1);
      _dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _dummy.matrix);

      // Apply color
      _color.setRGB(Math.min(1, r), Math.min(1, g), Math.min(1, b));
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
      <meshStandardMaterial metalness={0.7} roughness={0.3} envMapIntensity={0.5} />
    </instancedMesh>
  );
};

// ============================================================================
// Camera Rig - Smooth parallax
// ============================================================================
const CameraRig: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const { camera, mouse } = useThree();
  const targetPos = useRef(new THREE.Vector3());

  useFrame(() => {
    const baseY = isMobile ? 10 : 12;
    const baseZ = isMobile ? 14 : 16;

    const targetX = mouse.x * 2;
    const targetY = baseY + mouse.y * 0.8;
    const targetZ = baseZ - mouse.y * 1.5;

    targetPos.current.set(targetX, targetY, targetZ);
    camera.position.lerp(targetPos.current, 0.03);
    camera.lookAt(0, -1, 0);
  });

  return null;
};

// ============================================================================
// Scene
// ============================================================================
const Scene: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const interaction = useContext(InteractionContext);

  return (
    <>
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', isMobile ? 10 : 15, isMobile ? 28 : 38]} />

      {/* Ambient lighting */}
      <ambientLight intensity={0.15} />

      {/* Main directional light */}
      <directionalLight position={[10, 15, 5]} intensity={0.4} color="#ffffff" />

      {/* Accent light from center - changes color based on state */}
      <pointLight
        position={[0, 3, 0]}
        intensity={interaction.isSuccess ? 3 : interaction.isSubmitting ? 2.5 : 2}
        color={interaction.isSuccess ? '#22c55e' : interaction.isSubmitting ? '#06B6D4' : '#2563EB'}
        distance={15}
        decay={2}
      />

      {/* Secondary accent */}
      <pointLight position={[0, -5, 0]} intensity={0.3} color="#2563EB" />

      <ContactGrid isMobile={isMobile} />
      <CameraRig isMobile={isMobile} />
    </>
  );
};

// ============================================================================
// Export
// ============================================================================
interface ContactSceneProps {
  focusedField?: string | null;
  isSubmitting?: boolean;
  isSuccess?: boolean;
  triggerPulse?: number;
}

const ContactScene: React.FC<ContactSceneProps> = ({
  focusedField = null,
  isSubmitting = false,
  isSuccess = false,
  triggerPulse = 0,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const interactionState: InteractionState = {
    focusedField,
    isSubmitting,
    isSuccess,
    triggerPulse,
  };

  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        camera={{ position: [0, 12, 16], fov: isMobile ? 55 : 45, near: 0.1, far: 100 }}
        gl={{
          antialias: !isMobile,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          powerPreference: 'high-performance',
        }}
      >
        <InteractionContext.Provider value={interactionState}>
          <Suspense fallback={null}>
            <Scene isMobile={isMobile} />
          </Suspense>
        </InteractionContext.Provider>
      </Canvas>
    </div>
  );
};

export default ContactScene;
