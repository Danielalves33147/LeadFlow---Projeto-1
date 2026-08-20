import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { notificationApi } from '../services/api';
import { fmtDateTime, initials, roleLabels } from '../services/format';
import type {
  NotificationListResponse,
  NotificationResponse,
  UserRole,
} from '../types';
import '../styles/app-layout.css';
import { IconButton } from './ui';

const nav: {
  to: string;
  label: string;
  icon: string;
  roles?: UserRole[];
  sub?: boolean;
}[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/leads', label: 'Lista de Leads', icon: '◎', sub: true },
  { to: '/leads/funil', label: 'Funil de Vendas', icon: '⌁', sub: true },
  { to: '/interacoes', label: 'Interações', icon: '↔' },
  { to: '/tarefas', label: 'Tarefas', icon: '✓' },
  {
    to: '/ranking-filiais',
    label: 'Filiais',
    icon: '▤',
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    to: '/equipe',
    label: 'Equipe',
    icon: '♙',
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    to: '/pontuacao/regras',
    label: 'Regras de Pontuação',
    icon: '☆',
    roles: ['ADMIN'],
  },
  {
    to: '/configuracoes',
    label: 'Configurações',
    icon: '⚙',
  },
];

function notificationTone(type: string) {
  if (type === 'TASK_OVERDUE') {
    return 'danger';
  }

  if (type === 'TASK_DUE_SOON' || type === 'TASK_ASSIGNED') {
    return 'warning';
  }

  if (type === 'LEAD_ASSIGNED') {
    return 'primary';
  }

  if (type === 'INTERACTION_CREATED') {
    return 'info';
  }

  if (type === 'STAGE_CHANGED') {
    return 'success';
  }

  return 'neutral';
}

function notificationSymbol(type: string) {
  if (type === 'TASK_OVERDUE') {
    return '!';
  }

  if (type === 'TASK_DUE_SOON' || type === 'TASK_ASSIGNED') {
    return '✓';
  }

  if (type === 'LEAD_ASSIGNED') {
    return 'L';
  }

  if (type === 'INTERACTION_CREATED') {
    return '↔';
  }

  if (type === 'STAGE_CHANGED') {
    return '→';
  }

  if (type === 'USER_STATUS_CHANGED') {
    return 'U';
  }

  return '•';
}

function notificationDestination(notification: NotificationResponse) {
  if (notification.referenceType === 'LEAD' && notification.referenceId) {
    return `/leads/${notification.referenceId}`;
  }

  if (notification.referenceType === 'TASK') {
    return '/tarefas';
  }

  if (notification.referenceType === 'USER') {
    return '/configuracoes';
  }

  return null;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('lf-sidebar-collapsed') === 'true',
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [data, setData] = useState<NotificationListResponse>({
    unreadCount: 0,
    notifications: [],
  });
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setNotificationsLoading(true);
      const result = await notificationApi.list();
      const unreadNotifications = result.notifications.filter(
        (notification) => !notification.read,
      );

      setData({
        unreadCount: unreadNotifications.length,
        notifications: unreadNotifications,
      });
    } catch {
      // A falha de notificações não deve interromper o uso do restante do CRM.
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshNotifications();

    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [refreshNotifications]);

  useEffect(() => {
    setMobile(false);
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem('lf-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen]);

  if (!user) {
    return null;
  }

  const markAll = async () => {
    if (data.unreadCount === 0) {
      return;
    }

    await notificationApi.readAll();

    setData({
      unreadCount: 0,
      notifications: [],
    });
  };

  const openNotification = async (notification: NotificationResponse) => {
    if (!notification.read) {
      await notificationApi.read(notification.id);

      setData((current) => ({
        unreadCount: Math.max(0, current.unreadCount - 1),
        notifications: current.notifications.filter(
          (item) => item.id !== notification.id,
        ),
      }));
    }

    const destination = notificationDestination(notification);

    if (destination) {
      setNotificationsOpen(false);
      navigate(destination);
    }
  };

  return (
    <div className={`lf-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {mobile && (
        <div className="lf-mobile-overlay" onClick={() => setMobile(false)} />
      )}

      <aside
        className={`lf-sidebar ${mobile ? 'open' : ''} ${
          collapsed ? 'collapsed' : ''
        }`}
      >
        <div className="lf-brand">
          <span className="lf-brand-mark">LF</span>
          <span className="lf-brand-name">LeadFlow</span>
          <button
            className="lf-sidebar-toggle"
            type="button"
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            onClick={() => setCollapsed((current) => !current)}
          >
            <svg
              aria-hidden="true"
              className="lf-sidebar-toggle-icon"
              viewBox="0 0 24 24"
            >
              <path d={collapsed ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} />
            </svg>
          </button>
        </div>

        <nav className="lf-nav" aria-label="Navegação principal">
          {user.role !== 'SELLER' && (
            <NavLink
              className={({ isActive }) =>
                `lf-nav-item ${isActive ? 'active' : ''}`
              }
              to="/dashboard"
              title={collapsed ? 'Dashboard' : undefined}
            >
              <span className="lf-nav-icon">▦</span>
              <span className="lf-nav-label">Dashboard</span>
            </NavLink>
          )}

          <div className="lf-nav-group-label">Operação comercial</div>

          {nav.slice(1).map((item) => {
            if (item.roles && !item.roles.includes(user.role)) {
              return null;
            }

            return (
              <NavLink
                end={item.to === '/leads'}
                key={item.to}
                className={({ isActive }) =>
                  `lf-nav-item ${item.sub ? 'lf-nav-sub' : ''} ${
                    isActive ? 'active' : ''
                  }`
                }
                to={item.to}
                title={collapsed ? item.label : undefined}
              >
                <span className="lf-nav-icon">{item.icon}</span>
                <span className="lf-nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div
          className="lf-user-box"
          title={collapsed ? user.name : undefined}
        >
          <div className="lf-avatar">{initials(user.name)}</div>
          <div className="lf-user-meta">
            <div className="lf-user-name">{user.name}</div>
            <div className="lf-user-role">{roleLabels[user.role]}</div>
          </div>

          <button
            className="lf-user-logout"
            type="button"
            aria-label="Sair"
            title="Sair"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            <svg
              aria-hidden="true"
              className="lf-user-logout-icon"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" />
              <path d="M10 12h11" />
              <path d="m18 9 3 3-3 3" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="lf-main">
        <div className="lf-topbar">
          <IconButton
            className="lf-mobile-menu"
            label="Abrir menu"
            onClick={() => setMobile(true)}
          >
            ☰
          </IconButton>

          <span className="lf-topbar-brand">LeadFlow</span>

          <div className="lf-notification-area" ref={panelRef}>
            <button
              className={`lf-notification-button ${
                notificationsOpen ? 'active' : ''
              }`}
              type="button"
              aria-label={
                data.unreadCount > 0
                  ? `Notificações, ${data.unreadCount} não lidas`
                  : 'Notificações'
              }
              aria-expanded={notificationsOpen}
              aria-controls="lf-notification-panel"
              title="Notificações"
              onClick={() => {
                setNotificationsOpen((current) => !current);
                void refreshNotifications();
              }}
            >
              <svg
                aria-hidden="true"
                className="lf-notification-bell"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>

              {data.unreadCount > 0 && (
                <span className="lf-notification-badge">
                  {data.unreadCount > 99 ? '99+' : data.unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div
                className="lf-notification-panel"
                id="lf-notification-panel"
                role="region"
                aria-label="Central de notificações"
              >
                <div className="lf-notification-head">
                  <div>
                    <strong>Notificações</strong>
                    <span className="lf-notification-summary">
                      {data.unreadCount === 0
                        ? 'Tudo em dia'
                        : `${data.unreadCount} ${
                            data.unreadCount === 1 ? 'não lida' : 'não lidas'
                          }`}
                    </span>
                  </div>

                  <button
                    className="lf-notification-read-all"
                    type="button"
                    disabled={data.unreadCount === 0}
                    onClick={() => void markAll()}
                  >
                    Marcar todas como lidas
                  </button>
                </div>

                {notificationsLoading && data.notifications.length === 0 ? (
                  <div className="lf-notification-state">
                    Atualizando notificações...
                  </div>
                ) : data.notifications.length === 0 ? (
                  <div className="lf-notification-state">
                    <div className="lf-notification-empty-icon">✓</div>
                    <strong>Nenhuma pendência por aqui</strong>
                    <span>
                      Novos Leads, tarefas e alterações importantes aparecerão aqui.
                    </span>
                  </div>
                ) : (
                  <div className="lf-notification-list">
                    {data.notifications.map((notification) => {
                      const destination = notificationDestination(notification);
                      const tone = notificationTone(notification.type);

                      return (
                        <button
                          key={notification.id}
                          className={`lf-notification-item ${
                            notification.read ? '' : 'unread'
                          }`}
                          type="button"
                          onClick={() => void openNotification(notification)}
                        >
                          <span
                            className={`lf-notification-type lf-notification-type-${tone}`}
                            aria-hidden="true"
                          >
                            {notificationSymbol(notification.type)}
                          </span>

                          <span className="lf-notification-body">
                            <span className="lf-notification-item-title">
                              {notification.title}
                            </span>
                            <span className="lf-notification-item-msg">
                              {notification.message}
                            </span>
                            <span className="lf-notification-item-footer">
                              <span>{fmtDateTime(notification.createdAt)}</span>
                              {destination && (
                                <span className="lf-notification-open-label">
                                  Abrir
                                </span>
                              )}
                            </span>
                          </span>

                          {!notification.read && (
                            <span
                              className="lf-notification-unread-dot"
                              aria-label="Não lida"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lf-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
