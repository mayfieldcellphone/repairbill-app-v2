import { useEffect, useState } from 'react';
import { Mail, X, Bell, BellOff, ArrowRight } from 'lucide-react';
import { Lead } from '../lib/types';

const MUTE_KEY = 'rb_lead_alert_muted';

/**
 * Module scope on purpose - NOT component state.
 *
 * The first version kept "leads I've already seen" in a useRef. That silently
 * failed: whenever the component remounted the ref reset, every poll then
 * looked like a first load, and a first load deliberately stays quiet - so no
 * alert ever fired. Module-level values survive remounts and only reset on a
 * real page load, which is exactly the lifetime we want.
 */
const APP_START = Date.now();
const alreadyShown = new Set<string>();

/**
 * Leads older than this never raise an alert. The 5-minute band absorbs clock
 * skew between the server's createdAt and the browser clock, and means a lead
 * that landed moments before you opened the app still gets announced.
 */
const CUTOFF = APP_START - 5 * 60 * 1000;

const TYPE_LABELS: Record<string, string> = {
  contact: 'Enquiry',
  quote: 'Quote request',
  booking: 'Booking',
  corporate: 'Corporate',
  voice_message: 'Voice message',
};

/** Short two-note chime built with the Web Audio API - no asset file needed. */
function playChime() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [
      { freq: 880, at: 0 },
      { freq: 1320, at: 0.14 },
    ].forEach(({ freq, at }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + at);
      gain.gain.linearRampToValueAtTime(0.16, now + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.34);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    /* audio is a nicety - never let it break the app */
  }
}

function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function persistMuted(v: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, v ? '1' : '0');
  } catch {
    /* private mode - just don't persist */
  }
}

/**
 * Floating alerts for leads that arrive while the dashboard is open.
 *
 * `leads` is the live list from App. This component watches it and pops a card
 * for anything it has not seen before. On the very first render it only records
 * the current ids - so opening the app never fires a burst of alerts for leads
 * that were already sitting there.
 */
export function LeadNotifications({
  leads,
  onOpenInbox,
}: {
  leads: Lead[];
  onOpenInbox: () => void;
}) {
  const [toasts, setToasts] = useState<Lead[]>([]);
  const [muted, setMuted] = useState(isMuted);

  useEffect(() => {
    const fresh = leads.filter((l) => {
      if (!l || !l.id || alreadyShown.has(l.id)) return false;
      const ts = new Date(l.createdAt || 0).getTime();
      return Number.isFinite(ts) && ts > CUTOFF;
    });
    if (fresh.length === 0) return;

    fresh.forEach((l) => alreadyShown.add(l.id));
    setToasts((prev) => [...fresh, ...prev].slice(0, 4));

    if (!isMuted()) playChime();

    // Desktop notification when the tab is in the background.
    try {
      if ('Notification' in window && document.hidden) {
        if (Notification.permission === 'granted') {
          const l = fresh[0];
          new Notification(
            fresh.length === 1 ? `New lead: ${l.customerName}` : `${fresh.length} new leads`,
            { body: fresh.length === 1 ? (l.message || '').slice(0, 120) : 'Open RepairBill to read them.' }
          );
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }
      }
    } catch {
      /* notifications unavailable - the on-screen card is enough */
    }
  }, [leads]);

  // Each card clears itself after 14 seconds. The Inbox badge is what persists.
  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => setToasts((prev) => prev.slice(0, -1)), 14000);
    return () => clearTimeout(t);
  }, [toasts]);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    persistMuted(next);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 sm:right-6 z-[100] flex flex-col gap-2.5 w-[min(22rem,calc(100vw-2rem))] pointer-events-none">
      <style>{`
        @keyframes rb-lead-in {
          from { opacity: 0; transform: translateX(1.5rem); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes rb-lead-bar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      {toasts.map((lead) => (
        <div
          key={lead.id}
          className="pointer-events-auto bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden"
          style={{ animation: 'rb-lead-in 300ms ease-out both' }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3 p-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Mail size={17} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">
                  {TYPE_LABELS[lead.type] || 'New lead'}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">now</span>
              </div>
              <p className="text-sm font-black text-slate-800 truncate mt-0.5">
                {lead.customerName || 'Unknown customer'}
              </p>
              {lead.message && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-snug">{lead.message}</p>
              )}
              {(lead.customerPhone || lead.customerEmail) && (
                <p className="text-[11px] text-slate-400 font-semibold mt-1 truncate">
                  {lead.customerPhone || lead.customerEmail}
                </p>
              )}

              <button
                onClick={() => {
                  onOpenInbox();
                  dismiss(lead.id);
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                Open inbox <ArrowRight size={12} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0">
              <button
                onClick={() => dismiss(lead.id)}
                className="text-slate-300 hover:text-slate-600 transition-colors"
                title="Dismiss"
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
              <button
                onClick={toggleMute}
                className="text-slate-300 hover:text-slate-600 transition-colors"
                title={muted ? 'Sound is off - turn on' : 'Sound is on - turn off'}
                aria-label={muted ? 'Turn alert sound on' : 'Turn alert sound off'}
              >
                {muted ? <BellOff size={14} /> : <Bell size={14} />}
              </button>
            </div>
          </div>

          <div className="h-1 bg-blue-600/15">
            <div
              className="h-full bg-blue-600"
              style={{ animation: 'rb-lead-bar 14s linear forwards' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
