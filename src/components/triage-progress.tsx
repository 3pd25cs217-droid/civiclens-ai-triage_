import { Check, Loader2 } from 'lucide-react';

export const triageStages = ['Analyzing text...', 'Identifying category...', 'Assigning severity...', 'Ticket Created.'];
export function TriageProgress({ step }: { step: number }) {
  return <ol aria-label="AI triage progress" aria-live="polite" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{triageStages.map((label, index) => <li key={label} className={`min-h-16 rounded-md border p-2.5 ${index <= step ? 'border-primary/25 bg-accent text-accent-foreground' : 'bg-background text-muted-foreground'}`}><div className="mb-2 flex items-center gap-2">{index < step || step === 3 ? <Check className="size-3.5" /> : index === step ? <Loader2 className="size-3.5 animate-spin" /> : <span className="flex size-3.5 items-center justify-center font-mono text-[9px]">{index + 1}</span>}<span className="font-mono text-[9px]">0{index + 1}</span></div><p className="text-[10px] leading-4">{label}</p></li>)}</ol>;
}