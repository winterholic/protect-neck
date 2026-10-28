'use strict';

// 렌더러(<script>)와 Node(테스트) 양쪽에서 읽는다.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Routines = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // side: 사진 속 사람이 하는 쪽. 반대쪽은 사진을 좌우 반전해서 보여준다.
  const STEPS = {
    shoulder_roll: {
      name: '어깨 돌리기',
      cue: '어깨를 귀까지 끌어올렸다가 뒤로 크게 돌려 내려요.',
      image: 'shoulder_roll.jpg',
    },
    chin_tuck: {
      name: '턱 당기기',
      cue: '시선은 정면 그대로, 턱을 수평으로 뒤로 밀어 넣어요. 고개를 숙이지 않아요.',
      image: 'chin_tuck.jpg',
    },
    upper_trap: {
      name: '옆목 늘리기',
      cue: '한 손은 의자를 잡아 어깨를 내리고, 반대 손으로 머리를 옆으로 지그시 당겨요.',
      image: 'upper_trap.jpg',
      side: 'right',
    },
    levator: {
      name: '뒷목 대각선 늘리기',
      cue: '고개를 45도 돌려 겨드랑이를 보듯 숙이고, 손은 뒤통수에 얹어 무게만 실어요.',
      image: 'levator.jpg',
      side: 'left',
    },
    chest_open: {
      name: '가슴 열기',
      cue: '등 뒤로 깍지를 끼고 팔을 펴며 날개뼈를 모아요. 고개는 들지 않아요.',
      image: 'chest_open.jpg',
    },
    w_retraction: {
      name: '날개뼈 모으기',
      cue: '팔을 W자로 만들고 팔꿈치를 아래·뒤로 당겨 날개뼈를 꽉 모아요.',
      image: 'w_retraction.jpg',
    },
    external_rotation: {
      name: '팔 바깥으로 벌리기',
      cue: '팔꿈치를 옆구리에 붙이고 직각으로 굽힌 채, 팔을 문 열듯 바깥으로 벌려 가슴을 펴요.',
      image: 'external_rotation.jpg',
    },
    neck_isometric: {
      name: '목 버티기',
      cue: '깍지 낀 손으로 뒤통수를 받치고, 머리는 움직이지 않은 채 뒤로 밀어요.',
      image: 'neck_isometric.jpg',
    },
  };

  // 동작마다 최소 30초, 양쪽 동작은 한쪽당 30초를 채운다. 스트레칭은 30초는 유지해야 효과가 있다는 사용자 요청.
  const ROUTINES = {
    basic: {
      name: '기본 루틴',
      steps: [
        { id: 'shoulder_roll', type: 'timed', seconds: 30 },
        { id: 'chin_tuck', type: 'reps', reps: 6, hold: 5, rest: 2 },
        { id: 'upper_trap', type: 'sides', seconds: 30, rest: 3 },
        { id: 'levator', type: 'sides', seconds: 30, rest: 3 },
        { id: 'chest_open', type: 'timed', seconds: 30 },
        { id: 'external_rotation', type: 'reps', reps: 10, hold: 2, rest: 2 },
        { id: 'w_retraction', type: 'reps', reps: 8, hold: 3, rest: 1 },
        { id: 'neck_isometric', type: 'reps', reps: 5, hold: 5, rest: 2 },
      ],
    },
    quick: {
      name: '빠른 루틴',
      steps: [
        { id: 'chin_tuck', type: 'reps', reps: 6, hold: 5, rest: 1 },
        { id: 'upper_trap', type: 'sides', seconds: 30, rest: 3 },
        { id: 'external_rotation', type: 'reps', reps: 10, hold: 2, rest: 2 },
      ],
    },
  };

  const READY_SECONDS = 3;
  const SIDE_LABEL = { left: '왼쪽', right: '오른쪽' };
  const other = (side) => (side === 'left' ? 'right' : 'left');

  // 루틴을 「한 번에 하나씩 세는 구간」 목록으로 펼친다. 화면은 이 목록을 순서대로 재생만 한다.
  function buildPhases(routineKey) {
    const routine = ROUTINES[routineKey] || ROUTINES.basic;
    const phases = [];
    routine.steps.forEach((s, stepIndex) => {
      const step = { ...STEPS[s.id], id: s.id };
      const base = { stepIndex, step, side: null, mirror: false, rep: null, reps: null };
      if (stepIndex === 0) phases.push({ ...base, kind: 'ready', seconds: READY_SECONDS });
      if (s.type === 'timed') {
        phases.push({ ...base, kind: 'hold', seconds: s.seconds });
      } else if (s.type === 'reps') {
        for (let r = 1; r <= s.reps; r += 1) {
          phases.push({ ...base, kind: 'hold', seconds: s.hold, rep: r, reps: s.reps });
          if (r < s.reps) phases.push({ ...base, kind: 'rest', seconds: s.rest, rep: r, reps: s.reps });
        }
      } else if (s.type === 'sides') {
        const first = step.side || 'right';
        const second = other(first);
        phases.push({ ...base, kind: 'hold', seconds: s.seconds, side: SIDE_LABEL[first] });
        phases.push({ ...base, kind: 'switch', seconds: s.rest, side: SIDE_LABEL[second], mirror: true });
        phases.push({ ...base, kind: 'hold', seconds: s.seconds, side: SIDE_LABEL[second], mirror: true });
      }
    });
    return phases;
  }

  function totalSeconds(routineKey) {
    return buildPhases(routineKey).reduce((sum, p) => sum + p.seconds, 0);
  }

  return { STEPS, ROUTINES, buildPhases, totalSeconds };
});
