import { createCalendar, createReminder, startMonitor } from './core.js';
import { calendarData } from './calendar.js';

window.__ModuleLoader__.load({
  id: 'dsh-feng-gu-lite',
  factory(require) {
    const React = require('react');
    const el = React.createElement;
    const calendar = createCalendar(calendarData);
    const css = `
.dsh-feng-gu{position:relative;display:inline-flex;align-items:center;gap:5px;font:600 12px/22px system-ui,sans-serif;letter-spacing:.08em;padding:0 9px;border-radius:999px;pointer-events:none;user-select:none}
.dsh-feng-gu--idle,.dsh-feng-gu--unknown{color:var(--dsw-alias-label-tertiary,#89939f)}
.dsh-feng-gu--peak{color:#8b2414;background:#fff0e8;border:1px solid #ef9d7b;box-shadow:0 0 0 2px #e65d2922}
.dsh-feng-gu__notice{position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:10000;padding:10px 22px;border-radius:999px;background:#fff0e8;color:#8b2414;border:1px solid #ef9d7b;box-shadow:0 8px 32px #0002;font-size:16px;pointer-events:none}
.dsh-feng-gu--pulse{animation:dsh-feng-gu-breathe 850ms ease-in-out 3}
.dsh-feng-gu__notice{animation:dsh-feng-gu-arrive 240ms ease-out}
@keyframes dsh-feng-gu-breathe{50%{box-shadow:0 0 0 7px #e65d2930;filter:brightness(1.12)}}
@keyframes dsh-feng-gu-arrive{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}
@media(prefers-reduced-motion:reduce){.dsh-feng-gu--pulse,.dsh-feng-gu__notice{animation:none}}
`;
    function Badge(props) {
      // The runtime binds a stable useSession hook per session source.
      const session = props.useSession;
      const reminder = React.useRef(createReminder());
      const [state, setState] = React.useState({ period: 'unknown', pulse: false });
      React.useEffect(() => {
        let timeout;
        let pulse = false;
        const stop = startMonitor({ session, calendar, reminder: reminder.current,
          onUpdate(period, notify) {
            if (period !== 'peak') { pulse = false; clearTimeout(timeout); }
            if (notify) {
              pulse = true;
              clearTimeout(timeout);
              timeout = setTimeout(() => {
                pulse = false;
                setState(previous => ({ ...previous, pulse: false }));
              }, 2700);
            }
            setState({ period, pulse });
          }
        });
        return () => { stop(); clearTimeout(timeout); };
      }, [session]);
      const peak = state.period === 'peak';
      const label = peak ? '梁文峰' : state.period === 'unknown' ? '时段待确认' : '梁文谷';
      const icon = peak ? el('span', { 'aria-hidden': true }, '⚠') : null;
      return el(React.Fragment, null,
        el('style', null, css),
        el('span', { className: 'dsh-feng-gu dsh-feng-gu--' + state.period + (state.pulse ? ' dsh-feng-gu--pulse' : ''), 'aria-label': label }, icon, label),
        peak && state.pulse ? el('div', { className: 'dsh-feng-gu__notice', role: 'status', 'aria-live': 'polite' }, icon, ' ', label) : null
      );
    }
    function apply(ctx) {
      ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(
        { name: 'conversation.composer.dock', id: 'feng-gu-lite', order: 100 }, Badge
      ));
    }
    return { inject: ['slots'], apply };
  }
});
