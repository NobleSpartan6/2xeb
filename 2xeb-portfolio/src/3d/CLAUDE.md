# 3D Directory - CLAUDE.md

This directory contains React Three Fiber (R3F) 3D scene components for the portfolio.

## Files

### ImmersiveScene.tsx (Home Page)
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
- Reusable THREE objects (`_dummy`, `_color`) to avoid GC
- Responsive grid size (smaller on mobile)
- Reduced DPR and disabled antialiasing on mobile
- Pre-computed grid positions in `useMemo`

**The floor is permanent (`FLOOR_R/G/B`):**
An unlit cell must never settle to the background colour. If it does, "lit" and
"unlit" become "exists" and "doesn't exist", and light crossing the grid reads as
cubes being created and deleted — no amount of easing fixes that, because the
endpoint itself is invisible. The resting level sits below the bloom threshold
(`0.38`) so the floor never glows, and `edgeFade` + fog still dissolve the
perimeter, so the plane keeps reading as infinite. Don't darken the floor to the
background to "restore contrast"; dim the *lit* contributions instead.

**Attack is instant, exit decays — don't smooth the attack:**
Blocks stepping on crisply as a shape passes is the pixel aesthetic; the
permanent floor is what keeps that step reading as "lit" rather than "created".
Trails (`decay`) carry the exit as a comet tail. A rise ramp on the way in was
tried and it killed the sense of motion — the shapes stopped reading as blocks
moving. Don't reintroduce one, and don't swap the pillars' falloff curves for a
shared smooth falloff: the cross is hard-edged, ML is a linear cone, VIDEO is
pow(1.5), and those distinct characters are the design.

Two real rules:
- Shapes must be at least one cell pitch wide (`SWE_ARM_PITCHES` keeps the
  cross arm at 1.1 pitches). A sub-pitch feature falls between cell rows as it
  slides and whole arms flicker — that DOES read as broken
- Discipline focus ramps `focusWeights` instead of flipping booleans, so
  hovering CODE cross-fades the other two out instead of dropping two thirds
  of the field's light in one frame

**Reduced motion slows the clock, never freezes it (`REDUCED_TIME_SCALE`):**
Freezing `time` at 0 parks the shapes in a permanent saturated pose — the
video scan sits at centre burning a blown-out white column, which reads as the
site being broken (and did, for a user with OS-level Reduce Motion enabled).
"Reduced motion means fewer and gentler, not zero": the pillars are small,
slow, local colour drifts, so they run at 0.3× instead. Viewport-scale effects
stay curbed under reduce-motion — camera parallax off (CameraRig early
return), shockwave amplitude damped (`pulseAmp`), stars still.

**Responsive Behavior:**
```typescript
const getGridConfig = (isMobile: boolean) => ({
  gridSize: isMobile ? 24 : 40,  // 576 vs 1600 cells
  cellSize: isMobile ? 0.6 : 0.5,
  gap: 0.08,
});
```

### ContactScene.tsx (Contact Page)
Interactive 3D grid for the Contact page that responds to form interactions.

**Features:**
- 44x44 grid (28x28 on mobile)
- Responds to form field focus (creates ripple effect)
- Shows success animation on form submission
- Color scheme: Swiss Blue (#2563EB) primary, Cyan (#06B6D4) secondary

**Performance Optimizations:**
- `InstancedMesh` for all grid cells
- Reusable THREE objects (`_dummy`, `_color`)
- Custom `InteractionContext` for form state sync

**Form Integration:**
```typescript
interface InteractionState {
  focusedField: string | null;  // Currently focused form field
  isSubmitting: boolean;         // Form is submitting
  isSuccess: boolean;            // Submission successful
  triggerPulse: number;          // Timestamp to trigger pulse animation
}
```

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
