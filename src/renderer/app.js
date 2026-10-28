'use strict';

const $ = (id) => document.getElementById(id);
const IMG_DIR = '../../assets/stretch/';
const RING_LEN = 2 * Math.PI * 90;
const DONE_RETURN_MS = 3000;

let state = null;
let overlay = null; // 'settings' | 'done' — 메인 프로세스 상태와 별개로 화면에서만 띄우는 것
let doneTimer = null;

const fmt = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const clock = (ts) => new Date(ts).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });

// 버튼에 붙이는 대략 시간. 30초 단위로 반올림한다.
function minutesLabel(sec) {
  if (sec < 50) return `${Math.round(sec / 10) * 10}초`;
  const halves = Math.round(sec / 30);
  const m = Math.floor(halves / 2);
  return halves % 2 ? `${m}분 30초` : `${m}분`;
}

// ---------- 화면 전환 ----------

const VIEW_BY_MODE = {
  focus: 'home',
  paused: 'home',
  away: 'home',
  off: 'home',
  due: 'due',
  stretch: 'stretch',
  break: 'break',
};

function show(view) {
  for (const el of document.querySelectorAll('.view')) el.hidden = el.id !== `view-${view}`;
}

function render() {
  if (!state) return;
  Sound.setEnabled(state.settings.sound);
  const view = overlay || VIEW_BY_MODE[state.mode] || 'home';
  show(view);
  if (view === 'home') renderHome();
  if (view === 'due') renderDue();
  if (view === 'break') renderBreak();
}

// ---------- 홈 ----------

const STATUS = {
  focus: '집중 중',
  paused: '일시정지',
  away: '자리 비움',
  off: '퇴근',
};

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function dayClock(ts) {
  const d = new Date(ts);
  const today = new Date();
  const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
  const day = diff === 0 ? '오늘' : diff === 1 ? '내일' : `${DAY_NAMES[d.getDay()]}요일`;
  return `${day} ${clock(ts)}`;
}

function renderHome() {
  const s = state;
  const ring = $('ring');
  const idle = s.mode !== 'focus';
  ring.classList.toggle('is-idle', idle);
  const off = s.mode === 'off';
  ring.classList.toggle('is-off', off);
  $('home-time').textContent = off ? '퇴근' : fmt(s.mode === 'away' ? s.intervalMs : s.remainingMs);
  $('home-status').textContent = off ? '오늘은 여기까지' : STATUS[s.mode] || '';

  const ratio = s.mode === 'off' ? 0 : s.durationMs ? s.remainingMs / s.durationMs : 1;
  $('ring-fill').style.strokeDashoffset = String(RING_LEN * (1 - ratio));

  let hint = '';
  if (s.mode === 'focus') hint = `${clock(Date.now() + s.remainingMs)}에 알려 드릴게요`;
  if (s.mode === 'paused') hint = s.pausedUntil ? `${clock(s.pausedUntil)}에 다시 시작해요` : '다시 시작을 누를 때까지 멈춰 있어요';
  if (s.mode === 'away') hint = '돌아오면 새로 시작해요';
  if (s.mode === 'off') hint = s.nextWorkStart ? `${dayClock(s.nextWorkStart)} 출근 때 다시 시작해요` : '근무 요일이 없어요. 설정에서 골라 주세요';
  if (s.mode === 'focus' && s.override) hint += ' · 근무 시간 밖';
  $('home-hint').textContent = hint;

  const pauseBtn = $('toggle-pause');
  pauseBtn.textContent = s.mode === 'off' ? '지금 시작' : s.mode === 'paused' ? '다시 시작' : '일시정지';
  pauseBtn.disabled = s.mode === 'away';
  $('restart').disabled = s.mode === 'off';
  $('stretch-now').disabled = false;

  renderToday();
}

function renderToday() {
  const t = state.today;
  const dl = $('today-stats');
  const total = t.done + t.quick + t.skipped + t.snoozed + t.away;
  if (total === 0) {
    dl.innerHTML = '<p class="today-empty">아직 스트레칭 안 했어요</p>';
    return;
  }
  const items = [
    ['스트레칭', t.done + t.quick],
    ['자리 비움', t.away],
    ['미룸', t.snoozed],
    ['건너뜀', t.skipped],
  ];
  dl.innerHTML = items.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}

$('toggle-pause').addEventListener('click', () => {
  if (state.mode === 'off') act('startAnyway');
  else act(state.mode === 'paused' ? 'resume' : 'pause');
});
$('restart').addEventListener('click', () => act('restart'));
$('stretch-now').addEventListener('click', () => startStretch(state.settings.routine));
$('open-settings').addEventListener('click', openSettings);

// ---------- 알림 ----------

function renderDue() {
  const minutes = Math.max(1, Math.round((Date.now() - state.sittingSince) / 60000));
  $('due-title').textContent = `${minutes}분 지났어요`;
  $('due-snooze').textContent = `${Math.round(state.snoozeMs / 60000)}분 뒤에`;
}

function fillRoutineMeta() {
  $('due-basic-meta').textContent = `· ${minutesLabel(Routines.totalSeconds('basic'))}`;
  $('due-quick-meta').textContent = minutesLabel(Routines.totalSeconds('quick'));
}

$('due-basic').addEventListener('click', () => startStretch('basic'));
$('due-quick').addEventListener('click', () => startStretch('quick'));
$('due-snooze').addEventListener('click', () => act('snooze'));
$('due-break').addEventListener('click', () => act('startBreak'));
$('due-skip').addEventListener('click', () => act('skip'));

// ---------- 스트레칭 ----------

const runner = {
  routine: 'basic',
  phases: [],
  index: 0,
  endsAt: 0,
  leftMs: 0,
  running: false,
  loop: null,
};

async function startStretch(routine) {
  clearOverlay();
  await act('startStretch');
  runner.routine = routine;
  runner.phases = Routines.buildPhases(routine);
  $('st-resume').hidden = true;
  $('st-controls').hidden = false;
  enterPhase(0);
  play();
}

function enterPhase(i) {
  runner.index = i;
  const p = runner.phases[i];
  runner.leftMs = p.seconds * 1000;
  runner.endsAt = performance.now() + runner.leftMs;
  if (p.kind === 'hold') Sound.hold();
  else Sound.rest();
  drawStretch();
}

function play() {
  runner.running = true;
  runner.endsAt = performance.now() + runner.leftMs;
  clearInterval(runner.loop);
  runner.loop = setInterval(stepLoop, 200);
  $('st-pause').textContent = '일시정지';
}

function pause() {
  if (!runner.running) return;
  runner.running = false;
  runner.leftMs = Math.max(0, runner.endsAt - performance.now());
  clearInterval(runner.loop);
  $('st-pause').textContent = '계속';
}

function stepLoop() {
  const left = runner.endsAt - performance.now();
  if (left <= 0) {
    if (runner.index + 1 >= runner.phases.length) finishStretch(true);
    else enterPhase(runner.index + 1);
    return;
  }
  runner.leftMs = left;
  drawCount();
}

function jumpStep(delta) {
  const cur = runner.phases[runner.index].stepIndex;
  const target = cur + delta;
  // 「이전」은 지금 동작을 처음부터 다시 하는 게 아니라 앞 동작으로 간다.
  const i = runner.phases.findIndex((p) => p.stepIndex === target && p.kind !== 'ready');
  if (target < 0) return enterPhase(firstPhaseOf(0));
  if (i === -1) return finishStretch(true);
  enterPhase(i);
}

function firstPhaseOf(stepIndex) {
  return runner.phases.findIndex((p) => p.stepIndex === stepIndex && p.kind !== 'ready');
}

async function finishStretch(completed) {
  clearInterval(runner.loop);
  runner.running = false;
  const after = await act('finishStretch', { completed, routine: runner.routine });
  if (!completed) return;
  Sound.done();
  overlay = 'done';
  $('done-sub').textContent = `다음 알림은 ${clock(Date.now() + after.remainingMs)}에 드릴게요.`;
  render();
  clearTimeout(doneTimer);
  doneTimer = setTimeout(clearOverlay, DONE_RETURN_MS);
}

const PHASE_LABEL = { ready: '준비', hold: '유지', rest: '풀기', switch: '반대쪽 준비' };

function drawStretch() {
  const p = runner.phases[runner.index];
  const steps = Routines.ROUTINES[runner.routine].steps.length;
  const img = $('st-photo');
  const src = IMG_DIR + p.step.image;
  if (!img.src.endsWith(p.step.image)) {
    img.hidden = false;
    $('st-fallback').hidden = true;
    img.src = src;
  }
  img.alt = `${p.step.name} 자세`;
  img.classList.toggle('is-mirror', p.mirror);
  $('st-fallback').textContent = p.step.name;

  $('st-step').textContent = `${p.stepIndex + 1} / ${steps}`;
  const side = $('st-side');
  side.hidden = !p.side;
  side.textContent = p.side ? `${p.side}` : '';

  $('st-name').textContent = p.step.name;
  $('st-cue').textContent = p.step.cue;

  const label = p.kind === 'hold' && !p.reps && !p.side ? '천천히' : PHASE_LABEL[p.kind];
  const phase = $('st-phase');
  phase.textContent = label;
  phase.classList.toggle('is-rest', p.kind !== 'hold');

  const reps = $('st-reps');
  if (p.reps) {
    reps.hidden = false;
    reps.setAttribute('aria-label', `${p.reps}회 중 ${p.rep}회째`);
    reps.innerHTML = Array.from({ length: p.reps }, (_, k) => {
      const n = k + 1;
      const cls = n < p.rep || (n === p.rep && p.kind === 'rest') ? 'is-done' : n === p.rep ? 'is-now' : '';
      return `<li class="${cls}"></li>`;
    }).join('');
  } else {
    reps.hidden = true;
  }

  $('st-prev').disabled = p.stepIndex === 0;
  $('st-next').textContent = p.stepIndex === steps - 1 ? '마치기' : '다음';
  drawCount();
}

function drawCount() {
  $('st-seconds').textContent = String(Math.max(1, Math.ceil(runner.leftMs / 1000)));
  const total = runner.phases.reduce((s, p) => s + p.seconds, 0);
  const done = runner.phases.slice(0, runner.index).reduce((s, p) => s + p.seconds, 0)
    + (runner.phases[runner.index].seconds - runner.leftMs / 1000);
  const pct = Math.min(100, (done / total) * 100);
  $('st-progress-fill').style.width = `${pct}%`;
  $('st-progress').setAttribute('aria-valuenow', String(Math.round(pct)));
}

$('st-photo').addEventListener('error', () => {
  $('st-photo').hidden = true;
  $('st-fallback').hidden = false;
});
$('st-pause').addEventListener('click', () => (runner.running ? pause() : play()));
$('st-prev').addEventListener('click', () => jumpStep(-1));
$('st-next').addEventListener('click', () => jumpStep(1));
$('st-stop').addEventListener('click', () => finishStretch(false));
$('st-resume-yes').addEventListener('click', () => {
  $('st-resume').hidden = true;
  $('st-controls').hidden = false;
  play();
});
$('st-resume-no').addEventListener('click', () => finishStretch(false));

// ---------- 완료 ----------

function clearOverlay() {
  clearTimeout(doneTimer);
  overlay = null;
  render();
}

$('done-home').addEventListener('click', clearOverlay);

// ---------- 휴식 ----------

function renderBreak() {
  $('break-time').textContent = fmt(Date.now() - state.breakStartedAt);
}

$('break-back').addEventListener('click', () => act('endBreak'));

// ---------- 설정 ----------

const form = $('settings');
const INTERVAL = { min: 15, max: 90 };

function buildSettingsForm() {
  const days = $('work-days');
  // 월요일부터 보여준다. 값은 Date#getDay 기준(일=0).
  for (const d of [1, 2, 3, 4, 5, 6, 0]) {
    days.insertAdjacentHTML('beforeend',
      `<label class="day"><input type="checkbox" name="workDay" value="${d}" aria-label="${DAY_NAMES[d]}요일"><span>${DAY_NAMES[d]}</span></label>`);
  }
  $('set-routine').dataset.options = Object.entries(Routines.ROUTINES)
    .map(([key, r]) => `${key}:${r.name.replace(' 루틴', '')} ${minutesLabel(Routines.totalSeconds(key))}`)
    .join(',');
  for (const seg of form.querySelectorAll('.seg')) {
    seg.innerHTML = seg.dataset.options.split(',').map((pair) => {
      const [value, label] = pair.split(':');
      return `<label class="seg-opt"><input type="radio" name="${seg.dataset.name}" value="${value}"><span>${label}</span></label>`;
    }).join('');
  }
}

function fillSettings() {
  const s = state.settings;
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.name === 'workDay') el.checked = s.workDays.includes(Number(el.value));
    else if (el.type === 'radio') el.checked = String(s[el.name]) === el.value;
    else if (el.type === 'checkbox') el.checked = !!s[el.name];
  }
  $('interval-value').textContent = `${s.intervalMin}분`;
  for (const b of form.querySelectorAll('.stepper-btn')) {
    const next = s.intervalMin + Number(b.dataset.step);
    b.disabled = next < INTERVAL.min || next > INTERVAL.max;
  }
  for (const b of form.querySelectorAll('.time-btn')) b.textContent = timeLabel(s[b.dataset.name]);
  $('work-fields').classList.toggle('is-off', !s.workEnabled);
}

function openSettings() {
  fillSettings();
  $('settings-saved').textContent = '';
  overlay = 'settings';
  render();
}

async function save(patch) {
  state = await window.neck.saveSettings(patch);
  fillSettings();
  const s = state.settings;
  $('settings-saved').textContent = s.workEnabled && s.workStart === s.workEnd
    ? '출근과 퇴근이 같으면 근무 요일 하루 종일 켜 둬요'
    : '저장했어요';
}

form.addEventListener('change', (e) => {
  const el = e.target;
  if (!el.name) return;
  if (el.name === 'workDay') {
    save({ workDays: [...form.querySelectorAll('input[name=workDay]:checked')].map((d) => Number(d.value)) });
  } else if (el.type === 'checkbox') {
    save({ [el.name]: el.checked });
  } else {
    save({ [el.name]: /Min$/.test(el.name) ? Number(el.value) : el.value });
  }
});

for (const b of form.querySelectorAll('.stepper-btn')) {
  b.addEventListener('click', () => {
    const next = state.settings.intervalMin + Number(b.dataset.step);
    if (next >= INTERVAL.min && next <= INTERVAL.max) save({ intervalMin: next });
  });
}

// ---------- 시각 선택 창 ----------

const pop = $('time-pop');
const hourList = $('time-hours');
const minList = $('time-mins');
const pad = (n) => String(n).padStart(2, '0');
let picking = null; // { btn, name, h, m, col }

function timeLabel(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${pad(m)}`;
}

const hourLabel = (h) => `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시`;

function drawPicker() {
  const { h, m } = picking;
  const mins = Array.from({ length: 12 }, (_, i) => i * 5);
  if (!mins.includes(m)) {
    mins.push(m);
    mins.sort((a, b) => a - b);
  }
  hourList.innerHTML = Array.from({ length: 24 }, (_, i) =>
    `<li class="time-opt" role="option" id="th-${i}" data-h="${i}" aria-selected="${i === h}">${hourLabel(i)}</li>`).join('');
  minList.innerHTML = mins.map((i) =>
    `<li class="time-opt" role="option" id="tm-${i}" data-m="${i}" aria-selected="${i === m}">${pad(i)}분</li>`).join('');
  markActive();
}

function markActive() {
  for (const li of pop.querySelectorAll('.is-active')) li.classList.remove('is-active');
  const id = picking.col === 'h' ? `th-${picking.h}` : `tm-${picking.m}`;
  const li = $(id);
  if (!li) return;
  li.classList.add('is-active');
  const list = picking.col === 'h' ? hourList : minList;
  list.setAttribute('aria-activedescendant', id);
  list.focus({ preventScroll: true });
  li.scrollIntoView({ block: 'nearest' });
}

function openPicker(btn) {
  const [h, m] = state.settings[btn.dataset.name].split(':').map(Number);
  picking = { btn, name: btn.dataset.name, h, m, col: 'h' };
  hourList.tabIndex = 0;
  minList.tabIndex = 0;
  pop.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
  drawPicker();
  // 버튼 오른쪽 끝에 맞춰 아래로 연다. 창 아래가 모자라면 위로 연다.
  const r = btn.getBoundingClientRect();
  const pr = pop.getBoundingClientRect();
  const below = r.bottom + 4 + pr.height <= window.innerHeight - 8;
  pop.style.top = `${below ? r.bottom + 4 : Math.max(8, r.top - 4 - pr.height)}px`;
  pop.style.left = `${Math.max(8, r.right - pr.width)}px`;
  for (const [list, v] of [[hourList, `th-${h}`], [minList, `tm-${m}`]]) {
    const li = $(v);
    if (li) list.scrollTop = li.offsetTop - list.clientHeight / 2 + li.offsetHeight / 2;
  }
}

function closePicker({ refocus = true } = {}) {
  if (!picking) return;
  const { btn } = picking;
  picking = null;
  pop.hidden = true;
  btn.setAttribute('aria-expanded', 'false');
  if (refocus) btn.focus();
}

function pickTime(h, m, done) {
  picking.h = h;
  picking.m = m;
  save({ [picking.name]: `${pad(h)}:${pad(m)}` });
  if (done) closePicker();
  else drawPicker();
}

for (const b of form.querySelectorAll('.time-btn')) {
  b.setAttribute('aria-expanded', 'false');
  b.addEventListener('click', () => (picking?.btn === b ? closePicker() : openPicker(b)));
}

hourList.addEventListener('click', (e) => {
  const li = e.target.closest('[data-h]');
  if (!li) return;
  picking.col = 'm';
  pickTime(Number(li.dataset.h), picking.m, false);
});

minList.addEventListener('click', (e) => {
  const li = e.target.closest('[data-m]');
  if (li) pickTime(picking.h, Number(li.dataset.m), true);
});

pop.addEventListener('keydown', (e) => {
  if (!picking) return;
  const mins = [...minList.querySelectorAll('[data-m]')].map((li) => Number(li.dataset.m));
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const d = e.key === 'ArrowDown' ? 1 : -1;
    if (picking.col === 'h') picking.h = (picking.h + d + 24) % 24;
    else picking.m = mins[(mins.indexOf(picking.m) + d + mins.length) % mins.length];
    markActive();
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    picking.col = e.key === 'ArrowRight' ? 'm' : 'h';
    markActive();
  } else if (e.key === 'Enter' || e.key === ' ') {
    const done = picking.col === 'm';
    if (!done) picking.col = 'm';
    pickTime(picking.h, picking.m, done);
  } else if (e.key === 'Tab') {
    closePicker();
    return;
  } else {
    return;
  }
  e.preventDefault();
});

document.addEventListener('mousedown', (e) => {
  if (picking && !pop.contains(e.target) && e.target !== picking.btn) closePicker({ refocus: false });
});
form.addEventListener('scroll', () => closePicker({ refocus: false }));

$('close-settings').addEventListener('click', () => {
  closePicker({ refocus: false });
  clearOverlay();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && picking) return closePicker();
  if (e.key === 'Escape' && overlay === 'settings') clearOverlay();
  if (e.key === ' ' && state?.mode === 'stretch' && e.target === document.body) {
    e.preventDefault();
    runner.running ? pause() : play();
  }
});

// ---------- 메인 프로세스 연결 ----------

async function act(name, arg) {
  state = await window.neck.action(name, arg);
  render();
  return state;
}

window.neck.onState((s) => {
  state = s;
  // 스트레칭 화면은 자체 타이머로 그리므로 매초 다시 그리지 않는다.
  if (overlay || s.mode !== 'stretch') render();
});

window.neck.onRemind(() => {
  clearOverlay();
  Sound.remind();
});

window.neck.onLocked(() => {
  if (state?.mode !== 'stretch' || !runner.running) return;
  pause();
  $('st-controls').hidden = true;
  $('st-resume').hidden = false;
});

window.neck.onStartStretch(() => {
  if (state?.mode !== 'stretch') startStretch(state.settings.routine);
});

(async function init() {
  buildSettingsForm();
  fillRoutineMeta();
  state = await window.neck.getState();
  // 창을 새로 고쳐 진행 중이던 루틴을 잃었으면 타이머로 돌려놓는다.
  if (state.mode === 'stretch') state = await window.neck.action('restart');
  render();
})();
