import test from 'node:test';
import assert from 'node:assert/strict';
import { beijingParts, createCalendar, periodAt, createReminder, startMonitor } from '../src/core.js';
const ms = value => Date.parse(value + '+08:00');
const calendar = createCalendar({ years: [2026], holidays: ['2026-10-01'], uncertain: ['2026-10-02'] });
test('Beijing conversion is host-timezone independent and crosses UTC day/year', () => {
  assert.deepEqual(beijingParts(Date.parse('2025-12-31T16:00:00Z')), { date: '2026-01-01', year: 2026, weekday: 4, minute: 0 });
  assert.equal(beijingParts(Date.parse('2026-06-21T17:01:00Z')).date, '2026-06-22');
  assert.throws(() => beijingParts(NaN), TypeError);
});
test('four half-open boundaries at second precision', () => {
  for (const [time, expected] of [['08:59:59','idle'],['09:00:00','peak'],['11:59:59','peak'],['12:00:00','idle'],['13:59:59','idle'],['14:00:00','peak'],['17:59:59','peak'],['18:00:00','idle']]) {
    assert.equal(periodAt(ms('2026-06-22T' + time), calendar), expected, time);
  }
});
test('weekends (including make-up weekend) and holidays idle', () => {
  for (const day of ['2026-06-20', '2026-06-21', '2026-02-14', '2026-10-01']) assert.equal(periodAt(ms(day + 'T10:00:00'), calendar), 'idle');
});
test('uncovered year or ambiguous peak weekday is unknown, provable idle remains idle', () => {
  assert.equal(periodAt(ms('2027-06-21T10:00:00'), calendar), 'unknown');
  assert.equal(periodAt(ms('2026-10-02T10:00:00'), calendar), 'unknown');
  assert.equal(periodAt(ms('2027-06-21T22:00:00'), calendar), 'idle');
  assert.equal(periodAt(ms('2027-06-20T10:00:00'), calendar), 'idle');
});
test('calendar data is injectable and copied', () => {
  const days = ['2026-06-22'];
  const injected = createCalendar({ years: [2026], holidays: days });
  days.length = 0;
  assert.equal(periodAt(ms('2026-06-22T10:00:00'), injected), 'idle');
});
test('enter peak, initial peak, open/switch session notify once; refresh never repeats', () => {
  const r = createReminder();
  assert.equal(r.update('A', 'idle'), false);
  assert.equal(r.update('A', 'peak'), true);
  assert.equal(r.update('A', 'peak'), false);
  assert.equal(r.update('B', 'peak'), true);
  assert.equal(r.update('B', 'peak'), false);
  assert.equal(r.update('A', 'peak'), true);
  assert.equal(r.update('A', 'idle'), false);
  assert.equal(r.update('A', 'peak'), true);
  assert.equal(createReminder().update('new', 'peak'), true);
});
test('monitor clears interval/listener and ignores stale callback after cleanup', () => {
  let tick, listener, removed = false, cleared = false, count = 0;
  const timers = { setInterval(fn, delay) { tick = fn; assert.equal(delay, 1000); return 7; }, clearInterval(id) { assert.equal(id, 7); cleared = true; } };
  const events = { addEventListener(name, fn) { assert.equal(name, 'visibilitychange'); listener = fn; }, removeEventListener(name, fn) { assert.equal(name, 'visibilitychange'); assert.equal(fn, listener); removed = true; } };
  const stop = startMonitor({ session: 'A', calendar, reminder: createReminder(), now: () => ms('2026-06-22T10:00:00'), timers, events, onUpdate(period, remind) { assert.equal(period, 'peak'); assert.equal(remind, count === 0); count++; } });
  tick(); listener(); assert.equal(count, 3); stop(); tick(); listener(); assert.equal(count, 3); assert.ok(cleared && removed);
});
