/**
 * IPC channel names (mirror `electron/ipcChannels.ts` when adding handlers).
 */
export const IPC = {
  GET_TEMPLATES: 'ds:get-templates',
  GET_SELECTED_TEMPLATE: 'ds:get-selected-template',
  APPLY_TEMPLATE: 'ds:apply-template',
  REOPEN_MENU: 'ds:reopen-menu',
  TOGGLE_OVERLAY: 'ds:toggle-overlay',
  QUIT_APP: 'ds:quit-app',
  ON_SELECTION_CHANGED: 'ds:on-selection-changed',
} as const;

export type TemplateMeta = {
  id: string;
  name: string;
  description: string;
};
