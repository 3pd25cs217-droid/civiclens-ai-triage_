import { describe, it, expect } from 'vitest';
import { classifyComplaint, mockTickets, sortTickets, TRIAGE_DELAY_MS } from '@/lib/triage';
describe('CivicLens triage rules', () => {
  it('simulates analysis for two seconds', () => { expect(TRIAGE_DELAY_MS).toBe(2000); });
  it('sorts severity Critical → High → Medium → Low', () => {
    expect(sortTickets([...mockTickets].reverse()).map(t => t.severity)).toEqual(['Critical', 'Critical', 'High', 'High', 'Medium', 'Low']);
  });
  it('includes at least five realistic reports', () => { expect(mockTickets.length).toBeGreaterThanOrEqual(5); });
  it('routes a critical water main burst to water and sanitation', () => {
    expect(classifyComplaint('A water main has burst and is flooding the road')).toMatchObject({ category: 'Water', severity: 'Critical', department: 'Water & Sanitation Dept' });
  });
  it('marks an overgrown bush as low severity', () => { expect(classifyComplaint('Please trim the overgrown bush').severity).toBe('Low'); });
});