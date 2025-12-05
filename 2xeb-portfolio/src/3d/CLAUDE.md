# 3D Directory - CLAUDE.md

This directory contains React Three Fiber (R3F) 3D scene components for the portfolio.

## Files

### ImmersiveScene.tsx (Primary - Home Page)
Full-screen immersive 3D visualization with three discipline "pillars":

**Visual Concept:**
- 40x40 grid of interactive cells (24x24 on mobile)
- Each cell responds to three moving "agents" representing disciplines
- Mouse interaction creates a Swiss Blue accent highlight

**Three Pillars:**
| Pillar | Discipline | Color | Movement Pattern |
|--------|------------|-------|------------------|
| SWE | CODE | #06B6D4 (Cyan) | Grid-snapped cross pattern, architectural |
| ML | VISION | #84CC16 (Lime) | Organic Lissajous curves, neural-like |
| VIDEO | DESIGN | #F59E0B (Amber) | Linear sweep, timeline-like |

**Performance Optimizations:**
- `InstancedMesh` for all grid cells (single draw call)
- Reusable THREE objects (`_dummy`, `_color`, `_vec3`) to avoid GC
- Responsive grid size (smaller on mobile)
- Reduced DPR and disabled antialiasing on mobile
- Pre-computed grid positions in `useMemo`

**Responsive Behavior:**
```typescript
const getGridConfig = (isMobile: boolean) => ({
  gridSize: isMobile ? 24 : 40,  // 576 vs 1600 cells
  cellSize: isMobile ? 0.6 : 0.5,
  gap: 0.08,
});
```

### SystemConsoleScene.tsx (Secondary - Project Browser)
Isometric 3D view for browsing projects organized by discipline lanes.

**Features:**
- Orthographic camera at isometric angle
- Three horizontal lanes: DESIGN, CODE, VISION
- `InstancedMesh` for project modules
- Pre-computed connection geometry
- Text labels using @react-three/drei Text

**Performance Optimizations:**
- `isNodeHighlighted()` uses Set for O(1) lookup
- Pre-computed `connectionPoints` array
- Memoized dummy/color objects

### OrbitScene.tsx (Background)
Animated background grid used on secondary pages (Contact, etc.).

## Performance Patterns

### DO:
```typescript
// Reuse objects outside component
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

// Use Set for lookups
const isNodeHighlighted = (id: string) => highlightedSet.has(id);

// Pre-compute static data
const gridData = useMemo(() => [...], [deps]);
```

### DON'T:
```typescript
// Don't allocate in useFrame
useFrame(() => {
  const vec = new THREE.Vector3(); // BAD - GC pressure
});

// Don't use Array.includes in hot paths
highlightedNodeIds.includes(id); // O(n) - use Set.has()
```

## Context Integration

All scenes consume `ConsoleContext` for shared state:
```typescript
const {
  hoveredNodeId,
  focusedDiscipline,
  isNodeHighlighted,  // O(1) Set lookup
  setHighlightedNodeIds
} = useConsole();
```

Context must be re-provided inside Canvas:
```tsx
<Canvas>
  <ConsoleContext.Provider value={consoleCtx}>
    {/* R3F components */}
  </ConsoleContext.Provider>
</Canvas>
```

## Mobile Considerations

- Grid size reduced: 40x40 -> 24x24 (1600 -> 576 cells)
- DPR capped at 1 on mobile
- Antialiasing disabled on mobile
- Wider FOV (55 vs 45) for better viewing
- Tighter fog for performance
