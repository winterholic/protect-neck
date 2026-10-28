'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Engine, MIN } = require('../src/main/engine');

const T0 = 1_700_000_000_000;
const make = (opts = {}) => {
  const e = new Engine({ intervalMin: 30, snoozeMin: 5, idleMin: 5, ...opts }, T0);
  const events = [];
  e.on((evt) => events.push(evt.type));
  return { e, events };
};

test('30분이 지나면 알림 상태가 되고 due 를 한 번만 낸다', () => {
  const { e, events } = make();
  e.tick(T0 + 29 * MIN, 0);
  assert.equal(e.mode, 'focus');
  e.tick(T0 + 30 * MIN, 0);
  e.tick(T0 + 30 * MIN + 1000, 0);
  assert.equal(e.mode, 'due');
  assert.deepEqual(events, ['due']);
});

test('5분 뒤에: 5분짜리 타이머로 다시 돈다', () => {
  const { e } = make();
  e.tick(T0 + 30 * MIN, 0);
  e.snooze(T0 + 30 * MIN);
  assert.equal(e.mode, 'focus');
  assert.equal(e.remaining(T0 + 30 * MIN), 5 * MIN);
});

test('6분 입력이 없다가 돌아오면 30분부터 새로 시작한다', () => {
  const { e, events } = make();
  const t = T0 + 18 * MIN; // 12분 남음
  e.tick(t + 6 * MIN, 6 * MIN);
  assert.equal(e.mode, 'away');
  e.tick(t + 6 * MIN + 1000, 0);
  assert.equal(e.mode, 'focus');
  assert.equal(e.remaining(t + 6 * MIN + 1000), 30 * MIN);
  assert.deepEqual(events, ['away', 'returned']);
});

test('2분 입력이 없다가 돌아오면 멈추지 않고 이어서 센다', () => {
  const { e } = make();
  const t = T0 + 18 * MIN;
  e.tick(t + 2 * MIN, 2 * MIN);
  assert.equal(e.mode, 'focus');
  assert.equal(e.remaining(t + 2 * MIN), 10 * MIN);
});

test('잠깐 화면을 잠갔다 풀면 잠근 시점의 남은 시간에서 이어간다', () => {
  const { e } = make();
  const t = T0 + 10 * MIN;
  e.lock(t);
  assert.equal(e.mode, 'away');
  e.tick(t + 60_000, 0); // 잠긴 동안에는 유휴 시간이 짧아도 돌아온 걸로 보지 않는다
  assert.equal(e.mode, 'away');
  e.unlock(t + 2 * MIN);
  assert.equal(e.mode, 'focus');
  assert.equal(e.remaining(t + 2 * MIN), 20 * MIN);
});

test('오래 잠갔다 풀면 쉰 것으로 보고 새로 시작한다', () => {
  const { e } = make();
  const t = T0 + 10 * MIN;
  e.lock(t);
  e.unlock(t + 40 * MIN);
  assert.equal(e.mode, 'focus');
  assert.equal(e.remaining(t + 40 * MIN), 30 * MIN);
});

test('알림을 띄운 채 자리를 비우면 돌아왔을 때 새로 시작한다', () => {
  const { e } = make();
  e.tick(T0 + 30 * MIN, 0);
  e.tick(T0 + 40 * MIN, 9 * MIN);
  assert.equal(e.mode, 'away');
  e.tick(T0 + 41 * MIN, 0);
  assert.equal(e.mode, 'focus');
  assert.equal(e.remaining(T0 + 41 * MIN), 30 * MIN);
});

test('일시정지는 남은 시간을 붙잡고, 다시 시작하면 거기서 이어간다', () => {
  const { e } = make();
  e.pause(T0 + 10 * MIN);
  e.tick(T0 + 50 * MIN, 0);
  assert.equal(e.mode, 'paused');
  e.resume(T0 + 50 * MIN);
  assert.equal(e.remaining(T0 + 50 * MIN), 20 * MIN);
});

test('일시정지 중에는 자리 비움으로 넘어가지 않는다', () => {
  const { e } = make();
  e.pause(T0);
  e.tick(T0 + 20 * MIN, 20 * MIN);
  assert.equal(e.mode, 'paused');
});

test('1시간 쉬기는 1시간 뒤 저절로 새 주기를 시작한다', () => {
  const { e } = make();
  e.pause(T0, 60 * MIN);
  e.tick(T0 + 59 * MIN, 0);
  assert.equal(e.mode, 'paused');
  e.tick(T0 + 60 * MIN, 0);
  assert.equal(e.mode, 'focus');
  assert.equal(e.remaining(T0 + 60 * MIN), 30 * MIN);
});

test('스트레칭·휴식 중에는 유휴로 판단하지 않는다', () => {
  const { e } = make();
  e.startStretch();
  e.tick(T0 + 10 * MIN, 10 * MIN);
  assert.equal(e.mode, 'stretch');
  e.startBreak(T0);
  e.tick(T0 + 10 * MIN, 10 * MIN);
  assert.equal(e.mode, 'break');
  e.endBreak(T0 + 12 * MIN);
  assert.equal(e.remaining(T0 + 12 * MIN), 30 * MIN);
});

test('알림 주기를 바꾸면 진행 중인 타이머를 새 주기로 다시 시작한다', () => {
  const { e } = make();
  e.applySettings({ intervalMin: 45 }, T0 + 10 * MIN);
  assert.equal(e.remaining(T0 + 10 * MIN), 45 * MIN);
  e.applySettings({ intervalMin: 45, snoozeMin: 10 }, T0 + 11 * MIN);
  assert.equal(e.remaining(T0 + 11 * MIN), 44 * MIN);
});

test('절전으로 시간이 건너뛰어도 끝나는 시각 기준으로 판단한다', () => {
  const { e } = make();
  e.tick(T0 + 3 * 60 * MIN, 0);
  assert.equal(e.mode, 'due');
});

test('미루기 뒤 알림은 처음 앉은 시점부터 센다', () => {
  const { e } = make();
  e.tick(T0 + 30 * MIN, 0);
  e.snooze(T0 + 30 * MIN);
  assert.equal(e.sittingSince, T0);
  e.skip(T0 + 35 * MIN);
  assert.equal(e.sittingSince, T0 + 35 * MIN);
});

// ---- 출퇴근 ----
const at = (h, m = 0, day = 28) => new Date(2026, 9, day, h, m).getTime(); // 2026-10-28 수요일
const WORK = { workEnabled: true, workStart: '09:00', workEnd: '18:00', workDays: [1, 2, 3, 4, 5] };

test('근무 시간 밖에 켜면 퇴근 상태로 시작한다', () => {
  const e = new Engine({ ...WORK }, at(20));
  assert.equal(e.mode, 'off');
  assert.equal(e.snapshot(at(20)).nextWorkStart, at(9, 0, 29));
});

test('퇴근 시각이 되면 멈추고 workEnd 를 낸다', () => {
  const e = new Engine({ ...WORK }, at(17, 50));
  const ev = [];
  e.on((x) => ev.push(x.type));
  e.tick(at(18, 0), 0);
  assert.equal(e.mode, 'off');
  assert.deepEqual(ev, ['workEnd']);
});

test('출근 시각이 되면 새 주기로 시작한다', () => {
  const e = new Engine({ ...WORK }, at(8, 30));
  e.tick(at(9, 0), 0);
  assert.equal(e.mode, 'focus');
  assert.equal(e.remaining(at(9, 0)), 30 * MIN);
});

test('주말에는 시작하지 않고, 다음 출근은 월요일이다', () => {
  const sat = new Date(2026, 9, 31, 10).getTime();
  const e = new Engine({ ...WORK }, sat);
  assert.equal(e.mode, 'off');
  assert.equal(new Date(e.snapshot(sat).nextWorkStart).getDay(), 1);
});

test('퇴근 후 「지금 시작」은 다음 출근 때까지 유지된다', () => {
  const e = new Engine({ ...WORK }, at(20));
  e.startAnyway(at(20));
  e.tick(at(20, 1), 0);
  assert.equal(e.mode, 'focus');
  e.tick(at(9, 0, 29), 0);
  assert.equal(e.override, false);
});

test('스트레칭 중에 퇴근 시각이 지나도 끊지 않는다', () => {
  const e = new Engine({ ...WORK }, at(17, 59));
  e.startStretch();
  e.tick(at(18, 1), 0);
  assert.equal(e.mode, 'stretch');
  e.finishStretch(at(18, 3));
  e.tick(at(18, 3), 0);
  assert.equal(e.mode, 'off');
});

test('자정을 넘기는 근무(22:00~06:00)', () => {
  const night = { ...WORK, workStart: '22:00', workEnd: '06:00' };
  assert.equal(new Engine(night, at(23)).mode, 'focus');
  assert.equal(new Engine(night, at(3)).mode, 'focus'); // 수요일 새벽 = 화요일 근무
  assert.equal(new Engine(night, at(12)).mode, 'off');
});

test('설정에서 근무 시간을 끄면 퇴근 상태가 바로 풀린다', () => {
  const e = new Engine({ ...WORK }, at(20));
  e.applySettings({ workEnabled: false }, at(20));
  assert.equal(e.mode, 'focus');
});
