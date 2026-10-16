export function beijingParts(ms) {
  if (!Number.isFinite(ms)) throw new TypeError('Expected finite timestamp');
  const d = new Date(ms + 8 * 60 * 60 * 1000);
  return { date: d.toISOString().slice(0, 10), year: d.getUTCFullYear(), weekday: d.getUTCDay(), minute: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

export function createCalendar({ years = [], holidays = [], uncertain = [], source = '' } = {}) {
  const covered = new Set(years);
  const days = new Set(holidays);
  const gaps = new Set(uncertain);
  return Object.freeze({ source, classify(date, year) {
    if (!covered.has(year) || gaps.has(date)) return 'unknown';
    return days.has(date) ? 'holiday' : 'ordinary';
  } });
}

export function periodAt(ms, calendar) {
  const p = beijingParts(ms);
  if (p.weekday === 0 || p.weekday === 6) return 'idle';
  if (!((p.minute >= 540 && p.minute < 720) || (p.minute >= 840 && p.minute < 1080))) return 'idle';
  const day = calendar.classify(p.date, p.year);
  if (day === 'unknown') return 'unknown';
  return day === 'holiday' ? 'idle' : 'peak';
}

export function createReminder() {
  let lastSession;
  let lastPeriod;
  return { update(session, period) {
    const remind = period === 'peak' && (lastPeriod !== 'peak' || lastSession !== session);
    lastSession = session;
    lastPeriod = period;
    return remind;
  } };
}

export function startMonitor({ session, calendar, reminder, onUpdate, now = Date.now, timers = globalThis, events = globalThis.document }) {
  let stopped = false;
  const refresh = () => {
    if (stopped) return;
    const period = periodAt(now(), calendar);
    onUpdate(period, reminder.update(session, period));
  };
  refresh();
  const interval = timers.setInterval(refresh, 1000);
  events?.addEventListener('visibilitychange', refresh);
  return () => {
    stopped = true;
    timers.clearInterval(interval);
    events?.removeEventListener('visibilitychange', refresh);
  };
}
