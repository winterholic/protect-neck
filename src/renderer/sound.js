'use strict';

// 효과음은 파일 없이 Web Audio 로 만든다. 화면을 안 보고 따라 할 수 있게 구간이 바뀔 때마다 울린다.
window.Sound = (() => {
  let ctx = null;
  let enabled = true;

  function audio() {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, gain = 0.12) {
    const a = audio();
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = a.currentTime + start;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(a.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  const play = (fn) => () => {
    if (!enabled) return;
    try { fn(); } catch { /* 오디오 장치가 없으면 소리 없이 진행 */ }
  };

  return {
    setEnabled(v) { enabled = !!v; },
    hold: play(() => tone(880, 0, 0.18)),
    rest: play(() => tone(587, 0, 0.18, 0.08)),
    remind: play(() => { tone(659, 0, 0.35); tone(880, 0.18, 0.5); }),
    done: play(() => { tone(523, 0, 0.3); tone(659, 0.12, 0.3); tone(784, 0.24, 0.5); }),
  };
})();
