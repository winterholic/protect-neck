'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_SETTINGS = Object.freeze({
  intervalMin: 30,
  snoozeMin: 5,
  idleMin: 5,
  routine: 'basic',
  reminderStyle: 'window',
  sound: true,
  launchAtLogin: false,
  workEnabled: true,
  workStart: '09:00',
  workEnd: '18:00',
  workDays: [1, 2, 3, 4, 5],
});

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const VALID = {
  workStart: (v) => HHMM.test(v),
  workEnd: (v) => HHMM.test(v),
  workDays: (v) => Array.isArray(v) && v.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
};

const STAT_KEYS = ['done', 'quick', 'skipped', 'snoozed', 'away'];
const KEEP_DAYS = 30;

function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

class JsonFile {
  constructor(file, fallback) {
    this.file = file;
    this.data = this.read(fallback);
  }

  read(fallback) {
    let raw;
    try {
      raw = fs.readFileSync(this.file, 'utf8');
    } catch {
      return structuredClone(fallback);
    }
    try {
      return JSON.parse(raw);
    } catch {
      // 깨진 파일은 지우지 않고 옆에 남겨 둔다.
      try { fs.renameSync(this.file, `${this.file}.bak`); } catch { /* 이름 변경 실패는 무시하고 기본값으로 시작 */ }
      return structuredClone(fallback);
    }
  }

  write() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    fs.renameSync(tmp, this.file);
  }
}

class Store {
  constructor(dir) {
    this.settingsFile = new JsonFile(path.join(dir, 'settings.json'), DEFAULT_SETTINGS);
    this.statsFile = new JsonFile(path.join(dir, 'stats.json'), {});
  }

  get settings() {
    return { ...DEFAULT_SETTINGS, ...this.settingsFile.data };
  }

  updateSettings(patch) {
    const next = { ...this.settings };
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      const v = patch[key];
      if (v === undefined || typeof v !== typeof DEFAULT_SETTINGS[key]) continue;
      if (VALID[key] && !VALID[key](v)) continue;
      next[key] = key === 'workDays' ? [...new Set(v)].sort() : v;
    }
    this.settingsFile.data = next;
    this.settingsFile.write();
    return next;
  }

  today(date = new Date()) {
    const day = this.statsFile.data[dayKey(date)] || {};
    return Object.fromEntries(STAT_KEYS.map((k) => [k, day[k] || 0]));
  }

  bump(key, date = new Date()) {
    if (!STAT_KEYS.includes(key)) return;
    const k = dayKey(date);
    const day = { ...this.today(date) };
    day[key] += 1;
    this.statsFile.data[k] = day;
    this.prune(date);
    this.statsFile.write();
  }

  prune(date) {
    const cutoff = new Date(date);
    cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
    const limit = dayKey(cutoff);
    for (const k of Object.keys(this.statsFile.data)) {
      if (k < limit) delete this.statsFile.data[k];
    }
  }
}

module.exports = { Store, DEFAULT_SETTINGS, dayKey };
