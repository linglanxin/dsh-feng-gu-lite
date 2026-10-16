import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarData } from '../src/calendar.js';
import { createCalendar, periodAt } from '../src/core.js';
const calendar = createCalendar(calendarData);
const at = (date, time = '10:00:00') => periodAt(Date.parse(`${date}T${time}+08:00`), calendar);
test('2026 statutory 13 days are idle, ambiguous weekdays stay unknown', () => {
  assert.equal(calendarData.holidays.length, 13);
  assert.equal(calendarData.uncertain.length, 9);
  for (const day of calendarData.holidays) assert.equal(at(day), 'idle', day);
  for (const day of calendarData.uncertain) {
    assert.equal(at(day), 'unknown', day);
    assert.equal(at(day, '12:00:00'), 'idle', day);
  }
  assert.equal(at('2026-02-24'), 'peak');
  assert.equal(at('2026-10-08'), 'peak');
  assert.equal(at('2027-02-01'), 'unknown');
});
test('all days in 2026 official leave ranges resolve statutory/weekend idle or ambiguous unknown', () => {
  const ranges = [['01-01','01-03'],['02-15','02-23'],['04-04','04-06'],['05-01','05-05'],['06-19','06-21'],['09-25','09-27'],['10-01','10-07']];
  for (const [start,end] of ranges) {
    for (let date = Date.parse('2026-'+start+'T02:00:00Z'); date <= Date.parse('2026-'+end+'T02:00:00Z'); date += 86400000) {
      assert.notEqual(periodAt(date, calendar), 'peak', new Date(date).toISOString());
    }
  }
});
test('Intl lunar dates independently confirm Spring Festival, Dragon Boat and Mid-Autumn', () => {
  const f = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { timeZone: 'Asia/Shanghai', month: 'long', day: 'numeric' });
  for (const [date, month, day] of [['2026-02-17','正月','1'],['2026-02-18','正月','2'],['2026-02-19','正月','3'],['2026-06-19','五月','5'],['2026-09-25','八月','15']]) {
    const parts = f.formatToParts(new Date(date+'T04:00:00Z'));
    assert.equal(parts.find(p=>p.type==='month').value, month);
    assert.equal(parts.find(p=>p.type==='day').value, day);
  }
  const before = Date.parse('2026-02-17T04:00:00Z') - 86400000;
  assert.equal(new Date(before).toISOString().slice(0,10), '2026-02-16');
});
