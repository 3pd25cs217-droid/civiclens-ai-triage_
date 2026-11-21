import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, ChevronRight, CircleHelp, Clock3, FileText, Globe2, LayoutDashboard, Loader2, MapPin, MessageSquareText, ShieldCheck, Sparkles, UploadCloud, X, ScanLine, Moon, Sun, LocateFixed } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { classifyComplaint, mockTickets, sortTickets, TRIAGE_DELAY_MS, updateTicketStatus, type Ticket } from '@/lib/triage';
import { AIReason, SeverityBadge } from '@/components/ticket-presentation';
import { OfficerDashboard } from '@/components/officer-dashboard';
import { TriageProgress, triageStages } from '@/components/triage-progress';
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
  const [language, setLanguage] = useState('English');
  const [dark, setDark] = useState(false);
  const [triageStep, setTriageStep] = useState(-1);
  const [locating, setLocating] = useState(false);
  const [coordinates, setCoordinates] = useState<Ticket['coordinates']>();
  const [selected, setSelected] = useState<Ticket | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!photo) { setPhotoUrl(''); return; }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);

  function useCurrentLocation() {
    if (locating) return;
    setLocating(true);
    const fallback = () => {
      setCoordinates({ latitude: 18.5204, longitude: 73.8567, simulated: true });
      setLocation('Pune city center · Demo location');
      setLocating(false);
      toast.info('GPS unavailable — using a labeled demo location.', { description: 'You can still enter the issue location manually.' });
    };
    if (!navigator.geolocation) { fallback(); return; }
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      setCoordinates({ latitude, longitude, simulated: false });
      setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      setLocating(false);
      toast.success('Current location added to your report.');
    }, fallback, { timeout: 8000, maximumAge: 60000 });
  }

  function ticketAction(ticket: Ticket, action: 'assign' | 'resolve') {
    const updated = updateTicketStatus(ticket, action);
    setTickets(current => current.map(item => item.id === ticket.id ? updated : item));
    setSelected(current => current?.id === ticket.id ? updated : current);
    toast.success(action === 'resolve' ? `${ticket.id} marked as resolved` : `${ticket.id}: team assigned`, { description: action === 'assign' ? updated.team : 'The open issue and critical alert counts have been updated.' });
  }

  const placeholders: Record<string, string> = {
    English: 'Describe the issue in English or your regional language...',
    Hindi: 'समस्या का विवरण हिंदी में लिखें...',
    Regional: 'समस्येचे वर्णन मराठीत लिहा...',
  };

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
    for (let step = 0; step < 4; step++) {
      setTriageStep(step);
      await new Promise(resolve => setTimeout(resolve, TRIAGE_DELAY_MS / 4));
    }
    let savedPhoto: string | undefined;
    if (photo) {
      savedPhoto = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(photo);
      });
    }
    const ticket: Ticket = { id: `CL-${1043 + tickets.length - mockTickets.length}`, text: text.trim(), ...classifyComplaint(text), location: location.trim() || 'Location not provided', time: 'Just now', status: 'Open', ...(coordinates ? { coordinates } : {}), ...(savedPhoto ? { photo: savedPhoto } : {}) };
    setTickets(current => sortTickets([ticket, ...current]));
    setSubmitted(ticket);
    setAnalyzing(false);
    toast.success(`Report ${ticket.id} submitted successfully`, { description: `Assigned to ${ticket.department}` });
    setText(''); setPhoto(null); setLocation(''); setCoordinates(undefined);
  }

  return <div className="min-h-screen">
    <Toaster position="bottom-right" richColors />
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-10">
        <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ScanLine className="size-6" /></div><div><div className="font-display text-2xl font-bold">Civic<span className="text-primary">Lens</span><span className="ml-2.5 hidden align-middle font-mono text-[9px] font-medium uppercase text-muted-foreground sm:inline">Civic intelligence</span></div></div></div>
        <nav aria-label="Main navigation" className="order-3 flex w-full gap-1 rounded-lg bg-muted p-1 sm:order-none sm:w-auto">
          <Button variant={view === 'citizen' ? 'navActive' : 'nav'} className="h-10 flex-1 px-5" onClick={() => setView('citizen')} aria-pressed={view === 'citizen'}><MessageSquareText />Citizen Portal</Button>
          <Button variant={view === 'officer' ? 'navActive' : 'nav'} className="h-10 flex-1 px-5" onClick={() => setView('officer')} aria-pressed={view === 'officer'}><LayoutDashboard />Officer Dashboard</Button>
        </nav>
        <div className="flex items-center gap-2"><div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-sev-low" /><span>Live demo</span></div><Button variant="ghost" size="icon" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDark(value => !value)}>{dark ? <Sun /> : <Moon />}</Button></div>
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
          {submitted ? <div className="px-7 py-9" role="status"><div className="mb-5 flex size-12 items-center justify-center rounded-full bg-sev-low-soft text-sev-low"><CheckCircle2 className="size-6" /></div><h2 className="text-2xl font-semibold">Your report is in the right hands.</h2><p className="mt-2 text-sm text-muted-foreground">Report <span className="font-mono text-foreground">{submitted.id}</span> has been triaged and added to the officer queue.</p><div className="my-6 grid gap-4 border-y py-5"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Priority</span><SeverityBadge severity={submitted.severity} /></div><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Category</span><span>{submitted.category}</span></div><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="text-muted-foreground">Assigned to</span><span>{submitted.department}</span></div><AIReason reason={submitted.reason} /><TriageProgress step={3} /></div><div className="flex flex-wrap gap-3"><Button variant="triage" onClick={() => setView('officer')}>View officer dashboard<ArrowRight /></Button><Button variant="outline" onClick={() => setSubmitted(null)}>Submit another report</Button></div></div> : <form onSubmit={submit} className="px-7 pb-7 pt-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><label htmlFor="language" className="flex items-center gap-1.5 text-xs text-muted-foreground"><Globe2 className="size-3.5" />Report language</label><select id="language" value={language} onChange={e => setLanguage(e.target.value)} disabled={analyzing} className="h-9 rounded-md border bg-background px-3 text-xs"><option value="English">English</option><option value="Hindi">हिंदी / Hindi</option><option value="Regional">मराठी / Regional</option></select></div>
            <label htmlFor="complaint" className="mb-2.5 block text-sm font-semibold">What’s happening?<span className="ml-1 text-destructive">*</span></label>
            <textarea id="complaint" required value={text} onChange={e => setText(e.target.value)} disabled={analyzing} placeholder={placeholders[language]} className="min-h-[168px] w-full resize-y rounded-md border bg-background/60 p-4 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60" />
            <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><Globe2 className="size-3.5" />Every language. Every neighborhood.</span><span>{text.length} characters</span></div>
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2"><label htmlFor="location" className="text-sm font-semibold">Where is the issue?<span className="ml-2 text-xs font-normal text-muted-foreground">Optional</span></label><Button type="button" variant="link" className="h-8 px-0 text-xs" onClick={useCurrentLocation} disabled={analyzing || locating}>{locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}{locating ? 'Locating...' : 'Use Current Location'}</Button></div>
            <div className="relative mb-3"><MapPin className="absolute left-3.5 top-3 size-4 text-muted-foreground" /><input id="location" value={location} onChange={e => { setLocation(e.target.value); setCoordinates(undefined); }} disabled={analyzing} placeholder="Street, landmark, or neighborhood" className="h-10 w-full rounded-md border bg-background/60 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" /></div>
            {coordinates && <div className="mb-3 rounded-md border bg-accent p-3 text-xs text-accent-foreground"><p className="flex items-center gap-2 font-medium"><MapPin className="size-3.5" />{coordinates.simulated ? 'Simulated GPS · Pune' : 'GPS location captured'}</p><p className="mt-1.5 font-mono">{coordinates.latitude.toFixed(5)}° N, {coordinates.longitude.toFixed(5)}° E</p><a className="mt-2 inline-flex items-center gap-1 text-xs underline underline-offset-4" href={`https://www.openstreetmap.org/?mlat=${coordinates.latitude}&mlon=${coordinates.longitude}#map=17/${coordinates.latitude}/${coordinates.longitude}`} target="_blank" rel="noreferrer">View on map<ArrowRight className="size-3" /></a></div>}
            <div className="mb-6" />
            <div className="mb-2.5 flex items-center gap-2"><label className="text-sm font-semibold" htmlFor="photo">Add a photo</label><span className="text-xs text-muted-foreground">Optional</span></div>
            <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" ref={fileInput} className="sr-only" disabled={analyzing} onChange={e => choosePhoto(e.target.files?.[0])} />
            <div onDragOver={e => { e.preventDefault(); if (!analyzing) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (!analyzing) choosePhoto(e.dataTransfer.files[0]); }} className={`mb-6 rounded-md border border-dashed px-4 py-5 text-center transition ${dragging ? 'border-primary bg-accent' : 'bg-background/60'}`}>
              {photo ? <div className="flex items-center gap-3 text-left"><img src={photoUrl} alt="Attached issue" className="size-14 rounded object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{photo.name}</p><p className="mt-1 text-xs text-muted-foreground">{(photo.size / 1024 / 1024).toFixed(2)} MB · Ready to attach</p></div><Button type="button" variant="ghost" size="icon" title="Remove photo" aria-label="Remove photo" disabled={analyzing} onClick={() => setPhoto(null)}><X /></Button></div> : <><UploadCloud className="mx-auto mb-2.5 size-7 text-primary/70" /><div className="flex flex-wrap items-center justify-center gap-1 text-xs"><Button type="button" variant="link" disabled={analyzing} onClick={() => fileInput.current?.click()} className="h-auto p-0 text-xs font-semibold">Click to upload</Button><span className="text-muted-foreground">or drag and drop</span></div><p className="mt-1.5 text-[10px] text-muted-foreground">JPG, PNG or WebP · Up to 10 MB</p></>}
            </div>
            <Button variant="triage" size="lg" type="submit" disabled={!text.trim() || analyzing} className="h-12 w-full text-sm">{analyzing ? <><Loader2 className="animate-spin" />{triageStages[triageStep] || 'Analyzing text...'}</> : <><Sparkles />Submit to AI Triage<ArrowRight className="ml-auto" /></>}</Button>
            {analyzing && <TriageProgress step={triageStep} />}
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground"><ShieldCheck className="size-3" />Your report is shared only with the assigned department.</p>
          </form>}
        </section>
        <aside className="space-y-6">
          <div className="overflow-hidden rounded-lg border bg-card shadow-card"><div className="relative"><img src={cityAsset.url} alt="Tree-lined Indian neighborhood with apartments and a public park" className="aspect-[1.8] w-full object-cover" /><span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded bg-card/95 px-2.5 py-1.5 text-[10px] font-medium"><MapPin className="size-3 text-primary" />Pune, Maharashtra · Demo city</span></div><div className="p-6"><div className="mb-2 flex items-center gap-2 text-xs font-medium text-sev-low"><span className="size-1.5 rounded-full bg-sev-low" />A more connected community</div><h2 className="text-xl font-semibold">Your city. A little better, together.</h2><div className="mt-5 grid grid-cols-3 divide-x border-t pt-5"><div><p className="font-display text-2xl font-semibold">{tickets.length.toString().padStart(2, '0')}</p><p className="mt-1 text-[10px] text-muted-foreground">Reports received</p></div><div className="pl-4"><p className="font-display text-2xl font-semibold">06</p><p className="mt-1 text-[10px] text-muted-foreground">Departments</p></div><div className="pl-4"><p className="font-display text-2xl font-semibold text-primary">~2s</p><p className="mt-1 text-[10px] text-muted-foreground">Triage time</p></div></div></div></div>
          <div className="px-1"><h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-primary" />From concern to action</h3><div className="space-y-5">{[{icon:MessageSquareText,title:'You report',copy:'In your own words. In your own language.'},{icon:Sparkles,title:'AI connects the dots',copy:'Category, urgency, and the right department.'},{icon:ShieldCheck,title:'Officers take it forward',copy:'The most urgent issues reach the top.'}].map((step,index) => <div className="flex gap-3.5" key={step.title}><div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-card text-muted-foreground"><step.icon className="size-3.5" /></div><div><p className="text-xs font-semibold"><span className="mr-2 font-mono text-[10px] text-primary">0{index+1}</span>{step.title}</p><p className="mt-1 text-xs text-muted-foreground">{step.copy}</p></div></div>)}</div></div>
          <div className="flex gap-3 border-t pt-5 text-muted-foreground"><CircleHelp className="mt-0.5 size-4 shrink-0" /><p className="text-[11px] leading-5">Immediate danger? Please contact emergency services. CivicLens is not an emergency response service.</p></div>
        </aside>
      </div> : <OfficerDashboard tickets={tickets} onSelect={setSelected} onAction={ticketAction} />}
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-[10px] text-muted-foreground"><span>© 2026 CivicLens. Every report matters.</span><span className="flex items-center gap-1.5"><ShieldCheck className="size-3" />Built for citizens. Designed for action.<span className="mx-2">·</span>Prototype · Simulated AI</span></footer>
    </main>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setSelected(null)}><section role="dialog" aria-modal="true" aria-label={`Report ${selected.id}`} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card p-6 shadow-elegant" onClick={e => e.stopPropagation()}><div className="mb-5 flex items-center justify-between"><div><p className="font-mono text-xs text-primary">{selected.id}</p><h2 className="mt-1 text-xl font-semibold">Report details</h2></div><Button variant="ghost" size="icon" aria-label="Close report" onClick={() => setSelected(null)}><X /></Button></div><div className="mb-4 flex gap-3"><SeverityBadge severity={selected.severity} /><span className="rounded border px-3 py-1 text-xs">{selected.category}</span></div><p className="text-sm leading-6">{selected.text}</p>{selected.photo && <img src={selected.photo} alt="Citizen report attachment" className="mt-4 max-h-60 w-full rounded-md object-contain" />}<p className="mt-5 flex gap-2 text-xs text-muted-foreground"><MapPin className="size-4 shrink-0" />{selected.location}</p>{selected.coordinates && <p className="mt-2 font-mono text-xs text-muted-foreground">{selected.coordinates.latitude.toFixed(5)}, {selected.coordinates.longitude.toFixed(5)} · {selected.coordinates.simulated ? 'Simulated GPS' : 'GPS'}</p>}<div className="mt-5 border-t pt-5"><p className="text-xs font-semibold">AI assessment</p><AIReason reason={selected.reason} /><p className="mt-4 text-[10px] text-muted-foreground">Assigned department</p><p className="mt-1 text-sm font-medium">{selected.department}</p></div><p className="mt-3 text-xs text-muted-foreground">Status: {selected.status || 'Open'}{selected.team ? ` · ${selected.team}` : ''}</p>{selected.status !== 'Resolved' && <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" disabled={selected.status === 'Assigned'} onClick={() => ticketAction(selected, 'assign')}>Assign Team</Button><Button variant="secondary" onClick={() => ticketAction(selected, 'resolve')}><CheckCircle2 />Mark as Resolved</Button></div>}<Button variant="outline" className="mt-6 w-full" onClick={() => setSelected(null)}>Close report</Button></section></div>}
  </div>;
}
