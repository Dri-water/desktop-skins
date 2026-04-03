import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from './ipcChannels.js';

function windowModeFromArgv(): 'menu' | 'overlay' {
  const arg = process.argv.find((a) => a.startsWith('--window-mode='));
  const v = arg?.split('=')[1];
  return v === 'overlay' ? 'overlay' : 'menu';
}

export type DesktopSkinsApi = {
  getWindowMode: () => Promise<'menu' | 'overlay'>;
  getTemplates: () => Promise<
    Array<{ id: string; name: string; description: string }>
  >;
  getSelectedTemplate: () => Promise<string | null>;
  applyTemplate: (id: string) => Promise<void>;
  reopenMenu: () => Promise<void>;
  toggleOverlay: () => Promise<void>;
  quitApp: () => Promise<void>;
  onSelectionChanged: (callback: (id: string | null) => void) => () => void;
};

const api: DesktopSkinsApi = {
  getWindowMode: () => Promise.resolve(windowModeFromArgv()),
  getTemplates: () => ipcRenderer.invoke(IPC.GET_TEMPLATES),
  getSelectedTemplate: () => ipcRenderer.invoke(IPC.GET_SELECTED_TEMPLATE),
  applyTemplate: (id) => ipcRenderer.invoke(IPC.APPLY_TEMPLATE, id),
  reopenMenu: () => ipcRenderer.invoke(IPC.REOPEN_MENU),
  toggleOverlay: () => ipcRenderer.invoke(IPC.TOGGLE_OVERLAY),
  quitApp: () => ipcRenderer.invoke(IPC.QUIT_APP),
  onSelectionChanged: (callback) => {
    const listener = (_: Electron.IpcRendererEvent, id: string | null) =>
      callback(id);
    ipcRenderer.on(IPC.ON_SELECTION_CHANGED, listener);
    return () => {
      ipcRenderer.removeListener(IPC.ON_SELECTION_CHANGED, listener);
    };
  },
};

contextBridge.exposeInMainWorld('desktopSkins', api);
