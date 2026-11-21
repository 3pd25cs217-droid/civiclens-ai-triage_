import { Construction, Droplets, Sparkles, TreePine, Trash2, Waves, Zap, type LucideIcon } from 'lucide-react';
import type { Category, Severity } from '@/lib/triage';

export const categoryIcons: Record<Category, LucideIcon> = {
  Roads: Construction, Waste: Trash2, Water: Droplets,
  Electricity: Zap, Trees: TreePine, Drainage: Waves,
};
export const severityClasses: Record<Severity, string> = {
  Critical: 'bg-sev-critical-soft text-sev-critical', High: 'bg-sev-high-soft text-sev-high',
  Medium: 'bg-sev-medium-soft text-sev-medium', Low: 'bg-sev-low-soft text-sev-low',
};
export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold ${severityClasses[severity]}`}><span className="size-1.5 rounded-full bg-current" />{severity}</span>;
}
export function AIReason({ reason }: { reason: string }) {
  return <div className="mt-3 flex items-start gap-2 rounded-md border border-ai-border bg-ai-soft p-3 text-ai-foreground"><Sparkles className="mt-0.5 size-3.5 shrink-0" /><div><p className="mb-1 font-mono text-[9px] font-medium uppercase">AI assessment</p><p className="text-xs italic leading-5">{reason}</p></div></div>;
}