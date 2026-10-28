import { create } from 'zustand';
import { DEFAULT_PLATFORM_SETTINGS } from '@readora/shared';
import type { PublicPlatformSettings } from '@readora/shared';
import { fetchPublicSettings } from '../api/platformSettings.api';

let generation = 0;
interface State {
  settings: PublicPlatformSettings;
  apply: (settings: PublicPlatformSettings) => void;
  load: () => Promise<void>;
}
export const usePlatformSettings = create<State>((set) => ({
  settings: { ...DEFAULT_PLATFORM_SETTINGS },
  apply: settings => { generation++; set({ settings }); },
  load: async () => {
    const request = ++generation;
    try { const settings = await fetchPublicSettings(); if (request === generation) set({ settings }); }
    catch { /* Keep defaults or the last successful public settings when the API is unavailable. */ }
  },
}));
