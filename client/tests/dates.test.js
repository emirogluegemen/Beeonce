import { describe, expect, it } from 'vitest';
import { mondayUTC, moveWeek, weekLabel, dateLocal, DEVELOPMENT_AREAS } from '../src/lib/dates';

describe('UTC weekly selection', () => {
  it('calculates Monday and navigates by seven days', () => {
    expect(mondayUTC(new Date('2026-11-22T15:00:00Z'))).toBe('2026-11-16');
    expect(moveWeek('2026-11-16', 1)).toBe('2026-11-23');
    expect(moveWeek('2026-11-16', -1)).toBe('2026-11-09');
  });
  it('provides a human-readable week label and categories', () => {
    expect(weekLabel('2026-11-16')).toContain('16 Nov');
    expect(dateLocal(new Date('2026-11-18T12:00:00'))).toMatch(/^2026-11-\d{2}$/);
    expect(DEVELOPMENT_AREAS.motor).toBe('Motor');
  });
});
