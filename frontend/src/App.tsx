import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import { useAuthStore } from './store/authStore';
import { usePlatformSettings } from './store/platformSettingsStore';

export default function App() {
  const settings = usePlatformSettings(state => state.settings);
  useEffect(() => {
    const refresh = () => { void usePlatformSettings.getState().load(); };
    refresh(); window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);
  useEffect(() => {
    document.title = `${settings.displayName} — Read. Play. Achieve.`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', settings.description);
  }, [settings.displayName, settings.description]);
  // Confirm the saved login (if any) with the backend once, when the app starts.
  useEffect(() => {
    void useAuthStore.getState().init();
  }, []);

  return <AppRoutes />;
}
