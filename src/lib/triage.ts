export const TRIAGE_DELAY_MS = 2000;
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type Category = 'Roads' | 'Waste' | 'Water' | 'Electricity' | 'Trees' | 'Drainage';
export type Ticket = {
  id: string;
  text: string;
  category: Category;
  severity: Severity;
  reason: string;
  department: string;
  location: string;
  time: string;
  photo?: string;
};
export const severityRank: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
export function sortTickets(tickets: Ticket[]) {
  return [...tickets].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
export const departments: Record<Category, string> = {
  Roads: 'Public Works Department', Waste: 'Solid Waste Management', Water: 'Water & Sanitation Dept',
  Electricity: 'Electricity Department', Trees: 'Parks & Horticulture', Drainage: 'Drainage & Sewerage Dept',
};
export const mockTickets: Ticket[] = [
  { id: 'CL-1042', text: 'A water main has burst near the MG Road junction! Water is flooding the entire street and entering shops. Please send someone immediately.', category: 'Water', severity: 'Critical', reason: 'Active flooding threatens property and disrupts a major junction.', department: departments.Water, location: 'MG Road · Ward 12', time: '12 min ago' },
  { id: 'CL-1041', text: 'There is a live wire hanging from the pole outside the school on Station Road. Children are walking right under it. This is very dangerous.', category: 'Electricity', severity: 'Critical', reason: 'Exposed live wire poses an immediate risk to life near a school.', department: departments.Electricity, location: 'Station Road · Ward 08', time: '24 min ago' },
  { id: 'CL-1040', text: 'Huge pothole near the bus stop on FC Road. Two bike riders fell today and one got hurt. It is impossible to see at night.', category: 'Roads', severity: 'High', reason: 'Reported injuries and poor visibility create a recurring accident risk.', department: departments.Roads, location: 'FC Road · Ward 05', time: '38 min ago' },
  { id: 'CL-1039', text: 'The drain behind our apartment is blocked and sewage is overflowing onto the footpath. The smell is terrible and mosquitoes are everywhere.', category: 'Drainage', severity: 'High', reason: 'Sewage exposure and standing water present a public health hazard.', department: departments.Drainage, location: 'Shivaji Nagar · Ward 03', time: '52 min ago' },
  { id: 'CL-1038', text: 'Garbage has not been collected on our street for three days. The bins are full and stray dogs are scattering the waste everywhere.', category: 'Waste', severity: 'Medium', reason: 'Uncollected waste affects neighborhood sanitation without immediate danger.', department: departments.Waste, location: 'Kothrud · Ward 21', time: '1 hr ago' },
  { id: 'CL-1037', text: 'The bushes in the park near our building have grown over the walking path. Could someone trim them when possible?', category: 'Trees', severity: 'Low', reason: 'Routine landscaping issue with no reported safety or access emergency.', department: departments.Trees, location: 'Aundh · Ward 16', time: '2 hr ago' },
];
export function classifyComplaint(text: string): Pick<Ticket, 'category' | 'severity' | 'reason' | 'department'> {
  const value = text.toLowerCase();
  let category: Category = 'Roads';
  if (/wire|electric|power|pole|बिजली|वीज/.test(value)) category = 'Electricity';
  else if (/sewage|sewer|drain|नाली|गटार/.test(value)) category = 'Drainage';
  else if (/water|leak|pipe|पानी|पाणी/.test(value)) category = 'Water';
  else if (/garbage|trash|waste|rubbish|कचरा/.test(value)) category = 'Waste';
  else if (/tree|bush|branch|park|झाड|पेड़/.test(value)) category = 'Trees';
  let severity: Severity = category === 'Trees' ? 'Low' : 'Medium';
  if (/live wire|electroc|fire|flood|burst|life.?threat|आग/.test(value)) severity = 'Critical';
  else if (/injur|accident|danger|sewage|overflow|fallen|blocked road/.test(value)) severity = 'High';
  const reasons: Record<Severity, string> = {
    Critical: 'An immediate safety hazard requires emergency department attention.',
    High: 'Reported safety or health risks require priority intervention.',
    Medium: 'A service disruption needs attention, with no immediate danger reported.',
    Low: 'Routine maintenance can be scheduled without an immediate safety risk.',
  };
  return { category, severity, reason: reasons[severity], department: departments[category] };
}