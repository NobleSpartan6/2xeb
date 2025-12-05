import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, useCursor, OrthographicCamera, Environment } from '@react-three/drei';
import { GRAPH_DATA, COLORS } from '../data';
import { ConsoleLane, GraphNode } from '../lib/types';
import { useConsole, ConsoleContext } from '../context/ConsoleContext';
import { useNavigate } from 'react-router-dom';

// --- GEOMETRY CONSTANTS ---
const MODULE_WIDTH = 2.0;
const MODULE_HEIGHT = 0.15;
const MODULE_DEPTH = 1.2;

const NodeLabel: React.FC<{ node: GraphNode; laneColor: string }> = ({ node, laneColor }) => {
  const { hoveredNodeId, focusedDiscipline, isNodeHighlighted } = useConsole();
  const isHovered = hoveredNodeId === node.id;
  const isHighlighted = isNodeHighlighted(node.id);
  const isLaneActive = focusedDiscipline === node.lane || focusedDiscipline === null;
  
  // Always show if hovered or highlighted, otherwise only if lane is active
  const isVisible = isHovered || isHighlighted || isLaneActive;

  return (
    <Text
      position={[node.x, 0.6, node.z + MODULE_DEPTH/2 + 0.2]}
      fontSize={0.2}
      color={isHovered || isHighlighted ? '#ffffff' : laneColor}
      anchorX="center"
      anchorY="middle"
      font="https://fonts.gstatic.com/s/jetbrainsmono/v13/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0Pn5.ttf"
      fillOpacity={isVisible ? 1 : 0}
      visible={isVisible}
    >
      {node.label.toUpperCase()} {node.project.isExternal ? "↗" : ""}
    </Text>
  )
}

const LaneModules = ({ lane, onNavigate }: { lane: ConsoleLane, onNavigate: (path: string) => void }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { hoveredNodeId, setHoveredNodeId, focusedDiscipline, isNodeHighlighted } = useConsole();
  const nodes = useMemo(() => GRAPH_DATA.nodes.filter(n => n.lane === lane), [lane]);
  
  // Helper object for positioning
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  // Determine base color for this lane
  const laneColorHex = 
    lane === ConsoleLane.DESIGN ? COLORS.design :
    lane === ConsoleLane.CODE ? COLORS.code :
    COLORS.vision;
  const laneColor = new THREE.Color(laneColorHex);

  useCursor(!!hoveredNodeId);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    nodes.forEach((node, i) => {
      const isHovered = hoveredNodeId === node.id;
      const isHighlighted = isNodeHighlighted(node.id);
      const isLaneFocused = focusedDiscipline === lane || focusedDiscipline === null;
      
      // Check if we should dim this node (because another lane is focused)
      const isDimmed = !isLaneFocused && !isHighlighted;

      // POSITION
      let y = isHovered || isHighlighted ? 0.5 : 0;
      
      // Gentle float animation
      y += Math.sin(time * 1.5 + node.x) * 0.05;

      dummy.position.set(node.x, y, node.z);
      dummy.rotation.set(0, 0, 0);
      
      // Interaction Rotation
      if (isHovered) {
        dummy.rotation.x = -0.1; // Tilt up towards camera
        dummy.scale.setScalar(1.1);
      } else {
        dummy.scale.setScalar(1.0);
      }

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // COLOR
      if (isDimmed) {
        color.set('#1a1a1a'); // Dimmed but visible
      } else {
        // Base color for the block
        color.set('#2a2a2a'); 
        
        // Pulse/Highlight logic
        if (isHovered || isHighlighted) {
           const pulse = isHighlighted ? (Math.sin(time * 8) * 0.5 + 0.5) : 1.0;
           // Tint with lane color
           color.lerp(laneColor, 0.3 * pulse);
        }
      }
      meshRef.current!.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  if (nodes.length === 0) return null;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const node = nodes[e.instanceId];
    if (node.project.isExternal && node.project.externalUrl) {
       window.open(node.project.externalUrl, '_blank');
    } else {
       onNavigate(`/work/${node.id}`);
    }
  };

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, nodes.length]}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) {
            setHoveredNodeId(nodes[e.instanceId].id);
          }
        }}
        onPointerOut={(e) => {
          setHoveredNodeId(null);
        }}
        onClick={handleClick}
      >
        <boxGeometry args={[MODULE_WIDTH, MODULE_HEIGHT, MODULE_DEPTH]} />
        <meshPhysicalMaterial 
          roughness={0.3} 
          metalness={0.6}
          clearcoat={0.5}
          clearcoatRoughness={0.1}
          color="#ffffff" // Base color white to allow instanceColor tinting
        />
      </instancedMesh>
      
      {/* TEXT LABELS */}
      {nodes.map((node) => (
         <NodeLabel key={node.id} node={node} laneColor={laneColorHex} />
      ))}
    </group>
  );
};

// Pre-computed connection points to avoid per-frame allocations
const connectionPoints = GRAPH_DATA.edges.map(edge => {
  const sourceNode = GRAPH_DATA.nodes.find(n => n.id === edge.source);
  const targetNode = GRAPH_DATA.nodes.find(n => n.id === edge.target);
  if (!sourceNode || !targetNode) return null;
  return {
    edge,
    sourceNode,
    targetNode,
    points: [
      new THREE.Vector3(sourceNode.x, -0.1, sourceNode.z),
      new THREE.Vector3(sourceNode.x, -0.1, (sourceNode.z + targetNode.z) / 2),
      new THREE.Vector3(targetNode.x, -0.1, (sourceNode.z + targetNode.z) / 2),
      new THREE.Vector3(targetNode.x, -0.1, targetNode.z)
    ]
  };
}).filter(Boolean);

// Simplified connection renderer with pre-computed geometry
const SimpleConnections = () => {
    const { isNodeHighlighted, focusedDiscipline } = useConsole();

    return (
        <group>
            {connectionPoints.map((conn, i) => {
                if (!conn) return null;
                const { sourceNode, targetNode, points } = conn;

                const isHighlighted = isNodeHighlighted(sourceNode.id) || isNodeHighlighted(targetNode.id);
                const isDimmed = focusedDiscipline && (sourceNode.lane !== focusedDiscipline && targetNode.lane !== focusedDiscipline) && !isHighlighted;

                if (isDimmed) return null;

                const color = isHighlighted ? '#FFFFFF' : '#444444';
                const opacity = isHighlighted ? 0.8 : 0.4;

                return (
                    <line key={i}>
                        <bufferGeometry setFromPoints={points} />
                        <lineBasicMaterial color={color} transparent opacity={opacity} linewidth={2} />
                    </line>
                )
            })}
        </group>
    )
}


const SystemConsoleScene: React.FC = () => {
  // Bridge the context from outside the Canvas to inside
  const navigate = useNavigate();
  const consoleCtx = useConsole();

  return (
    <div className="w-full h-full absolute inset-0 bg-[#050505]">
      <Canvas
        dpr={[1, 2]}
        gl={{ 
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.5
        }}
      >
        <ConsoleContext.Provider value={consoleCtx}>
            <OrthographicCamera 
                makeDefault 
                position={[20, 20, 20]} 
                zoom={40} 
                near={-100} 
                far={200}
                onUpdate={c => c.lookAt(0, 0, 0)}
            />
            
            <color attach="background" args={['#050505']} />
            
            {/* Lighting */}
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 20, 5]} intensity={2} color="#ffffff" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#2563EB" />
            
            <group position={[0, -1, 0]} rotation={[0, Math.PI / 4, 0]}>
                {/* The "Board" Grid */}
                <gridHelper args={[40, 40, '#222222', '#111111']} position={[0, -0.2, 0]} />
                
                <LaneModules lane={ConsoleLane.DESIGN} onNavigate={(path) => navigate(path)} />
                <LaneModules lane={ConsoleLane.VISION} onNavigate={(path) => navigate(path)} />
                <LaneModules lane={ConsoleLane.CODE} onNavigate={(path) => navigate(path)} />
                
                <SimpleConnections />
            </group>
        </ConsoleContext.Provider>
      </Canvas>
    </div>
  );
};

export default SystemConsoleScene;