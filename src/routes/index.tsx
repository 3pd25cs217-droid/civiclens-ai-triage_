import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDownWideNarrow, ArrowRight, Check, CheckCircle2, ChevronRight, CircleHelp, Clock3, Droplets, FileText, Globe2, ImagePlus, LayoutDashboard, Loader2, MapPin, MessageSquareText, Search, ShieldCheck, Sparkles, TreePine, Trash2, UploadCloud, Waves, X, Zap, Construction, ScanLine, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { classifyComplaint, mockTickets, sortTickets, TRIAGE_DELAY_MS, type Category, type Severity, type Ticket } from '@/lib/triage';
import cityAsset from '@/assets/civiclens-city.asset.json';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'CivicLens — Citizen Reporting & AI Triage' },
    { name: 'description', content: 'Report a neighborhood issue and follow its simulated AI classification, priority, and municipal department assignment with CivicLens.' },
    { property: 'og:title', content: 'CivicLens — Citizen Reporting & AI Triage' },
    { property: 'og:description', content: 'Every report matters. Citizen reporting meets intelligent municipal triage.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { property: 'og:image', content: cityAsset.url },
    { name: 'twitter:image', content: cityAsset.url },
  ] }),
  component: Index,
});

const categoryIcons: Record<Category, LucideIcon> = { Roads: Construction, Waste: Trash2, Water: Droplets, Electricity: Zap, Trees: TreePine, Drainage: Waves };
const severityClasses: Record<Severity, string> = {
  Critical: 'bg-sev-critical-soft text-sev-critical', High: 'bg-sev-high-soft text-sev-high',
  Medium: 'bg-sev-medium-soft text-sev-medium', Low: 'bg-sev-low-soft text-sev-low',
};
function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold ${severityClasses[severity]}`}><span className="size-1.5 rounded-full bg-current" />{severity}</span>;
}

function Index() {
  const [view, setView] = useState<'citizen' | 'officer'>('citizen');
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitted, setSubmitted] = useState<Ticket | null>(null);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('All priorities');
  const [category, setCategory] = useState('All categories');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!photo) { setPhotoUrl(''); return; }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function choosePhoto(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Please choose a JPG, PNG, or WebP image.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Please choose a photo smaller than 10 MB.'); return; }
    setPhoto(file);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || analyzing) return;
    setAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, TRIAGE_DELAY_MS));
    let savedPhoto: string | undefined;
    if (photo) {
      savedPhoto = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(photo);
      });
    }
    const ticket: Ticket = { id: `CL-${1043 + tickets.length - mockTickets.length}`, text: text.trim(), ...classifyComplaint(text), location: location.trim() || 'Location not provided', time: 'Just now', ...(savedPhoto ? { photo: savedPhoto } : {}) };
    setTickets(current => sortTickets([ticket, ...current]));
    setSubmitted(ticket);
    setAnalyzing(false);
    toast.success(`Report ${ticket.id} submitted successfully`, { description: `Assigned to ${ticket.department}` });
    setText(''); setPhoto(null); setLocation('');
  }

  const filtered = sortTickets(tickets).filter(ticket =>
    (severity === 'All priorities' || ticket.severity === severity) &&
    (category === 'All categories' || ticket.category === category) &&
    `${ticket.text} ${ticket.id} ${ticket.location} ${ticket.department}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="min-h-screen">
    <Toaster position="bottom-right" richColors />
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-10">
        <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ScanLine className="size-6" /></div><div><div className="font-display text-2xl font-bold">Civic<span className="text-primary">Lens</span><span className="ml-2.5 hidden align-middle font-mono text-[9px] font-medium uppercase text-muted-foreground sm:inline">Civic intelligence</span></div></div></div>
        <nav aria-label="Main navigation" className="order-3 flex w-full gap-1 rounded-lg bg-muted p-1 sm:order-none sm:w-auto">
          <Button variant={view === 'citizen' ? 'navActive' : 'nav'} className="h-10 flex-1 px-5" onClick={() => setView('citizen')} aria-pressed={view === 'citizen'}><MessageSquareText />Citizen Portal</Button>
          <Button variant={view === 'officer' ? 'navActive' : 'nav'} className="h-10 flex-1 px-5" onClick={() => setView('officer')} aria-pressed={view === 'officer'}><LayoutDashboard />Officer Dashboard</Button>
        </nav>
        <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-sev-low" /><span>Live demo</span></div>
      </div>
    </header>
    <main className="mx-auto max-w-[1240px] px-6 pb-12 pt-9 lg:px-10">
      <div className="mb-7 flex items-center gap-2 text-xs text-muted-foreground"><span>CivicLens</span><ChevronRight className="size-3" /><span className="text-foreground">{view === 'citizen' ? 'Citizen Portal' : 'Officer Dashboard'}</span></div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-primary"><span className="h-px w-6 bg-primary" />{view === 'citizen' ? 'YOUR VOICE. REAL IMPACT.' : 'MUNICIPAL OPERATIONS'}</div><h1 className="text-[34px] font-semibold leading-tight sm:text-[40px]">{view === 'citizen' ? 'Better neighborhoods start with you.' : 'Clarity for every complaint.'}</h1><p className="mt-3 text-sm text-muted-foreground sm:text-base">{view === 'citizen' ? 'A pothole, a leaking pipe, an overflowing bin. Let’s get it to the right people.' : 'Every report, prioritized and routed. Focus on what needs you most.'}</p></div>
        {view === 'officer' && <span className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" />Updated just now</span>}
      </div>

      {view === 'citizen' ? <div className="grid items-start gap-7 lg:grid-cols-[1.55fr_1fr]">
        <section className="overflow-hidden rounded-lg border bg-card shadow-card">
          <div className="flex items-center gap-3 border-b px-7 py-5"><div className="flex size-9 items-center justify-center rounded-md bg-accent text-primary"><FileText className="size-4.5" /></div><div><h2 className="text-lg font-semibold">Report a civic issue</h2><p className="mt-0.5 text-xs text-muted-foreground">Small reports. Meaningful change.</p></div><span className="ml-auto font-mono text-[10px] text-muted-foreground">01 / SUBMIT</span></div>
          {submitted ? <div className="px-7 py-9" role="status"><div className="mb-5 flex size-12 items-center justify-center rounded-full bg-sev-low-soft text-sev-low"><CheckCircle2 className="size-6" /></div><h2 className="text-2xl font-semibold">Your report is in the right hands.</h2><p className="mt-2 text-sm text-muted-foreground">Report <span className="font-mono text-foreground">{submitted.id}</span> has been triaged and added to the officer queue.</p><div className="my-6 grid gap-4 border-y py-5"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Priority</span><SeverityBadge severity={submitted.severity} /></div><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Category</span><span>{submitted.category}</span></div><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="text-muted-foreground">Assigned to</span><span>{submitted.department}</span></div><p className="flex items-start gap-2 text-xs italic text-muted-foreground"><Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />{submitted.reason}</p></div><div className="flex flex-wrap gap-3"><Button variant="triage" onClick={() => setView('officer')}>View officer dashboard<ArrowRight /></Button><Button variant="outline" onClick={() => setSubmitted(null)}>Submit another report</Button></div></div> : <form onSubmit={submit} className="px-7 pb-7 pt-6">
            <label htmlFor="complaint" className="mb-2.5 block text-sm font-semibold">What’s happening?<span className="ml-1 text-destructive">*</span></label>
            <textarea id="complaint" required value={text} onChange={e => setText(e.target.value)} disabled={analyzing} placeholder="Describe the issue in English or your regional language..." className="min-h-[168px] w-full resize-y rounded-md border bg-background/60 p-4 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60" />
            <div className="mb-6 mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><Globe2 className="size-3.5" />Every language. Every neighborhood.</span><span>{text.length} characters</span></div>
            <label htmlFor="location" className="mb-2.5 block text-sm font-semibold">Where is the issue?<span className="ml-2 text-xs font-normal text-muted-foreground">Optional</span></label>
            <div className="relative mb-6"><MapPin className="absolute left-3.5 top-3 size-4 text-muted-foreground" /><input id="location" value={location} onChange={e => setLocation(e.target.value)} disabled={analyzing} placeholder="Street, landmark, or neighborhood" className="h-10 w-full rounded-md border bg-background/60 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" /></div>
            <div className="mb-2.5 flex items-center gap-2"><label className="text-sm font-semibold" htmlFor="photo">Add a photo</label><span className="text-xs text-muted-foreground">Optional</span></div>
            <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" ref={fileInput} className="sr-only" disabled={analyzing} onChange={e => choosePhoto(e.target.files?.[0])} />
            <div onDragOver={e => { e.preventDefault(); if (!analyzing) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (!analyzing) choosePhoto(e.dataTransfer.files[0]); }} className={`mb-6 rounded-md border border-dashed px-4 py-5 text-center transition ${dragging ? 'border-primary bg-accent' : 'bg-background/60'}`}>
              {photo ? <div className="flex items-center gap-3 text-left"><img src={photoUrl} alt="Attached issue" className="size-14 rounded object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{photo.name}</p><p className="mt-1 text-xs text-muted-foreground">{(photo.size / 1024 / 1024).toFixed(2)} MB · Ready to attach</p></div><Button type="button" variant="ghost" size="icon" title="Remove photo" aria-label="Remove photo" disabled={analyzing} onClick={() => setPhoto(null)}><X /></Button></div> : <><UploadCloud className="mx-auto mb-2.5 size-7 text-primary/70" /><div className="flex flex-wrap items-center justify-center gap-1 text-xs"><Button type="button" variant="link" disabled={analyzing} onClick={() => fileInput.current?.click()} className="h-auto p-0 text-xs font-semibold">Click to upload</Button><span className="text-muted-foreground">or drag and drop</span></div><p className="mt-1.5 text-[10px] text-muted-foreground">JPG, PNG or WebP · Up to 10 MB</p></>}
            </div>
            <Button variant="triage" size="lg" type="submit" disabled={!text.trim() || analyzing} className="h-12 w-full text-sm">{analyzing ? <><Loader2 className="animate-spin" />AI is analyzing...</> : <><Sparkles />Submit to AI Triage<ArrowRight className="ml-auto" /></>}</Button>
            {analyzing && <div className="mt-2 h-1 overflow-hidden rounded bg-accent" role="progressbar" aria-label="Analyzing complaint"><div className="h-full w-1/3 animate-scan bg-primary" /></div>}
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground"><ShieldCheck className="size-3" />Your report is shared only with the assigned department.</p>
          </form>}
        </section>
        <aside className="space-y-6">
          <div className="overflow-hidden rounded-lg border bg-card shadow-card"><div className="relative"><img src={cityAsset.url} alt="Tree-lined Indian neighborhood with apartments and a public park" className="aspect-[1.8] w-full object-cover" /><span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded bg-card/95 px-2.5 py-1.5 text-[10px] font-medium"><MapPin className="size-3 text-primary" />Pune, Maharashtra · Demo city</span></div><div className="p-6"><div className="mb-2 flex items-center gap-2 text-xs font-medium text-sev-low"><span className="size-1.5 rounded-full bg-sev-low" />A more connected community</div><h2 className="text-xl font-semibold">Your city. A little better, together.</h2><div className="mt-5 grid grid-cols-3 divide-x border-t pt-5"><div><p className="font-display text-2xl font-semibold">{tickets.length.toString().padStart(2, '0')}</p><p className="mt-1 text-[10px] text-muted-foreground">Reports received</p></div><div className="pl-4"><p className="font-display text-2xl font-semibold">06</p><p className="mt-1 text-[10px] text-muted-foreground">Departments</p></div><div className="pl-4"><p className="font-display text-2xl font-semibold text-primary">~2s</p><p className="mt-1 text-[10px] text-muted-foreground">Triage time</p></div></div></div></div>
          <div className="px-1"><h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-primary" />From concern to action</h3><div className="space-y-5">{[{icon:MessageSquareText,title:'You report',copy:'In your own words. In your own language.'},{icon:Sparkles,title:'AI connects the dots',copy:'Category, urgency, and the right department.'},{icon:ShieldCheck,title:'Officers take it forward',copy:'The most urgent issues reach the top.'}].map((step,index) => <div className="flex gap-3.5" key={step.title}><div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-card text-muted-foreground"><step.icon className="size-3.5" /></div><div><p className="text-xs font-semibold"><span className="mr-2 font-mono text-[10px] text-primary">0{index+1}</span>{step.title}</p><p className="mt-1 text-xs text-muted-foreground">{step.copy}</p></div></div>)}</div></div>
          <div className="flex gap-3 border-t pt-5 text-muted-foreground"><CircleHelp className="mt-0.5 size-4 shrink-0" /><p className="text-[11px] leading-5">Immediate danger? Please contact emergency services. CivicLens is not an emergency response service.</p></div>
        </aside>
      </div> : <section>
        <div className="mb-7 grid grid-cols-2 gap-4 md:grid-cols-4">{[
          { label: 'Total reports', count: tickets.length, icon: FileText, color: 'text-primary', note: 'All incoming civic issues' },
          { label: 'Critical priority', count: tickets.filter(t => t.severity === 'Critical').length, icon: Zap, color: 'text-sev-critical', note: 'Immediate attention needed' },
          { label: 'High priority', count: tickets.filter(t => t.severity === 'High').length, icon: Clock3, color: 'text-sev-high', note: 'Priority intervention' },
          { label: 'AI triaged', count: '100%', icon: Sparkles, color: 'text-sev-low', note: 'Categorized & assigned' },
        ].map(stat => <div key={stat.label} className="rounded-lg border bg-card p-5 shadow-card"><div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{stat.label}</p><stat.icon className={`size-4 ${stat.color}`} /></div><p className={`my-3 font-display text-3xl font-semibold ${stat.color}`}>{stat.count}</p><p className="text-[10px] text-muted-foreground">{stat.note}</p></div>)}</div>
        <div className="rounded-lg border bg-card shadow-card"><div className="flex flex-wrap items-center justify-between gap-4 border-b p-5"><div className="flex items-center gap-3"><h2 className="text-lg font-semibold">Report queue</h2><span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">{filtered.length}</span></div><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><ArrowDownWideNarrow className="size-4" />Sorted by urgency</span></div>
          <div className="flex flex-wrap gap-3 border-b px-5 py-4"><div className="relative min-w-[160px] flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><input aria-label="Search reports" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports, locations, or IDs..." className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary" /></div><select aria-label="Filter priority" value={severity} onChange={e => setSeverity(e.target.value)} className="h-10 rounded-md border bg-card px-3 text-xs"><option>All priorities</option>{Object.keys(severityClasses).map(s => <option key={s}>{s}</option>)}</select><select aria-label="Filter category" value={category} onChange={e => setCategory(e.target.value)} className="h-10 rounded-md border bg-card px-3 text-xs"><option>All categories</option>{Object.keys(categoryIcons).map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="border-b bg-muted/60 font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground"><tr><th className="px-5 py-3.5 font-medium">Report / Citizen concern</th><th className="px-3 py-3.5 font-medium">Category</th><th className="px-3 py-3.5 font-medium">Priority</th><th className="px-3 py-3.5 font-medium">Assigned department</th><th className="px-5 py-3.5 font-medium" aria-label="Details" /></tr></thead><tbody>{filtered.map(ticket => {const Icon = categoryIcons[ticket.category];return <tr key={ticket.id} className="border-b last:border-0 hover:bg-background/80"><td className="max-w-[430px] px-5 py-5"><div className="mb-2 flex items-center gap-2 text-[10px]"><span className="font-mono font-medium text-primary">{ticket.id}</span><span className="text-muted-foreground">· {ticket.time}</span></div><p className="line-clamp-2 text-xs leading-5">{ticket.text}</p><p className="mt-2 flex items-start gap-1.5 text-[10px] italic leading-4 text-muted-foreground"><Sparkles className="mt-0.5 size-3 shrink-0 text-primary" />{ticket.reason}</p><p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin className="size-3" />{ticket.location}{ticket.photo && <ImagePlus className="ml-2 size-3" />}</p></td><td className="px-3 py-5"><span className="inline-flex items-center gap-1.5 rounded border bg-background px-2 py-1.5 text-[10px]"><Icon className="size-3.5 text-muted-foreground" />{ticket.category}</span></td><td className="px-3 py-5"><SeverityBadge severity={ticket.severity} /></td><td className="max-w-[160px] px-3 py-5 text-xs leading-5">{ticket.department}<span className="mt-1 flex items-center gap-1 text-[9px] text-sev-low"><Check className="size-3" />Auto-assigned</span></td><td className="px-5 py-5"><Button variant="ghost" size="icon" aria-label={`View report ${ticket.id}`} title="View report" onClick={() => setSelected(ticket)}><ChevronRight /></Button></td></tr>;})}</tbody></table></div>
          {filtered.length === 0 && <div className="py-14 text-center"><Search className="mx-auto mb-3 size-6 text-muted-foreground" /><h3 className="text-sm font-medium">No matching reports</h3><Button variant="link" onClick={() => { setSearch(''); setSeverity('All priorities'); setCategory('All categories'); }}>Clear filters</Button></div>}
          <div className="flex items-center justify-between gap-3 border-t px-5 py-4 text-[10px] text-muted-foreground"><span>Showing {filtered.length} of {tickets.length} reports</span><span className="flex items-center gap-1.5"><Sparkles className="size-3 text-primary" />AI triage · Simulated</span></div>
        </div>
      </section>}
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-[10px] text-muted-foreground"><span>© 2026 CivicLens. Every report matters.</span><span className="flex items-center gap-1.5"><ShieldCheck className="size-3" />Built for citizens. Designed for action.<span className="mx-2">·</span>Prototype · Simulated AI</span></footer>
    </main>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setSelected(null)}><section role="dialog" aria-modal="true" aria-label={`Report ${selected.id}`} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card p-6 shadow-elegant" onClick={e => e.stopPropagation()}><div className="mb-5 flex items-center justify-between"><div><p className="font-mono text-xs text-primary">{selected.id}</p><h2 className="mt-1 text-xl font-semibold">Report details</h2></div><Button variant="ghost" size="icon" aria-label="Close report" onClick={() => setSelected(null)}><X /></Button></div><div className="mb-4 flex gap-3"><SeverityBadge severity={selected.severity} /><span className="rounded border px-3 py-1 text-xs">{selected.category}</span></div><p className="text-sm leading-6">{selected.text}</p>{selected.photo && <img src={selected.photo} alt="Citizen report attachment" className="mt-4 max-h-60 w-full rounded-md object-contain" />}<p className="mt-5 flex gap-2 text-xs text-muted-foreground"><MapPin className="size-4 shrink-0" />{selected.location}</p><div className="mt-5 border-t pt-5"><p className="text-xs font-semibold">AI assessment</p><p className="mt-2 text-xs italic leading-5 text-muted-foreground">{selected.reason}</p><p className="mt-4 text-[10px] text-muted-foreground">Assigned department</p><p className="mt-1 text-sm font-medium">{selected.department}</p></div><Button variant="outline" className="mt-6 w-full" onClick={() => setSelected(null)}>Close report</Button></section></div>}
  </div>;
}
