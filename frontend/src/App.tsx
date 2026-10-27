import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import { useAuthStore } from './store/authStore';

export default function App() {
  // Confirm the saved login (if any) with the backend once, when the app starts.
  useEffect(() => {
    void useAuthStore.getState().init();
  }, []);

  return <AppRoutes />;
}
