'use strict';

// 출퇴근 시간 판정. 시각은 그 컴퓨터의 현지 시간 기준이다.
// 퇴근이 출근보다 이르면(예: 22:00~06:00) 자정을 넘기는 근무로 본다.

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};

function isWorkTime(ts, { workEnabled, workStart, workEnd, workDays }) {
  if (!workEnabled) return true;
  const d = new Date(ts);
  const now = d.getHours() * 60 + d.getMinutes();
  const start = toMinutes(workStart);
  const end = toMinutes(workEnd);
  if (start === end) return workDays.includes(d.getDay());
  if (start < end) return workDays.includes(d.getDay()) && now >= start && now < end;
  // 자정을 넘기는 근무: 퇴근 전 새벽 시간은 전날 근무로 친다.
  if (now >= start) return workDays.includes(d.getDay());
  if (now < end) return workDays.includes((d.getDay() + 6) % 7);
  return false;
}

// 다음 출근 시각. 근무 요일이 하나도 없으면 null.
function nextWorkStart(ts, schedule) {
  if (!schedule.workEnabled || schedule.workDays.length === 0) return null;
  const start = toMinutes(schedule.workStart);
  const d = new Date(ts);
  for (let i = 0; i <= 7; i += 1) {
    const c = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i, Math.floor(start / 60), start % 60);
    if (c.getTime() > ts && schedule.workDays.includes(c.getDay())) return c.getTime();
  }
  return null;
}

module.exports = { isWorkTime, nextWorkStart, toMinutes };
