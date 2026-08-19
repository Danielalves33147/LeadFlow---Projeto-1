import type {
  InteractionChannel,
  InteractionType,
  LeadOrigin,
  LeadStage,
  ScoreOperation,
  TaskStatus,
  UserRole,
  UserStatus,
} from '../types';
import { getTimezone } from './preferences';

export const stageLabels: Record<LeadStage, string> = {
  NEW: 'Novo',
  CONTACTED: 'Em Contato',
  NEGOTIATION: 'Negociação',
  CUSTOMER: 'Cliente',
  LOST: 'Perdido',
};

export const originLabels: Record<LeadOrigin, string> = {
  WEBSITE: 'Site',
  REFERRAL: 'Indicação',
  SOCIAL_MEDIA: 'Redes sociais',
  OUTBOUND: 'Prospecção ativa',
  EVENT: 'Evento',
  PARTNER: 'Parceiro',
  OTHER: 'Outro',
};

export const channelLabels: Record<InteractionChannel, string> = {
  PHONE: 'Telefone',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  MEETING: 'Reunião',
  VISIT: 'Visita',
  OTHER: 'Outro',
};

export const interactionTypeLabels: Record<InteractionType, string> = {
  FIRST_CONTACT: 'Primeiro contato',
  RETURN: 'Retorno',
  PRESENTATION: 'Apresentação',
  PROPOSAL: 'Proposta enviada',
  NEGOTIATION: 'Negociação',
  FOLLOW_UP: 'Follow-up',
  CLOSING: 'Fechamento',
  NO_RESPONSE: 'Sem resposta',
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  PENDING: 'Pendente',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  OVERDUE: 'Atrasada',
};

export const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  SELLER: 'Vendedor',
};

export const userStatusLabels: Record<UserStatus, string> = {
  PENDING_EMAIL_VERIFICATION: 'Aguardando confirmação',
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
};

export const operationLabels: Record<ScoreOperation, string> = {
  ADD: 'Somar',
  SUBTRACT: 'Subtrair',
  SET: 'Definir',
};

export const fmtNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(value);

export const fmtPercent = (value: number) =>
  `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}%`;

export const fmtDate = (iso?: string) => {
  if (!iso) {
    return '—';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: getTimezone(),
  }).format(new Date(iso));
};

export const fmtDateTime = (iso?: string) => {
  if (!iso) {
    return '—';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: getTimezone(),
  })
    .format(new Date(iso))
    .replace(',', ' •');
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export const relativeTime = (iso?: string) => {
  if (!iso) {
    return 'Sem interação';
  }

  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);

  if (hours < 1) {
    return 'há poucos minutos';
  }

  if (hours < 24) {
    return `há ${hours} hora${hours === 1 ? '' : 's'}`;
  }

  const days = Math.floor(hours / 24);
  return `há ${days} dia${days === 1 ? '' : 's'}`;
};

export const stageBadge = (stage: LeadStage) => {
  if (stage === 'NEW') {
    return 'info';
  }

  if (stage === 'CONTACTED') {
    return 'primary';
  }

  if (stage === 'NEGOTIATION') {
    return 'warning';
  }

  if (stage === 'CUSTOMER') {
    return 'success';
  }

  return 'danger';
};

export const taskBadge = (status: TaskStatus) => {
  if (status === 'COMPLETED') {
    return 'success';
  }

  if (status === 'OVERDUE') {
    return 'danger';
  }

  if (status === 'CANCELLED') {
    return 'neutral';
  }

  return 'primary';
};

export const onlyDigits = (value: string) => value.replace(/\D/g, '');

export const formatPhone = (value?: string) => {
  if (!value) {
    return '';
  }

  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits.length ? `(${digits}` : '';
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const formatCnpj = (value?: string) => {
  if (!value) {
    return '';
  }

  const digits = onlyDigits(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

export const formatCep = (value?: string) => {
  if (!value) {
    return '';
  }

  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
};
