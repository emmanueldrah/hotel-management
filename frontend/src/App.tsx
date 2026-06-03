import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppSelector } from './store';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Spinner } from './components/ui';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const RoomsPage = lazy(() => import('./pages/RoomsPage'));
const ReservationsPage = lazy(() => import('./pages/ReservationsPage'));
const GuestsPage = lazy(() => import('./pages/GuestsPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const HousekeepingPage = lazy(() => import('./pages/HousekeepingPage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const RestaurantPage = lazy(() => import('./pages/RestaurantPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const StaffPage = lazy(() => import('./pages/StaffPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  const theme = useAppSelector((s) => s.theme.mode);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  return (
    <Suspense fallback={<Spinner label="Loading…" />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/guests" element={<GuestsPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/housekeeping" element={<HousekeepingPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/restaurant" element={<RestaurantPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
