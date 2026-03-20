import { describe, expect, it } from 'vitest';
import { convertMomentUnitValue, resolveMomentUnit } from '@/domain/shared/moment-unit';

describe('moment-unit domain', () => {
  it('converts from kN*m to kN*cm', () => {
    expect(convertMomentUnitValue(12.5, 'kN*m', 'kN*cm')).toBe(1250);
  });

  it('converts from kN*cm to kN*m', () => {
    expect(convertMomentUnitValue(1250, 'kN*cm', 'kN*m')).toBe(12.5);
  });

  it('keeps value when units are equal', () => {
    expect(convertMomentUnitValue(87, 'kN*m', 'kN*m')).toBe(87);
  });

  it('resolves unsupported unit to kN*cm fallback', () => {
    expect(resolveMomentUnit('invalid')).toBe('kN*cm');
  });
});
