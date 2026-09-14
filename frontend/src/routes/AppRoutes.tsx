import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';
import { LoginPage } from '@/pages/Login/LoginPage';
import { RegisterPage } from '@/pages/Register/RegisterPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { UsersPage } from '@/pages/Users/UsersPage';
import { PaymentsPage } from '@/pages/Payments/PaymentsPage';
import { ProjectsPage } from '@/pages/Projects/ProjectsPage';
import { HousesPage } from '@/pages/Houses/HousesPage';
import { ApplicationsPage } from '@/pages/Applications/ApplicationsPage';
import { SystemLogsPage } from '@/pages/SystemLogs/SystemLogsPage';
import { MyHousingPage } from '@/pages/MyHousing/MyHousingPage';
import { OccupanciesPage } from '@/pages/Occupancies/OccupanciesPage';
import { MainLayout } from '@/components/layout/MainLayout';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/my-housing" element={<MyHousingPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/houses" element={<HousesPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/occupancies" element={<OccupanciesPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/system-logs" element={<SystemLogsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
