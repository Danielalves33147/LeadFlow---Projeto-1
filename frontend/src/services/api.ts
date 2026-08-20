import type {
  ApiEnvelope,
  ApiErrorPayload,
  AuthResponse,
  AuthUser,
  BranchDetails,
  BranchRankingResponse,
  BranchSummary,
  DashboardResponse,
  HistoryResponse,
  InteractionResponse,
  InteractionType,
  InvitationAcceptResponse,
  InvitationResponse,
  InvitationValidationResponse,
  LeadResponse,
  LeadStage,
  LeadSummary,
  NotificationListResponse,
  PageResponse,
  PasswordChangeRequestResponse,
  PasswordResetRequestResponse,
  RegisterResponse,
  MessageResponse,
  ScorePreviewResponse,
  ScoreRuleResponse,
  SettingsResponse,
  TaskResponse,
  UserResponse,
  UserStatus,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';
const ACCESS_KEY = 'leadflow_access_token';
const REFRESH_KEY = 'leadflow_refresh_token';
const PERSIST_KEY = 'leadflow_persist_session';

export class ApiError extends Error {
  status: number;
  code?: string;
  fieldErrors: Record<string, string>;

  constructor(
    message: string,
    status = 0,
    code?: string,
    fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fields;
  }
}

function store() {
  return localStorage.getItem(PERSIST_KEY) === 'true'
    ? localStorage
    : sessionStorage;
}

export function saveSession(auth: AuthResponse, persist: boolean) {
  localStorage.setItem(PERSIST_KEY, String(persist));

  const target = persist ? localStorage : sessionStorage;
  const other = persist ? sessionStorage : localStorage;

  other.removeItem(ACCESS_KEY);
  other.removeItem(REFRESH_KEY);
  target.setItem(ACCESS_KEY, auth.accessToken);
  target.setItem(REFRESH_KEY, auth.refreshToken);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(PERSIST_KEY);
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

function accessToken() {
  return localStorage.getItem(ACCESS_KEY) ?? sessionStorage.getItem(ACCESS_KEY);
}

export function hasStoredSession() {
  return Boolean(accessToken() || refreshToken());
}

function refreshToken() {
  return localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY);
}

function updateTokens(auth: AuthResponse) {
  const storage = store();
  storage.setItem(ACCESS_KEY, auth.accessToken);
  storage.setItem(REFRESH_KEY, auth.refreshToken);
}

async function parseError(response: Response) {
  let payload: ApiErrorPayload | undefined;

  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  const fields: Record<string, string> = {};

  payload?.fieldErrors?.forEach((field) => {
    fields[field.field] = field.message;
  });

  return new ApiError(
    payload?.message ?? 'Não foi possível concluir a solicitação.',
    response.status,
    payload?.code,
    fields,
  );
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const token = refreshToken();

  if (!token) {
    return false;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: token }),
      });

      if (!response.ok) {
        return false;
      }

      const body: ApiEnvelope<AuthResponse> = await response.json();
      updateTokens(body.data);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
  authenticated = true,
): Promise<T> {
  const headers = new Headers(init.headers);

  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = authenticated ? accessToken() : null;

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (authenticated && response.status === 401 && retry) {
    if (await tryRefresh()) {
      return request<T>(path, init, false, true);
    }

    clearSession();
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body: ApiEnvelope<T> = await response.json();
  return body.data;
}

async function requestBlob(path: string): Promise<Blob> {
  const headers = new Headers();
  const token = accessToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(`${API_URL}${path}`, { headers });

  if (response.status === 401) {
    if (await tryRefresh()) {
      const retryHeaders = new Headers();
      const refreshed = accessToken();

      if (refreshed) {
        retryHeaders.set('Authorization', `Bearer ${refreshed}`);
      }

      response = await fetch(`${API_URL}${path}`, {
        headers: retryHeaders,
      });
    } else {
      clearSession();
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return response.blob();
}

function qs(values: Record<string, unknown>) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  const result = params.toString();
  return result ? `?${result}` : '';
}

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      false,
      false,
    ),

  register: (payload: Record<string, unknown>) =>
    request<RegisterResponse>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(payload) },
      false,
      false,
    ),

  verifyEmail: (token: string) =>
    request<MessageResponse>(
      '/auth/verify-email',
      { method: 'POST', body: JSON.stringify({ token }) },
      false,
      false,
    ),

  me: () => request<AuthUser>('/auth/me'),

  updateProfile: (payload: { name: string; email: string }) =>
    request<AuthUser>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  requestPasswordChange: () =>
    request<PasswordChangeRequestResponse>('/auth/password-change/request', {
      method: 'POST',
    }),

  confirmPasswordChange: (payload: { token: string; newPassword: string }) =>
    request<void>('/auth/password-change/confirm', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  requestPasswordReset: (email: string) =>
    request<PasswordResetRequestResponse>(
      '/auth/password-reset/request',
      { method: 'POST', body: JSON.stringify({ email }) },
      false,
      false,
    ),

  verifyPasswordReset: (payload: { email: string; token: string }) =>
    request<MessageResponse>(
      '/auth/password-reset/verify',
      { method: 'POST', body: JSON.stringify(payload) },
      false,
      false,
    ),

  confirmPasswordReset: (payload: { email: string; token: string; newPassword: string }) =>
    request<void>(
      '/auth/password-reset/confirm',
      { method: 'POST', body: JSON.stringify(payload) },
      false,
      false,
    ),

  logout: async () => {
    const token = refreshToken();

    if (token) {
      try {
        await request<void>(
          '/auth/logout',
          {
            method: 'POST',
            body: JSON.stringify({ refreshToken: token }),
          },
          false,
        );
      } catch {
        // A sessão local ainda deve ser removida se o servidor não responder.
      }
    }

    clearSession();
  },
};

export const leadApi = {
  list: (params: Record<string, unknown> = {}) =>
    request<PageResponse<LeadSummary>>(`/leads${qs(params)}`),

  get: (id: number) => request<LeadResponse>(`/leads/${id}`),

  create: (payload: Record<string, unknown>) =>
    request<LeadResponse>('/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Record<string, unknown>) =>
    request<LeadResponse>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  stage: (id: number, stage: LeadStage, reason?: string) =>
    request<LeadResponse>(`/leads/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, reason }),
    }),

  reassign: (id: number, branchId: number, responsibleUserId: number) =>
    request<LeadResponse>(`/leads/${id}/responsible`, {
      method: 'PATCH',
      body: JSON.stringify({ branchId, responsibleUserId }),
    }),

  history: (id: number) =>
    request<HistoryResponse[]>(`/leads/${id}/history`),

  interactions: (id: number) =>
    request<InteractionResponse[]>(`/leads/${id}/interactions`),

  tasks: (id: number) => request<TaskResponse[]>(`/leads/${id}/tasks`),

  exportCsv: (params: Record<string, unknown> = {}) =>
    requestBlob(`/leads/export${qs(params)}`),
};

export const interactionApi = {
  list: (params: Record<string, unknown> = {}) =>
    request<PageResponse<InteractionResponse>>(`/interactions${qs(params)}`),

  preview: (leadId: number, type: InteractionType) =>
    request<ScorePreviewResponse>(
      `/interactions/preview${qs({ leadId, type })}`,
    ),

  create: (payload: Record<string, unknown>) =>
    request<InteractionResponse>('/interactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const taskApi = {
  list: (params: Record<string, unknown> = {}) =>
    request<PageResponse<TaskResponse>>(`/tasks${qs(params)}`),

  create: (payload: Record<string, unknown>) =>
    request<TaskResponse>('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Record<string, unknown>) =>
    request<TaskResponse>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  complete: (id: number) =>
    request<TaskResponse>(`/tasks/${id}/complete`, {
      method: 'PATCH',
    }),

  cancel: (id: number, reason?: string) =>
    request<TaskResponse>(`/tasks/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  reschedule: (id: number, dueAt: string) =>
    request<TaskResponse>(`/tasks/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ dueAt }),
    }),
};

export const branchApi = {
  list: (params: Record<string, unknown> = {}) =>
    request<BranchSummary[]>(`/branches${qs(params)}`),

  get: (id: number, params: Record<string, unknown> = {}) =>
    request<BranchDetails>(`/branches/${id}${qs(params)}`),

  create: (payload: Record<string, unknown>) =>
    request<BranchSummary>('/branches', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Record<string, unknown>) =>
    request<BranchSummary>(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

export const invitationApi = {
  create: (payload: Record<string, unknown>) =>
    request<InvitationResponse>('/users/invitations', { method: 'POST', body: JSON.stringify(payload) }),

  validate: (token: string) =>
    request<InvitationValidationResponse>(`/auth/invitations/validate${qs({ token })}`, {}, false, false),

  accept: (payload: { token: string; password: string; confirmPassword: string }) =>
    request<InvitationAcceptResponse>('/auth/invitations/accept', { method: 'POST', body: JSON.stringify(payload) }, false, false),
};

export const userApi = {
  list: (params: Record<string, unknown> = {}) =>
    request<UserResponse[]>(`/users${qs(params)}`),

  get: (id: number) => request<UserResponse>(`/users/${id}`),

  update: (id: number, payload: Record<string, unknown>) =>
    request<UserResponse>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  status: (id: number, status: UserStatus) =>
    request<UserResponse>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  impact: (id: number) =>
    request<{
      activeLeads: number;
      pendingTasks: number;
      canDeactivate: boolean;
    }>(`/users/${id}/deactivation-impact`),

  sellers: (branchId: number) =>
    request<UserResponse[]>(`/users/active-sellers${qs({ branchId })}`),
};

export const scoreRuleApi = {
  list: () => request<ScoreRuleResponse[]>('/score-rules'),

  create: (payload: Record<string, unknown>) =>
    request<ScoreRuleResponse>('/score-rules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Record<string, unknown>) =>
    request<ScoreRuleResponse>(`/score-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  status: (id: number, status: 'ACTIVE' | 'INACTIVE') =>
    request<ScoreRuleResponse>(`/score-rules/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

export const dashboardApi = {
  get: (params: Record<string, unknown> = {}) =>
    request<DashboardResponse>(`/dashboard${qs(params)}`),
};

export const rankingApi = {
  get: (params: Record<string, unknown> = {}) =>
    request<BranchRankingResponse[]>(`/ranking/branches${qs(params)}`),
};

export const notificationApi = {
  list: () => request<NotificationListResponse>('/notifications'),

  read: (id: number) =>
    request<void>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  readAll: () =>
    request<void>('/notifications/read-all', {
      method: 'PATCH',
    }),
};

export const settingsApi = {
  get: () => request<SettingsResponse>('/settings'),

  updateCompany: (payload: Record<string, unknown>) =>
    request<SettingsResponse>('/settings/company', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updatePreferences: (payload: Record<string, unknown>) =>
    request<SettingsResponse>('/settings/preferences', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
