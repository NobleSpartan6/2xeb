import React from 'react';
import { Discipline } from '../lib/types';
import { COLORS } from '../data';

interface DisciplineChipProps {
  discipline: Discipline;
  className?: string;
}

const DisciplineChip: React.FC<DisciplineChipProps> = ({ discipline, className = '' }) => {
  let color = COLORS.textMuted;
  let bg = 'transparent';
  let border = COLORS.border;

  switch (discipline) {
    case Discipline.SWE:
      color = COLORS.swe; 
      border = COLORS.swe;
      break;
    case Discipline.ML:
      color = COLORS.ml;
      border = COLORS.ml;
      break;
    case Discipline.VIDEO:
      color = COLORS.video;
      border = COLORS.video;
      break;
    case Discipline.HYBRID:
      color = '#FFFFFF';
      border = 'rgba(255,255,255,0.5)';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-[10px] font-bold tracking-widest border uppercase font-mono ${className}`}
      style={{ color: color, borderColor: border, backgroundColor: bg }}
    >
      {discipline}
    </span>
  );
};

export default DisciplineChip;
