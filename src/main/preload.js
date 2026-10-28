'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const listen = (channel) => (fn) => {
  const handler = (_e, payload) => fn(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

contextBridge.exposeInMainWorld('neck', {
  getState: () => ipcRenderer.invoke('state'),
  action: (name, arg) => ipcRenderer.invoke('action', name, arg),
  saveSettings: (patch) => ipcRenderer.invoke('settings', patch),
  onState: listen('state'),
  onRemind: listen('remind'),
  onLocked: listen('locked'),
  onStartStretch: listen('startStretch'),
});
