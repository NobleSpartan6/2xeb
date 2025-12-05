import { Discipline, ConsoleLane, GraphNode, GraphEdge } from '../lib/types';
import { PROJECTS } from './projects';

// --- SYSTEM CONSOLE COLORS ---
export const COLORS = {
  bg: '#050505',
  card: '#0A0A0A',
  border: '#262626',
  textMain: '#FFFFFF',
  textMuted: '#A3A3A3',

  // Legacy Mappings
  primary: '#2563EB',
  swe: '#06B6D4',    // Mapped to CODE (Cyan)
  ml: '#84CC16',     // Mapped to VISION (Chartreuse)
  video: '#F59E0B',  // Mapped to DESIGN (Amber)

  // New System Colors
  design: '#F59E0B',    // Amber
  code: '#06B6D4',      // Cyan
  vision: '#84CC16',    // Chartreuse
};

// --- GRAPH GENERATION UTILS ---

const getLaneForDiscipline = (d: Discipline): ConsoleLane => {
  switch (d) {
    case Discipline.VIDEO: return ConsoleLane.DESIGN;
    case Discipline.ML: return ConsoleLane.VISION;
    case Discipline.SWE: return ConsoleLane.CODE;
    case Discipline.HYBRID: return ConsoleLane.CODE;
    default: return ConsoleLane.CODE;
  }
};

export const generateGraph = (): { nodes: GraphNode[], edges: GraphEdge[] } => {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const laneCursors = {
    [ConsoleLane.DESIGN]: 0,
    [ConsoleLane.CODE]: 0,
    [ConsoleLane.VISION]: 0,
  };

  // 1. Create Nodes
  PROJECTS.forEach(p => {
    let lane = getLaneForDiscipline(p.primaryDiscipline);
    // Special override for Midimix to be in VISION if HYBRID defaults to CODE
    if (p.slug === 'midimix') lane = ConsoleLane.VISION;

    // Spacing logic: Design top (Z=-2), Vision mid (Z=0), Code bottom (Z=2)
    let z = 0;
    if (lane === ConsoleLane.DESIGN) z = -3;
    if (lane === ConsoleLane.VISION) z = 0;
    if (lane === ConsoleLane.CODE) z = 3;

    const x = laneCursors[lane] * 3 - 3; // Start centered-ish
    laneCursors[lane]++;

    nodes.push({
      id: p.slug,
      label: p.title,
      lane,
      x,
      z,
      project: p
    });
  });

  // 2. Create Edges based on shared tags
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i];
      const n2 = nodes[j];
      const sharedTags = n1.project.tags.filter(t => n2.project.tags.includes(t));

      if (sharedTags.length > 0) {
        edges.push({
          source: n1.id,
          target: n2.id,
          strength: sharedTags.length
        });
      }
    }
  }

  return { nodes, edges };
};

export const GRAPH_DATA = generateGraph();
