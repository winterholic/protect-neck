'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { ROUTINES, STEPS, buildPhases, totalSeconds } = require('../src/shared/routines');

test('기본 루틴은 6분 안팎, 빠른 루틴은 2분 안팎이다', () => {
  const basic = totalSeconds('basic');
  const quick = totalSeconds('quick');
  assert.ok(basic >= 300 && basic <= 390, `basic=${basic}`);
  assert.ok(quick >= 100 && quick <= 150, `quick=${quick}`);
});

test('모든 동작은 30초 이상, 양쪽 동작은 한쪽당 30초 이상이다', () => {
  for (const key of Object.keys(ROUTINES)) {
    const phases = buildPhases(key).filter((p) => p.kind !== 'ready');
    const byStep = new Map();
    for (const p of phases) {
      const k = `${p.stepIndex}:${p.side || ''}`;
      if (p.kind !== 'switch') byStep.set(k, (byStep.get(k) || 0) + p.seconds);
    }
    for (const [k, sec] of byStep) assert.ok(sec >= 30, `${key} ${k} = ${sec}초`);
  }
});

test('양쪽 동작은 첫쪽 → 전환 → 반대쪽(사진 반전) 순서다', () => {
  const ph = buildPhases('basic').filter((p) => p.step.id === 'upper_trap');
  assert.deepEqual(ph.map((p) => [p.kind, p.side, p.mirror]), [
    ['hold', '오른쪽', false],
    ['switch', '왼쪽', true],
    ['hold', '왼쪽', true],
  ]);
});

test('반복 동작은 마지막 반복 뒤에 쉬는 구간을 넣지 않는다', () => {
  const ph = buildPhases('basic').filter((p) => p.step.id === 'chin_tuck');
  assert.equal(ph.filter((p) => p.kind === 'hold').length, 6);
  assert.equal(ph.filter((p) => p.kind === 'rest').length, 5);
  assert.equal(ph.at(-1).kind, 'hold');
});

test('루틴이 쓰는 사진 파일이 모두 있다', () => {
  const ids = new Set(Object.values(ROUTINES).flatMap((r) => r.steps.map((s) => s.id)));
  for (const id of ids) {
    const file = path.join(__dirname, '..', 'assets', 'stretch', STEPS[id].image);
    assert.ok(fs.existsSync(file), `${id}: ${file}`);
  }
});
