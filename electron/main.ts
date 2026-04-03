import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  Tray,
} from 'electron';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { IPC } from './ipcChannels.js';
import { TEMPLATE_META } from './templateMeta.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

function getRendererUrl(mode: 'menu' | 'overlay'): string {
  if (isDev) {
    const base = process.env.VITE_DEV_SERVER_URL!;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}mode=${mode}`;
  }
  const fileUrl = pathToFileURL(join(__dirname, '../dist/index.html')).href;
  const sep = fileUrl.includes('?') ? '&' : '?';
  return `${fileUrl}${sep}mode=${mode}`;
}

const STORE_FILE = () => join(app.getPath('userData'), 'selected-template.json');

type StoreShape = { selectedTemplateId: string | null };

function readStore(): StoreShape {
  try {
    const p = STORE_FILE();
    if (!existsSync(p)) return { selectedTemplateId: null };
    const raw = readFileSync(p, 'utf8');
    const data = JSON.parse(raw) as StoreShape;
    return {
      selectedTemplateId:
        typeof data.selectedTemplateId === 'string'
          ? data.selectedTemplateId
          : null,
    };
  } catch {
    return { selectedTemplateId: null };
  }
}

function writeStore(data: StoreShape): void {
  const dir = dirname(STORE_FILE());
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STORE_FILE(), JSON.stringify(data, null, 2), 'utf8');
}

let menuWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let overlayVisible = false;
let isQuitting = false;

function quitFully(): void {
  isQuitting = true;
  app.quit();
}

function attachCloseGuard(win: BrowserWindow): void {
  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function broadcastSelection(id: string | null): void {
  const windows = BrowserWindow.getAllWindows();
  for (const w of windows) {
    w.webContents.send(IPC.ON_SELECTION_CHANGED, id);
  }
}

function createMenuWindow(showOnReady = true): BrowserWindow {
  const win = new BrowserWindow({
    width: 920,
    height: 640,
    show: false,
    center: true,
    title: 'Desktop Skins',
    backgroundColor: '#0f1115',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      additionalArguments: ['--window-mode=menu'],
    },
  });

  win.setMenuBarVisibility(false);
  attachCloseGuard(win);
  win.loadURL(getRendererUrl('menu'));
  win.once('ready-to-show', () => {
    if (showOnReady) win.show();
  });
  win.on('closed', () => {
    menuWindow = null;
  });
  return win;
}

function createOverlayWindow(): BrowserWindow {
  const win = new BrowserWindow({
    fullscreen: true,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      additionalArguments: ['--window-mode=overlay'],
    },
  });

  win.setIgnoreMouseEvents(true, { forward: true });
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  attachCloseGuard(win);
  win.loadURL(getRendererUrl('overlay'));
  win.on('closed', () => {
    overlayWindow = null;
    overlayVisible = false;
  });
  return win;
}

function ensureMenuWindow(showOnReady = true): BrowserWindow {
  if (menuWindow && !menuWindow.isDestroyed()) return menuWindow;
  menuWindow = createMenuWindow(showOnReady);
  return menuWindow;
}

function ensureOverlayWindow(): BrowserWindow {
  if (overlayWindow && !overlayWindow.isDestroyed()) return overlayWindow;
  overlayWindow = createOverlayWindow();
  return overlayWindow;
}

function showMenu(): void {
  const win = ensureMenuWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function showOverlay(): void {
  const win = ensureOverlayWindow();
  overlayVisible = true;
  win.show();
  win.setFullScreen(true);
}

function hideOverlay(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.hide();
  }
  overlayVisible = false;
}

function toggleOverlay(): void {
  const store = readStore();
  if (!store.selectedTemplateId) return;
  if (overlayVisible) hideOverlay();
  else showOverlay();
}

function registerShortcuts(): void {
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    showMenu();
  });
}

function createTrayIcon(): Electron.NativeImage {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==',
    'base64',
  );
  return nativeImage.createFromBuffer(png);
}

function buildTray(): void {
  if (tray) return;
  tray = new Tray(createTrayIcon());
  tray.setToolTip('Desktop Skins');
  const menu = Menu.buildFromTemplate([
    {
      label: 'Open Menu',
      click: () => showMenu(),
    },
    {
      label: 'Toggle Overlay',
      click: () => toggleOverlay(),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => quitFully(),
    },
  ]);
  tray.setContextMenu(menu);
  tray.on('click', () => showMenu());
}

function registerIpc(): void {
  ipcMain.handle(IPC.GET_TEMPLATES, () => TEMPLATE_META);

  ipcMain.handle(IPC.GET_SELECTED_TEMPLATE, () => readStore().selectedTemplateId);

  ipcMain.handle(IPC.APPLY_TEMPLATE, (_event, id: string) => {
    const known = TEMPLATE_META.some((t) => t.id === id);
    if (!known) return;
    writeStore({ selectedTemplateId: id });
    broadcastSelection(id);
    showOverlay();
  });

  ipcMain.handle(IPC.REOPEN_MENU, () => {
    showMenu();
  });

  ipcMain.handle(IPC.TOGGLE_OVERLAY, () => {
    toggleOverlay();
  });

  ipcMain.handle(IPC.QUIT_APP, () => {
    quitFully();
  });
}

function onReady(): void {
  registerIpc();
  registerShortcuts();
  buildTray();

  const store = readStore();
  if (store.selectedTemplateId) {
    ensureMenuWindow(false);
    showOverlay();
  } else {
    ensureMenuWindow(true);
  }
}

app.whenReady().then(onReady);

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('activate', () => {
  showMenu();
});
