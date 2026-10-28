'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Store, DEFAULT_SETTINGS } = require('../src/main/store');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'neck-'));

test('설정 파일이 깨져 있으면 기본값으로 시작하고 .bak 으로 옮겨 둔다', () => {
  const dir = tmp();
  fs.writeFileSync(path.join(dir, 'settings.json'), '{oops');
  const s = new Store(dir);
  assert.deepEqual(s.settings, DEFAULT_SETTINGS);
  assert.ok(fs.existsSync(path.join(dir, 'settings.json.bak')));
});

test('설정은 알려진 키·같은 타입만 받는다', () => {
  const s = new Store(tmp());
  const next = s.updateSettings({ intervalMin: 45, sound: 'yes', evil: 1 });
  assert.equal(next.intervalMin, 45);
  assert.equal(next.sound, true);
  assert.equal(next.evil, undefined);
});

test('통계는 날짜별로 세고 30일 지난 기록은 지운다', () => {
  const s = new Store(tmp());
  s.bump('done', new Date(2026, 0, 1));
  s.bump('done', new Date(2026, 1, 15));
  s.bump('snoozed', new Date(2026, 1, 15));
  assert.deepEqual(s.today(new Date(2026, 1, 15)), { done: 1, quick: 0, skipped: 0, snoozed: 1, away: 0 });
  assert.equal(s.statsFile.data['2026-01-01'], undefined);
});

test('근무 시간 설정은 형식이 맞을 때만 받는다', () => {
  const s = new Store(tmp());
  assert.equal(s.updateSettings({ workStart: '25:00' }).workStart, '09:00');
  assert.equal(s.updateSettings({ workStart: '08:30' }).workStart, '08:30');
  assert.deepEqual(s.updateSettings({ workDays: [5, 1, 1, 3] }).workDays, [1, 3, 5]);
  assert.deepEqual(s.updateSettings({ workDays: [9] }).workDays, [1, 3, 5]);
});
