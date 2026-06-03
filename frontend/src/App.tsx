import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppSelector } from './store';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RoomsPage from './pages/RoomsPage';
import ReservationsPage from './pages/ReservationsPage';
import GuestsPage from './pages/GuestsPage';
import InvoicesPage from './pages/InvoicesPage';
import HousekeepingPage from './pages/HousekeepingPage';
import MaintenancePage from './pages/MaintenancePage';
import ReportsPage from './pages/ReportsPage';
import StaffPage from './pages/StaffPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const theme = useAppSelector((s) => s.theme.mode);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  return (
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
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
