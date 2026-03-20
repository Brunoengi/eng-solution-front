export type MomentUnit = 'kN*m' | 'kN*cm';

export function convertMomentUnitValue(value: number, from: MomentUnit, to: MomentUnit): number {
  if (from === to) {
    return value;
  }

  if (from === 'kN*m' && to === 'kN*cm') {
    return value * 100;
  }

  return value / 100;
}

export function resolveMomentUnit(unit: unknown): MomentUnit {
  return unit === 'kN*m' ? 'kN*m' : 'kN*cm';
}
