/// <reference types="vite/client" />

import type { DesktopSkinsApi } from '../electron/preload';

declare global {
  interface Window {
    desktopSkins: DesktopSkinsApi;
  }
}

export {};
