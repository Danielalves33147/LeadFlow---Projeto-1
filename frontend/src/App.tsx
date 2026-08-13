import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './app/AuthContext';
import { AppLayout } from './components/AppLayout';
import type { UserRole } from './types';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { FunnelPage } from './pages/FunnelPage';
import { LeadDetailsPage } from './pages/LeadDetailsPage';
import { InteractionsPage } from './pages/InteractionsPage';
import { TasksPage } from './pages/TasksPage';
import { BranchesPage } from './pages/BranchesPage';
import { BranchDetailsPage } from './pages/BranchDetailsPage';
import { TeamPage } from './pages/TeamPage';
import { ScoreRulesPage } from './pages/ScoreRulesPage';
import { RankingPage } from './pages/RankingPage';
import { SettingsPage } from './pages/SettingsPage';
import { Alert, Button, Card, LoadingPanel } from './components/ui';

function Guard({roles,children}:{roles?:UserRole[];children:React.ReactNode}){const {user,loading}=useAuth();if(loading)return <div className="lf-route-loading"><LoadingPanel/></div>;if(!user)return <Navigate to="/login" replace/>;if(roles&&!roles.includes(user.role))return <div className="lf-content"><Card><div className="lf-empty"><div className="lf-empty-title">Acesso restrito</div><p className="lf-empty-text">Seu perfil não possui acesso a esta área.</p><Button variant="secondary" onClick={()=>history.back()}>Voltar</Button></div></Card></div>;return <>{children}</>}
export default function App(){return <Routes><Route path="/login" element={<LoginPage/>}/><Route path="/cadastro" element={<RegisterPage/>}/><Route element={<Guard><AppLayout/></Guard>}><Route path="/dashboard" element={<DashboardPage/>}/><Route path="/leads" element={<LeadsPage/>}/><Route path="/leads/funil" element={<FunnelPage/>}/><Route path="/leads/:leadId" element={<LeadDetailsPage/>}/><Route path="/interacoes" element={<InteractionsPage/>}/><Route path="/tarefas" element={<TasksPage/>}/><Route path="/filiais" element={<Guard roles={['ADMIN','MANAGER']}><BranchesPage/></Guard>}/><Route path="/filiais/:branchId" element={<Guard roles={['ADMIN','MANAGER']}><BranchDetailsPage/></Guard>}/><Route path="/equipe" element={<Guard roles={['ADMIN','MANAGER']}><TeamPage/></Guard>}/><Route path="/pontuacao/regras" element={<Guard roles={['ADMIN']}><ScoreRulesPage/></Guard>}/><Route path="/ranking-filiais" element={<Guard roles={['ADMIN','MANAGER']}><RankingPage/></Guard>}/><Route path="/configuracoes" element={<Guard roles={['ADMIN']}><SettingsPage/></Guard>}/></Route><Route path="/" element={<Navigate to="/dashboard" replace/>}/><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes>}
