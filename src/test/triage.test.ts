import { describe, it, expect } from 'vitest';
import { classifyComplaint, mockTickets, sortTickets, TRIAGE_DELAY_MS, filterTickets, getTicketMetrics, updateTicketStatus, departments } from '@/lib/triage';
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
  it('filters to the PWD department', () => {
    const result = filterTickets(mockTickets, { search: '', department: departments.Roads, severity: 'All priorities', category: 'All categories', status: 'All statuses' });
    expect(result.map(t => t.id)).toEqual(['CL-1040']);
  });
  it('shows critical tickets only', () => {
    expect(filterTickets(mockTickets, { search: '', department: 'All departments', severity: 'Critical', category: 'All categories', status: 'All statuses' }).map(t => t.id)).toEqual(['CL-1042', 'CL-1041']);
  });
  it('assigns a ticket to its category response team', () => {
    const ticket = mockTickets[0];
    if (!ticket) throw new Error('Missing test report');
    expect(updateTicketStatus(ticket, 'assign')).toMatchObject({ status: 'Assigned', team: 'Water Response Team' });
  });
  it('resolves a ticket and removes it from open issues and critical alerts', () => {
    const updated = mockTickets.map(ticket => ticket.id === 'CL-1042' ? updateTicketStatus(ticket, 'resolve') : ticket);
    expect(updated.find(ticket => ticket.id === 'CL-1042')?.status).toBe('Resolved');
    expect(getTicketMetrics(updated)).toMatchObject({ open: 5, critical: 1 });
  });
  it('estimates time saved against five minutes of manual triage per report', () => {
    expect(getTicketMetrics(mockTickets).savedMinutes).toBe(30);
  });
});