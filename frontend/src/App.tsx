import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './app/AuthContext';
import { AppLayout } from './components/AppLayout';
import { Button, Card, LoadingPanel } from './components/ui';
import { BranchDetailsPage } from './pages/BranchDetailsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ConfirmEmailPage } from './pages/ConfirmEmailPage';
import { ActivateAccountPage } from './pages/ActivateAccountPage';
import { FunnelPage } from './pages/FunnelPage';
import { InteractionsPage } from './pages/InteractionsPage';
import { LeadDetailsPage } from './pages/LeadDetailsPage';
import { LeadsPage } from './pages/LeadsPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { RankingPage } from './pages/RankingPage';
import { RegisterPage } from './pages/RegisterPage';
import { ScoreRulesPage } from './pages/ScoreRulesPage';
import { SettingsPage } from './pages/SettingsPage';
import { TasksPage } from './pages/TasksPage';
import { TeamPage } from './pages/TeamPage';
import type { UserRole } from './types';


function RoleHome() {
  const { user } = useAuth();

  return (
    <Navigate
      to={user?.role === 'SELLER' ? '/leads' : '/dashboard'}
      replace
    />
  );
}

function DashboardRoute() {
  const { user } = useAuth();

  if (user?.role === 'SELLER') {
    return <Navigate to="/leads" replace />;
  }

  return <DashboardPage />;
}

function Guard({
  roles,
  children,
}: {
  roles?: UserRole[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="lf-route-loading">
        <LoadingPanel />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="lf-content">
        <Card>
          <div className="lf-empty">
            <div className="lf-empty-title">Acesso restrito</div>
            <p className="lf-empty-text">
              Seu perfil não possui acesso a esta área.
            </p>
            <Button variant="secondary" onClick={() => history.back()}>
              Voltar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/confirmar-email" element={<ConfirmEmailPage />} />
      <Route path="/ativar-conta" element={<ActivateAccountPage />} />

      <Route
        element={
          <Guard>
            <AppLayout />
          </Guard>
        }
      >
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/funil" element={<FunnelPage />} />
        <Route path="/leads/:leadId" element={<LeadDetailsPage />} />
        <Route path="/interacoes" element={<InteractionsPage />} />
        <Route path="/tarefas" element={<TasksPage />} />

        <Route
          path="/filiais"
          element={
            <Guard roles={['ADMIN', 'MANAGER']}>
              <Navigate to="/ranking-filiais" replace />
            </Guard>
          }
        />

        <Route
          path="/filiais/:branchId"
          element={
            <Guard roles={['ADMIN', 'MANAGER']}>
              <BranchDetailsPage />
            </Guard>
          }
        />

        <Route
          path="/equipe"
          element={
            <Guard roles={['ADMIN', 'MANAGER']}>
              <TeamPage />
            </Guard>
          }
        />

        <Route
          path="/pontuacao/regras"
          element={
            <Guard roles={['ADMIN']}>
              <ScoreRulesPage />
            </Guard>
          }
        />

        <Route
          path="/ranking-filiais"
          element={
            <Guard roles={['ADMIN', 'MANAGER']}>
              <RankingPage />
            </Guard>
          }
        />

        <Route path="/configuracoes" element={<SettingsPage />} />
      </Route>

      <Route path="/" element={<RoleHome />} />
      <Route path="*" element={<RoleHome />} />
    </Routes>
  );
}
