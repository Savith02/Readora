import { api } from './client';
import type { PlatformSettingsSnapshot, PublicPlatformSettings } from '@readora/shared';

export const fetchPublicSettings = (signal?: AbortSignal) => api.get<{ settings: PublicPlatformSettings }>('/platform-settings', { signal }).then(response => response.data.settings);
export const fetchPlatformSettings = (signal?: AbortSignal) => api.get<PlatformSettingsSnapshot>('/admin/platform-settings', { signal }).then(response => response.data);
export const savePlatformSettings = (snapshot: PlatformSettingsSnapshot) => api.patch<PlatformSettingsSnapshot>('/admin/platform-settings', snapshot).then(response => response.data);
