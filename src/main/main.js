'use strict';

const path = require('path');
const {
  app, BrowserWindow, Tray, Menu, Notification, ipcMain, powerMonitor, nativeImage, shell,
} = require('electron');
const { Engine, MODES } = require('./engine');
const { Store } = require('./store');

const APP_NAME = '목 건강 지킴이';
const ASSETS = path.join(__dirname, '..', '..', 'assets');
const isMac = process.platform === 'darwin';

let win = null;
let tray = null;
let engine = null;
let store = null;
let quitting = false;

// 빌드 이름(productName)은 영문 ProtectNeck 이다. 한글로 두면 맥 헬퍼 앱 이름까지 한글이 되어 패키징된 앱이 시작하자마자 죽는다.
// 화면에 보이는 이름은 APP_NAME 과 Info.plist 의 CFBundleDisplayName 으로 따로 준다.

// 테스트·개발 때 실제 설정을 건드리지 않도록 저장 위치를 바꿀 수 있게 한다.
if (process.env.NECK_USER_DATA) app.setPath('userData', process.env.NECK_USER_DATA);

if (!app.requestSingleInstanceLock()) {
  console.error('이미 실행 중이라 종료합니다.');
  app.quit();
} else {
  app.on('second-instance', () => showWindow());
  app.whenReady().then(boot);
}

function boot() {
  if (process.platform === 'win32') app.setAppUserModelId('io.github.winterholic.protectneck');

  store = new Store(app.getPath('userData'));
  engine = new Engine(store.settings, Date.now());
  engine.on(onEngineEvent);
  if (!app.isPackaged) global.neckEngine = engine;
  applyLoginItem(store.settings.launchAtLogin);

  createWindow();
  createTray();
  registerIpc();
  watchPower();

  setInterval(() => {
    engine.tick(Date.now(), powerMonitor.getSystemIdleTime() * 1000);
    broadcast();
  }, 1000);

  app.on('activate', () => showWindow());
  app.on('before-quit', () => { quitting = true; });
}

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 700,
    minWidth: 420,
    minHeight: 620,
    show: false,
    title: APP_NAME,
    icon: path.join(ASSETS, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  win.once('ready-to-show', () => {
    if (!process.argv.includes('--hidden')) win.show();
  });
  win.on('close', (e) => {
    if (quitting) return;
    e.preventDefault();
    win.hide();
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function showWindow({ urgent = false } = {}) {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  if (urgent) {
    // 고를 때까지 다른 창 뒤로 숨지 않게 한다. 선택하면 state 가 바뀌면서 풀린다.
    win.setAlwaysOnTop(true, 'floating');
    if (isMac) app.focus({ steal: true });
  }
}

function releaseOnTop() {
  if (win && win.isAlwaysOnTop()) win.setAlwaysOnTop(false);
}

function onEngineEvent(evt) {
  if (evt.type === 'due') remind();
  if (evt.type === 'returned' && evt.rested) store.bump('away');
  if (evt.type === 'away' || evt.type === 'returned' || evt.type === 'workEnd') releaseOnTop();
  if (evt.type === 'workEnd') {
    const t = store.today();
    const n = t.done + t.quick;
    notify('퇴근 시간이에요', n > 0 ? `오늘 스트레칭 ${n}번 했어요. 수고했어요.` : '오늘은 스트레칭을 못 했네요. 내일은 한 번이라도 해 봐요.');
  }
}

function remind() {
  const { reminderStyle } = store.settings;
  const minutes = Math.round((Date.now() - engine.sittingSince) / 60000);
  notify('스트레칭할 시간이에요', `${minutes}분 동안 앉아 있었어요. 목 좀 풀고 갈까요?`);
  if (reminderStyle === 'window' || !Notification.isSupported()) showWindow({ urgent: true });
  send('remind');
}

function notify(title, body) {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title, body, silent: true });
  n.on('click', () => showWindow());
  n.show();
}

function state() {
  return {
    ...engine.snapshot(Date.now()),
    settings: store.settings,
    today: store.today(),
    platform: process.platform,
  };
}

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function broadcast() {
  send('state', state());
  updateTray();
}

const ACTIONS = {
  pause: (now) => engine.pause(now),
  pauseHour: (now) => engine.pause(now, 60 * 60 * 1000),
  resume: (now) => engine.resume(now),
  startAnyway: (now) => engine.startAnyway(now),
  restart: (now) => engine.restart(now),
  snooze: (now) => { engine.snooze(now); store.bump('snoozed'); },
  skip: (now) => { engine.skip(now); store.bump('skipped'); },
  startStretch: () => engine.startStretch(),
  finishStretch: (now, { completed, routine } = {}) => {
    engine.finishStretch(now);
    if (completed) store.bump(routine === 'quick' ? 'quick' : 'done');
  },
  startBreak: (now) => engine.startBreak(now),
  endBreak: (now) => engine.endBreak(now),
};

function runAction(name, arg) {
  const fn = ACTIONS[name];
  if (!fn) return state();
  fn(Date.now(), arg);
  releaseOnTop();
  broadcast();
  return state();
}

function registerIpc() {
  ipcMain.handle('state', () => state());
  ipcMain.handle('action', (_e, name, arg) => runAction(name, arg));
  ipcMain.handle('settings', (_e, patch) => {
    const before = store.settings;
    const next = store.updateSettings(patch || {});
    engine.applySettings(next, Date.now());
    if (next.launchAtLogin !== before.launchAtLogin) applyLoginItem(next.launchAtLogin);
    broadcast();
    return state();
  });
}

function applyLoginItem(openAtLogin) {
  if (!app.isPackaged) return;
  app.setLoginItemSettings({ openAtLogin, args: ['--hidden'] });
}

function watchPower() {
  const away = () => {
    engine.lock(Date.now());
    send('locked');
    broadcast();
  };
  const back = () => {
    engine.unlock(Date.now());
    broadcast();
  };
  powerMonitor.on('lock-screen', away);
  powerMonitor.on('suspend', away);
  powerMonitor.on('unlock-screen', back);
  powerMonitor.on('resume', back);
}

function trayIcon() {
  if (isMac) {
    const img = nativeImage.createFromPath(path.join(ASSETS, 'trayTemplate.png'));
    img.setTemplateImage(true);
    return img;
  }
  return nativeImage.createFromPath(path.join(ASSETS, 'tray.png'));
}

function createTray() {
  tray = new Tray(trayIcon());
  tray.setToolTip(APP_NAME);
  tray.on('click', () => {
    if (!isMac) showWindow();
  });
  tray.on('double-click', () => showWindow());
  updateTray();
}

function fmt(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function trayLabel(s) {
  switch (s.mode) {
    case MODES.FOCUS: return fmt(s.remainingMs);
    case MODES.PAUSED: return '일시정지';
    case MODES.DUE: return '스트레칭!';
    case MODES.STRETCH: return '스트레칭 중';
    case MODES.BREAK: return '쉬는 중';
    case MODES.AWAY: return '자리 비움';
    case MODES.OFF: return '퇴근';
    default: return '';
  }
}

let lastMenuKey = '';

function updateTray() {
  if (!tray) return;
  const s = state();
  const label = trayLabel(s);
  if (isMac) tray.setTitle(` ${label}`, { fontType: 'monospacedDigit' });
  tray.setToolTip(`${APP_NAME} — ${label}`);

  // 메뉴는 모드가 바뀔 때만 다시 만든다. 매초 갈아 끼우면 열어 둔 메뉴가 닫힌다.
  const key = s.mode;
  if (key === lastMenuKey) return;
  lastMenuKey = key;
  const paused = s.mode === MODES.PAUSED;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '창 열기', click: () => showWindow() },
    { type: 'separator' },
    s.mode === MODES.OFF
      ? { label: '지금 시작', click: () => runAction('startAnyway') }
      : paused
      ? { label: '다시 시작', click: () => runAction('resume') }
      : { label: '일시정지', enabled: s.mode === MODES.FOCUS, click: () => runAction('pause') },
    { label: '1시간 쉬기', enabled: s.mode === MODES.FOCUS || paused, click: () => runAction('pauseHour') },
    {
      label: '지금 스트레칭',
      enabled: s.mode !== MODES.STRETCH && s.mode !== MODES.OFF,
      click: () => { showWindow(); send('startStretch'); },
    },
    { type: 'separator' },
    { label: '종료', click: () => { quitting = true; app.quit(); } },
  ]));
}
