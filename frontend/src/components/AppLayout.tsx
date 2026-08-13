import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { notificationApi } from '../services/api';
import { fmtDateTime, initials, roleLabels } from '../services/format';
import type { NotificationListResponse, UserRole } from '../types';
import { useAuth } from '../app/AuthContext';
import { IconButton } from './ui';

const titles:Record<string,string>={
  '/dashboard':'Visão Geral','/leads':'Leads','/leads/funil':'Funil de Vendas','/interacoes':'Interações','/tarefas':'Tarefas','/filiais':'Filiais','/equipe':'Equipe','/pontuacao/regras':'Regras de Pontuação','/ranking-filiais':'Ranking de Filiais','/configuracoes':'Configurações'
};
const nav:{to:string;label:string;icon:string;roles?:UserRole[];sub?:boolean}[]=[
  {to:'/dashboard',label:'Dashboard',icon:'▦'},
  {to:'/leads',label:'Lista de Leads',icon:'◎',sub:true},
  {to:'/leads/funil',label:'Funil de Vendas',icon:'⌁',sub:true},
  {to:'/interacoes',label:'Interações',icon:'↔'},
  {to:'/tarefas',label:'Tarefas',icon:'✓'},
  {to:'/filiais',label:'Filiais',icon:'▤',roles:['ADMIN','MANAGER']},
  {to:'/equipe',label:'Equipe',icon:'♙',roles:['ADMIN','MANAGER']},
  {to:'/pontuacao/regras',label:'Regras de Pontuação',icon:'☆',roles:['ADMIN']},
  {to:'/configuracoes',label:'Configurações',icon:'⚙',roles:['ADMIN']}
];
export function AppLayout(){
  const {user,logout}=useAuth();const location=useLocation();const navigate=useNavigate();const [mobile,setMobile]=useState(false);const [account,setAccount]=useState(false);const [notifications,setNotifications]=useState(false);const [data,setData]=useState<NotificationListResponse>({unreadCount:0,notifications:[]});const panelRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{notificationApi.list().then(setData).catch(()=>{})},[location.pathname]);
  useEffect(()=>{setMobile(false)},[location.pathname]);
  const title=useMemo(()=>{if(location.pathname.startsWith('/leads/')&&!location.pathname.endsWith('/funil'))return 'Detalhes do Lead';if(location.pathname.startsWith('/filiais/'))return 'Detalhes da Filial';return titles[location.pathname]??'LeadFlow'},[location.pathname]);
  if(!user)return null;
  const markAll=async()=>{await notificationApi.readAll();setData(v=>({...v,unreadCount:0,notifications:v.notifications.map(n=>({...n,read:true}))}))};
  return <div className="lf-shell">{mobile&&<div className="lf-mobile-overlay" onClick={()=>setMobile(false)}/>}<aside className={`lf-sidebar ${mobile?'open':''}`}>
    <div className="lf-brand"><span className="lf-brand-mark">LF</span><span>LeadFlow</span></div>
    <nav className="lf-nav" aria-label="Navegação principal"><NavLink className={({isActive})=>`lf-nav-item ${isActive?'active':''}`} to="/dashboard"><span className="lf-nav-icon">▦</span><span>Dashboard</span></NavLink><div className="lf-nav-group-label">Operação comercial</div>{nav.slice(1).map(item=>item.roles&&!item.roles.includes(user.role)?null:<NavLink end={item.to==='/leads'} key={item.to} className={({isActive})=>`lf-nav-item ${item.sub?'lf-nav-sub':''} ${isActive?'active':''}`} to={item.to}><span className="lf-nav-icon">{item.icon}</span><span>{item.label}</span></NavLink>)}</nav>
    <div className="lf-user-box" onClick={()=>setAccount(v=>!v)}><div className="lf-avatar">{initials(user.name)}</div><div className="lf-user-meta"><div className="lf-user-name">{user.name}</div><div className="lf-user-role">{roleLabels[user.role]}</div></div><span aria-hidden>⋯</span>{account&&<div className="lf-user-menu" onClick={e=>e.stopPropagation()}><button onClick={()=>navigate('/configuracoes')}>Minha conta</button><button onClick={()=>navigate('/configuracoes')}>Preferências</button><button onClick={async()=>{await logout();navigate('/login')}}>Sair</button></div>}</div>
  </aside>
  <main className="lf-main"><div className="lf-topbar"><IconButton className="lf-mobile-menu" label="Abrir menu" onClick={()=>setMobile(true)}>☰</IconButton><div className="lf-topbar-title">{title}</div><span className="lf-context-select">{user.companyName}</span>{user.primaryBranchName&&<span className="lf-context-select">{user.primaryBranchName}</span>}<div ref={panelRef} style={{position:'relative'}}><button className="lf-notification-button" aria-label="Notificações" onClick={()=>setNotifications(v=>!v)}>♢{data.unreadCount>0&&<span className="lf-notification-badge">{data.unreadCount>99?'99+':data.unreadCount}</span>}</button>{notifications&&<div className="lf-notification-panel"><div className="lf-notification-head"><strong>Notificações</strong><button className="lf-btn lf-btn-tertiary lf-btn-sm" onClick={markAll}>Marcar todas como lidas</button></div>{data.notifications.length===0?<div className="lf-empty"><div className="lf-empty-title">Nenhuma notificação</div></div>:data.notifications.map(n=><div key={n.id} className={`lf-notification-item ${n.read?'':'unread'}`} onClick={async()=>{if(!n.read){await notificationApi.read(n.id);setData(v=>({...v,unreadCount:Math.max(0,v.unreadCount-1),notifications:v.notifications.map(x=>x.id===n.id?{...x,read:true}:x)}))}if(n.referenceType==='LEAD'&&n.referenceId)navigate(`/leads/${n.referenceId}`)}}><div className="lf-notification-item-title">{n.title}</div><div className="lf-notification-item-msg">{n.message}</div><div className="lf-notification-item-time">{fmtDateTime(n.createdAt)}</div></div>)}</div>}</div></div><div className="lf-content"><Outlet/></div></main></div>
}
