'use strict';

// 집중 타이머 상태 기계. Electron 에 의존하지 않고 시각(now)을 인자로 받아서 단위 테스트로 시간 규칙을 검증한다.
// 남은 시간은 1초씩 빼지 않고 끝나는 시각(endsAt)과 비교한다. 절전에서 깨어나도 어긋나지 않게 하려는 것.

const { isWorkTime, nextWorkStart } = require('./schedule');

const MIN = 60 * 1000;

const MODES = Object.freeze({
  FOCUS: 'focus',
  PAUSED: 'paused',
  DUE: 'due',
  STRETCH: 'stretch',
  BREAK: 'break',
  AWAY: 'away',
  OFF: 'off',
});

// 근무 시간이 끝나면 멈추는 모드. 스트레칭·휴식 도중에는 끊지 않는다.
const STOPPABLE = new Set([MODES.FOCUS, MODES.PAUSED, MODES.DUE, MODES.AWAY]);
const NO_SCHEDULE = { workEnabled: false, workStart: '09:00', workEnd: '18:00', workDays: [1, 2, 3, 4, 5] };

class Engine {
  constructor(settings = {}, now = Date.now()) {
    this.schedule = { ...NO_SCHEDULE };
    this.configure({ intervalMin: 30, snoozeMin: 5, idleMin: 5, ...settings });
    this.listeners = new Set();
    this.locked = false;
    // 근무 시간 밖에서 「지금 시작」을 누르면 다음 출근 때까지 근무 시간을 무시한다.
    this.override = false;
    this.startFocus(now);
    this.wasWorkTime = this.isWorkTime(now);
    if (!this.wasWorkTime) this.mode = MODES.OFF;
  }

  configure({ intervalMin, snoozeMin, idleMin, workEnabled, workStart, workEnd, workDays }) {
    if (intervalMin != null) this.intervalMs = intervalMin * MIN;
    if (snoozeMin != null) this.snoozeMs = snoozeMin * MIN;
    if (idleMin != null) this.idleMs = idleMin * MIN;
    if (workEnabled != null) this.schedule.workEnabled = workEnabled;
    if (workStart != null) this.schedule.workStart = workStart;
    if (workEnd != null) this.schedule.workEnd = workEnd;
    if (workDays != null) this.schedule.workDays = workDays;
  }

  isWorkTime(now) {
    return isWorkTime(now, this.schedule);
  }

  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(type, payload = {}) {
    for (const fn of this.listeners) fn({ type, ...payload });
  }

  // keepSitting: 미루기처럼 쉬지 않고 이어 앉아 있는 경우. 알림 문구의 「n분 지났어요」를 앉은 시점부터 세려고 둔다.
  startFocus(now, durationMs = this.intervalMs, { keepSitting = false } = {}) {
    if (!keepSitting || this.sittingSince == null) this.sittingSince = now;
    this.mode = MODES.FOCUS;
    this.durationMs = durationMs;
    this.endsAt = now + durationMs;
    this.remainingMs = durationMs;
    this.pausedUntil = null;
    this.awaySince = null;
    this.breakStartedAt = null;
    this.modeBeforeAway = null;
  }

  remaining(now) {
    if (this.mode === MODES.FOCUS) return Math.max(0, this.endsAt - now);
    return this.remainingMs;
  }

  snapshot(now) {
    return {
      mode: this.mode,
      remainingMs: this.remaining(now),
      durationMs: this.durationMs,
      pausedUntil: this.pausedUntil,
      breakStartedAt: this.breakStartedAt,
      awaySince: this.awaySince,
      sittingSince: this.sittingSince,
      intervalMs: this.intervalMs,
      snoozeMs: this.snoozeMs,
      nextWorkStart: this.mode === MODES.OFF ? nextWorkStart(now, this.schedule) : null,
      override: this.override,
    };
  }

  // 1초마다 부른다. idleMs 는 OS 가 알려준 마지막 입력 이후 경과 시간.
  tick(now, idleMs = 0) {
    if (this.checkSchedule(now)) return;
    switch (this.mode) {
      case MODES.FOCUS:
        if (idleMs >= this.idleMs) {
          this.goAway(now - idleMs, now);
        } else if (now >= this.endsAt) {
          this.mode = MODES.DUE;
          this.remainingMs = 0;
          this.emit('due');
        }
        break;
      case MODES.DUE:
        if (idleMs >= this.idleMs) this.goAway(now - idleMs, now);
        break;
      case MODES.PAUSED:
        if (this.pausedUntil != null && now >= this.pausedUntil) {
          this.startFocus(now);
          this.emit('resumed');
        }
        break;
      case MODES.AWAY:
        if (!this.locked && idleMs < this.idleMs) this.comeBack(now);
        break;
      default:
        break;
    }
  }

  // 출퇴근 경계를 넘었으면 처리하고 true 를 돌려준다.
  checkSchedule(now) {
    const work = this.isWorkTime(now);
    const was = this.wasWorkTime;
    this.wasWorkTime = work;
    if (work && !was) {
      this.override = false;
      if (this.mode === MODES.OFF) {
        this.startFocus(now);
        this.emit('workStart');
        return true;
      }
    }
    if (!work && !this.override && STOPPABLE.has(this.mode)) {
      this.mode = MODES.OFF;
      this.remainingMs = 0;
      if (was) this.emit('workEnd');
      return true;
    }
    return false;
  }

  startAnyway(now) {
    if (this.mode !== MODES.OFF) return;
    this.override = true;
    this.startFocus(now);
  }

  goAway(since, now) {
    this.remainingMs = this.mode === MODES.FOCUS ? Math.max(0, this.endsAt - since) : 0;
    this.modeBeforeAway = this.mode;
    this.mode = MODES.AWAY;
    this.awaySince = since;
    this.emit('away', { since, now });
  }

  comeBack(now) {
    const awayMs = now - this.awaySince;
    if (awayMs >= this.idleMs) {
      this.startFocus(now);
      this.emit('returned', { awayMs, rested: true });
    } else {
      // 유휴 기준보다 짧게 비웠으면(잠깐 화면 잠금) 멈춘 자리에서 이어 센다.
      const before = this.modeBeforeAway;
      const left = this.remainingMs;
      this.awaySince = null;
      this.modeBeforeAway = null;
      if (before === MODES.DUE || left <= 0) {
        this.mode = MODES.DUE;
        this.remainingMs = 0;
      } else {
        this.mode = MODES.FOCUS;
        this.endsAt = now + left;
      }
      this.emit('returned', { awayMs, rested: false });
    }
  }

  lock(now) {
    this.locked = true;
    if (this.mode === MODES.FOCUS || this.mode === MODES.DUE) this.goAway(now, now);
  }

  unlock(now) {
    this.locked = false;
    if (this.mode === MODES.AWAY) this.comeBack(now);
  }

  pause(now, forMs = null) {
    if (this.mode !== MODES.FOCUS && this.mode !== MODES.PAUSED) return;
    if (this.mode === MODES.FOCUS) this.remainingMs = this.remaining(now);
    this.mode = MODES.PAUSED;
    this.pausedUntil = forMs == null ? null : now + forMs;
  }

  resume(now) {
    if (this.mode !== MODES.PAUSED) return;
    if (this.pausedUntil != null) {
      // 「1시간 쉬기」를 일찍 끝내면 새 주기로 시작한다.
      this.startFocus(now);
      return;
    }
    const left = this.remainingMs;
    this.mode = MODES.FOCUS;
    this.endsAt = now + left;
  }

  restart(now) {
    this.startFocus(now);
  }

  snooze(now) {
    this.startFocus(now, this.snoozeMs, { keepSitting: true });
  }

  skip(now) {
    this.startFocus(now);
  }

  startStretch() {
    this.mode = MODES.STRETCH;
    this.remainingMs = 0;
    this.pausedUntil = null;
  }

  finishStretch(now) {
    this.startFocus(now);
  }

  startBreak(now) {
    this.mode = MODES.BREAK;
    this.breakStartedAt = now;
    this.remainingMs = 0;
  }

  endBreak(now) {
    this.startFocus(now);
  }

  // 설정에서 주기를 바꾸면 진행 중인 집중 타이머는 새 주기로 다시 시작한다.
  applySettings(settings, now) {
    const intervalChanged = settings.intervalMin != null && settings.intervalMin * MIN !== this.intervalMs;
    this.configure(settings);
    if (intervalChanged && (this.mode === MODES.FOCUS || this.mode === MODES.PAUSED)) this.startFocus(now);
    // 근무 시간을 바꾼 결과는 바로 반영한다. 퇴근 상태였는데 지금이 근무 시간이 되면 시작한다.
    const work = this.isWorkTime(now);
    if (work && this.mode === MODES.OFF) this.startFocus(now);
    if (!work && !this.override && STOPPABLE.has(this.mode)) this.mode = MODES.OFF;
    this.wasWorkTime = work;
  }
}

module.exports = { Engine, MODES, MIN };
