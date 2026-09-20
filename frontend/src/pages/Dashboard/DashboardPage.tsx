import { useAuth } from '@/hooks/useAuth';
import { AdminView } from './views/AdminView';
import { EmployeeView } from './views/EmployeeView';
import { EmployerView } from './views/EmployerView';
import { FinanceView } from './views/FinanceView';
import { ProjectManagerView } from './views/ProjectManagerView';

export function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? 'EMPLOYEE';

  switch (role) {
    case 'EMPLOYEE':
      return <EmployeeView />;
    case 'EMPLOYER':
      return <EmployerView />;
    case 'PROJECT_MANAGER':
      return <ProjectManagerView />;
    case 'FINANCIAL_OFFICER':
      return <FinanceView />;
    default:
      return <AdminView />;
  }
}