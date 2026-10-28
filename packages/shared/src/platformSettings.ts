/** The complete allowlist of public, non-sensitive website configuration. */
export interface PublicPlatformSettings {
  displayName: string;
  description: string;
  supportEmail: string;
  logoStyle: 'book' | 'app-icon';
  announcementEnabled: boolean;
  announcementText: string;
}
export interface PlatformSettingsSnapshot { settings: PublicPlatformSettings; revision: number }
export const DEFAULT_PLATFORM_SETTINGS: Readonly<PublicPlatformSettings> = {
  displayName: 'Readora',
  description: 'Read. Play. Achieve. Turn reading into a habit you love with streaks, quick breaks and friendly competition.',
  supportEmail: '',
  logoStyle: 'book',
  announcementEnabled: false,
  announcementText: '',
};
