import type { InteractionChannel, InteractionType, LeadOrigin, LeadStage, ScoreOperation, TaskStatus, UserRole, UserStatus } from '../types';
export const stageLabels:Record<LeadStage,string>={NEW:'Novo',CONTACTED:'Em Contato',NEGOTIATION:'Negociação',CUSTOMER:'Cliente',LOST:'Perdido'};
export const originLabels:Record<LeadOrigin,string>={WEBSITE:'Site',REFERRAL:'Indicação',SOCIAL_MEDIA:'Redes sociais',OUTBOUND:'Prospecção ativa',EVENT:'Evento',PARTNER:'Parceiro',OTHER:'Outro'};
export const channelLabels:Record<InteractionChannel,string>={PHONE:'Telefone',WHATSAPP:'WhatsApp',EMAIL:'E-mail',MEETING:'Reunião',VISIT:'Visita',OTHER:'Outro'};
export const interactionTypeLabels:Record<InteractionType,string>={FIRST_CONTACT:'Primeiro contato',RETURN:'Retorno',PRESENTATION:'Apresentação',PROPOSAL:'Proposta enviada',NEGOTIATION:'Negociação',FOLLOW_UP:'Follow-up',CLOSING:'Fechamento',NO_RESPONSE:'Sem resposta'};
export const taskStatusLabels:Record<TaskStatus,string>={PENDING:'Pendente',COMPLETED:'Concluída',CANCELLED:'Cancelada',OVERDUE:'Atrasada'};
export const roleLabels:Record<UserRole,string>={ADMIN:'Administrador',MANAGER:'Gerente',SELLER:'Vendedor'};
export const userStatusLabels:Record<UserStatus,string>={ACTIVE:'Ativo',INACTIVE:'Inativo'};
export const operationLabels:Record<ScoreOperation,string>={ADD:'Somar',SUBTRACT:'Subtrair',SET:'Definir'};
export const fmtNumber=(n:number)=>new Intl.NumberFormat('pt-BR').format(n);
export const fmtPercent=(n:number)=>new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}).format(n)+'%';
export const fmtDate=(iso?:string)=>iso?new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(iso)):'—';
export const fmtDateTime=(iso?:string)=>iso?new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso)).replace(',',' •'):'—';
export const initials=(name:string)=>name.split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();
export const relativeTime=(iso?:string)=>{if(!iso)return 'Sem interação';const diff=Date.now()-new Date(iso).getTime();const h=Math.floor(diff/3600000);if(h<1)return 'há poucos minutos';if(h<24)return `há ${h} hora${h===1?'':'s'}`;const d=Math.floor(h/24);return `há ${d} dia${d===1?'':'s'}`;};
export const stageBadge=(s:LeadStage)=>s==='NEW'?'info':s==='CONTACTED'?'primary':s==='NEGOTIATION'?'warning':s==='CUSTOMER'?'success':'danger';
export const taskBadge=(s:TaskStatus)=>s==='COMPLETED'?'success':s==='OVERDUE'?'danger':s==='CANCELLED'?'neutral':'primary';

export const onlyDigits=(value:string)=>value.replace(/\D/g,'');
export const formatPhone=(value?:string)=>{
  if(!value)return '';
  const d=onlyDigits(value).slice(0,11);
  if(d.length<=2)return d.length?`(${d}`:'';
  if(d.length<=7)return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if(d.length<=10)return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};
export const formatCnpj=(value?:string)=>{
  if(!value)return '';
  const d=onlyDigits(value).slice(0,14);
  return d.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2');
};
export const formatCep=(value?:string)=>{
  if(!value)return '';
  const d=onlyDigits(value).slice(0,8);
  return d.length>5?`${d.slice(0,5)}-${d.slice(5)}`:d;
};
