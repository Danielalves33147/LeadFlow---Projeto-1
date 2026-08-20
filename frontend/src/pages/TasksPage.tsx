import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ApiError,
  branchApi,
  leadApi,
  taskApi,
  userApi,
} from '../services/api';
import {
  fmtDateTime,
  taskBadge,
  taskStatusLabels,
} from '../services/format';
import type {
  BranchSummary,
  LeadSummary,
  PageResponse,
  TaskResponse,
  TaskStatus,
  UserResponse,
} from '../types';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingPanel,
  Modal,
  PageHeader,
  Pagination,
  useToast,
} from '../components/ui';
import { TaskForm } from '../components/forms/TaskForm';
import { useAuth } from '../app/AuthContext';
import '../styles/tasks.css';

const PAGE_SIZE = 10;
const CALENDAR_PAGE_SIZE = 200;

const statusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'OVERDUE', label: 'Atrasada' },
  { value: 'COMPLETED', label: 'Concluída' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

type SearchOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  value: string;
  placeholder: string;
  options: SearchOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
};

function SearchableSelect({
  value,
  placeholder,
  options,
  onChange,
  ariaLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR');

    if (!normalized) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLocaleLowerCase('pt-BR').includes(normalized),
    );
  }, [options, search]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const choose = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="tasks-search-select" ref={rootRef}>
      <button
        type="button"
        className={`tasks-search-select-trigger ${open ? 'is-open' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label ?? placeholder}</span>
        <svg
          className="tasks-select-chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 10l5 5 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="tasks-search-select-menu">
          <div className="tasks-search-select-search">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16.5 16.5L21 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar..."
              aria-label={`Pesquisar em ${ariaLabel.toLowerCase()}`}
            />
          </div>

          <div className="tasks-search-select-options" role="listbox">
            <button
              type="button"
              className={`tasks-search-option ${value === '' ? 'is-selected' : ''}`}
              onClick={() => choose('')}
            >
              {placeholder}
            </button>

            {filteredOptions.length === 0 ? (
              <div className="tasks-search-empty">
                Nenhuma opção encontrada.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  className={`tasks-search-option ${
                    value === option.value ? 'is-selected' : ''
                  }`}
                  key={option.value}
                  onClick={() => choose(option.value)}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type TaskActionsProps = {
  task: TaskResponse;
  onEdit: () => void;
  onComplete: () => void;
  onCancel: () => void;
};

function TaskActions({
  task,
  onEdit,
  onComplete,
  onCancel,
}: TaskActionsProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isClosed = ['COMPLETED', 'CANCELLED'].includes(task.status);

  useEffect(() => {
    if (!open) {
      return;
    }

    const close = () => setOpen(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 190;
      const left = Math.min(
        Math.max(12, rect.right - menuWidth),
        window.innerWidth - menuWidth - 12,
      );

      setPosition({
        top: rect.bottom + 6,
        left,
      });
    }

    setOpen((current) => !current);
  };

  const runAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="tasks-actions-trigger"
        aria-label={`Ações da tarefa ${task.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <span aria-hidden="true">•••</span>
      </button>

      {open &&
        createPortal(
          <div
            className="tasks-actions-menu"
            role="menu"
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => runAction(onEdit)}
            >
              Editar tarefa
            </button>

            {!isClosed && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => runAction(onComplete)}
                >
                  Concluir tarefa
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="is-danger"
                  onClick={() => runAction(onCancel)}
                >
                  Cancelar tarefa
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function monthCells(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  const occupiedDays = firstDay.getDay() + lastDay.getDate();
  const totalCells = Math.ceil(occupiedDays / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return current;
  });
}

function dateRange(value: string) {
  if (!value) {
    return { from: undefined, to: undefined };
  }

  const [year, month, day] = value.split('-').map(Number);
  const from = new Date(year, month - 1, day, 0, 0, 0, 0);
  const to = new Date(year, month - 1, day, 23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function monthRange(date: Date) {
  const from = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function TasksPage() {
  const { user } = useAuth();
  const { push: pushToast } = useToast();

  const [data, setData] = useState<PageResponse<TaskResponse>>({
    content: [],
    page: 0,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });
  const [calendarTasks, setCalendarTasks] = useState<TaskResponse[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'list' | 'calendar'>('list');
  const [page, setPage] = useState(0);

  const [branchId, setBranchId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [status, setStatus] = useState('');
  const [titleSearch, setTitleSearch] = useState('');
  const [debouncedTitle, setDebouncedTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<TaskResponse | null>(null);
  const [details, setDetails] = useState<TaskResponse | null>(null);
  const [month, setMonth] = useState(() => new Date());
  const [calendarDate, setCalendarDate] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedTitle(titleSearch.trim());
      setPage(0);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [titleSearch]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadFilters = async () => {
      try {
        const leadPage = await leadApi.list({ size: 100, sort: 'name,asc' });
        setLeads(leadPage.content);

        // O vendedor só pode trabalhar com os próprios Leads e tarefas.
        // Não chamamos endpoints administrativos de filiais/equipe para esse perfil.
        if (user.role === 'SELLER') {
          setBranches([]);
          setUsers([]);
          return;
        }

        const [branchList, userList] = await Promise.all([
          branchApi.list(),
          userApi.list(),
        ]);

        setBranches(branchList);
        setUsers(userList);
      } catch (cause) {
        pushToast(
          'error',
          'Não foi possível carregar os filtros',
          (cause as ApiError).message,
        );
      }
    };

    void loadFilters();
  }, [pushToast, user]);

  const loadList = () => {
    const range = dateRange(dueDate);

    setLoading(true);
    setError('');

    taskApi
      .list({
        page,
        size: PAGE_SIZE,
        sort: 'dueAt,asc',
        branchId: branchId || undefined,
        leadId: leadId || undefined,
        responsibleId: responsibleId || undefined,
        status: status || undefined,
        title: debouncedTitle || undefined,
        from: range.from,
        to: range.to,
      })
      .then(setData)
      .catch((cause) => setError((cause as ApiError).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (mode === 'list') {
      loadList();
    }
  }, [
    mode,
    page,
    branchId,
    leadId,
    responsibleId,
    status,
    debouncedTitle,
    dueDate,
  ]);

  const loadCalendar = () => {
    const range = monthRange(month);
    setCalendarLoading(true);
    setError('');

    return taskApi
      .list({
        page: 0,
        size: CALENDAR_PAGE_SIZE,
        sort: 'dueAt,asc',
        from: range.from,
        to: range.to,
      })
      .then((response) => setCalendarTasks(response.content))
      .catch((cause) => setError((cause as ApiError).message))
      .finally(() => setCalendarLoading(false));
  };

  useEffect(() => {
    if (mode === 'calendar') {
      loadCalendar();
    }
  }, [mode, month]);

  const mutate = async (
    kind: 'complete' | 'cancel',
    task: TaskResponse,
  ) => {
    try {
      if (kind === 'complete') {
        await taskApi.complete(task.id);
      } else {
        await taskApi.cancel(task.id, 'Cancelada pelo usuário');
      }

      pushToast(
        'success',
        kind === 'complete' ? 'Tarefa concluída' : 'Tarefa cancelada',
        task.title,
      );

      if (mode === 'list') {
        loadList();
      } else {
        await loadCalendar();
      }
    } catch (cause) {
      pushToast(
        'error',
        'Não foi possível atualizar',
        (cause as ApiError).message,
      );
    }
  };

  const clearFilters = () => {
    setBranchId('');
    setLeadId('');
    setResponsibleId('');
    setStatus('');
    setTitleSearch('');
    setDebouncedTitle('');
    setDueDate('');
    setPage(0);
  };

  const openDayTasks = (date: Date) => {
    setBranchId('');
    setLeadId('');
    setResponsibleId('');
    setStatus('');
    setTitleSearch('');
    setDebouncedTitle('');
    setDueDate(dateInputValue(date));
    setPage(0);
    setMode('list');
  };

  const hasFilters = Boolean(
    branchId ||
      leadId ||
      responsibleId ||
      status ||
      titleSearch ||
      dueDate,
  );

  const branchOptions: SearchOption[] = branches.map((branch) => ({
    value: String(branch.id),
    label: branch.name,
  }));

  const leadOptions: SearchOption[] = leads.map((lead) => ({
    value: String(lead.id),
    label: lead.name,
  }));

  const responsibleOptions: SearchOption[] = users.map((user) => ({
    value: String(user.id),
    label: user.name,
  }));

  const taskStatusOptions: SearchOption[] = statusOptions.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  const cells = monthCells(month);

  const eventsByDay = (date: Date) =>
    calendarTasks.filter((task) => {
      const dueAt = new Date(task.dueAt);

      return (
        dueAt.getFullYear() === date.getFullYear() &&
        dueAt.getMonth() === date.getMonth() &&
        dueAt.getDate() === date.getDate()
      );
    });

  const handleSaved = () => {
    if (mode === 'list') {
      loadList();
      return;
    }

    loadCalendar();
  };

  return (
    <>
      <PageHeader
        title="Tarefas"
        description="Organize compromissos, prazos e próximos passos comerciais."
        actions={
          <>
            <div className="lf-task-segment">
              <button
                className={`lf-segment-btn ${mode === 'list' ? 'active' : ''}`}
                onClick={() => setMode('list')}
              >
                Lista
              </button>
              <button
                className={`lf-segment-btn ${mode === 'calendar' ? 'active' : ''}`}
                onClick={() => setMode('calendar')}
              >
                Calendário
              </button>
            </div>

            {mode === 'calendar' && (
              <Button onClick={() => setOpen(true)}>+ Nova Tarefa</Button>
            )}
          </>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      {mode === 'list' ? (
        <>
          <div className="tasks-filter-bar">
            <div className={`tasks-filter-grid ${user?.role === 'SELLER' ? 'tasks-filter-grid-seller' : ''}`}>
              <div className="tasks-title-filter">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16.5 16.5L21 21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="search"
                  value={titleSearch}
                  onChange={(event) => setTitleSearch(event.target.value)}
                  placeholder="Nome da tarefa"
                  aria-label="Pesquisar pelo nome da tarefa"
                />
              </div>

              <SearchableSelect
                value={leadId}
                placeholder="Todos os Leads"
                options={leadOptions}
                onChange={(value) => {
                  setLeadId(value);
                  setPage(0);
                }}
                ariaLabel="Filtrar por Lead"
              />

              {user?.role !== 'SELLER' && (
                <>
                  <SearchableSelect
                    value={responsibleId}
                    placeholder="Todos os responsáveis"
                    options={responsibleOptions}
                    onChange={(value) => {
                      setResponsibleId(value);
                      setPage(0);
                    }}
                    ariaLabel="Filtrar por responsável"
                  />

                  <SearchableSelect
                    value={branchId}
                    placeholder="Todas as filiais"
                    options={branchOptions}
                    onChange={(value) => {
                      setBranchId(value);
                      setPage(0);
                    }}
                    ariaLabel="Filtrar por filial"
                  />
                </>
              )}

              <SearchableSelect
                value={status}
                placeholder="Todos os status"
                options={taskStatusOptions}
                onChange={(value) => {
                  setStatus(value);
                  setPage(0);
                }}
                ariaLabel="Filtrar por status"
              />

              <div className="tasks-date-filter">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => {
                    setDueDate(event.target.value);
                    setPage(0);
                  }}
                  aria-label="Filtrar por data"
                />
              </div>
            </div>

            <div className="tasks-filter-actions">
              {hasFilters && (
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={clearFilters}
                >
                  Limpar filtros
                </Button>
              )}
              <Button onClick={() => setOpen(true)}>+ Nova Tarefa</Button>
            </div>
          </div>

          {loading ? (
            <LoadingPanel />
          ) : data.content.length === 0 ? (
            <Card>
              <EmptyState
                title="Nenhuma tarefa encontrada"
                text="Ajuste os filtros ou crie uma nova tarefa."
                action={
                  <Button onClick={() => setOpen(true)}>Nova tarefa</Button>
                }
              />
            </Card>
          ) : (
            <>
              <div className="lf-table-wrap mobile-cards tasks-table-wrap">
                <table className="lf-table tasks-table">
                  <colgroup>
                    <col className="tasks-col-title" />
                    <col className="tasks-col-lead" />
                    <col className="tasks-col-responsible" />
                    <col className="tasks-col-branch" />
                    <col className="tasks-col-date" />
                    <col className="tasks-col-status" />
                    <col className="tasks-col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Tarefa</th>
                      <th>Lead</th>
                      <th>Responsável</th>
                      <th>Filial</th>
                      <th>Data e horário</th>
                      <th>Status</th>
                      <th className="tasks-actions-header">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.content.map((task) => (
                      <tr
                        key={task.id}
                        className="tasks-task-row"
                        tabIndex={0}
                        aria-label={`Abrir detalhes da tarefa ${task.title}`}
                        onClick={() => setDetails(task)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setDetails(task);
                          }
                        }}
                      >
                        <td>
                          <strong>{task.title}</strong>
                        </td>
                        <td>{task.leadName}</td>
                        <td>{task.responsibleUserName}</td>
                        <td>{task.branchName}</td>
                        <td>{fmtDateTime(task.dueAt)}</td>
                        <td>
                          <Badge tone={taskBadge(task.status)}>
                            {taskStatusLabels[task.status]}
                          </Badge>
                        </td>
                        <td
                          className="tasks-actions-cell"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <TaskActions
                            task={task}
                            onEdit={() => setEdit(task)}
                            onComplete={() => mutate('complete', task)}
                            onCancel={() => mutate('cancel', task)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPage={setPage}
              />
            </>
          )}
        </>
      ) : calendarLoading ? (
        <LoadingPanel />
      ) : (
        <>
          <div className="lf-calendar-toolbar tasks-calendar-toolbar">
            <div className="tasks-calendar-nav-group">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setMonth(
                    (current) =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() - 1,
                        1,
                      ),
                  )
                }
              >
                ← Anterior
              </Button>

              <strong className="tasks-calendar-month-title">
                {month.toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setMonth(
                    (current) =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() + 1,
                        1,
                      ),
                  )
                }
              >
                Próximo →
              </Button>
            </div>

            <div className="tasks-calendar-date-jump">
              <label htmlFor="tasks-calendar-date">Ir para data</label>
              <input
                id="tasks-calendar-date"
                type="date"
                value={calendarDate}
                onChange={(event) => {
                  const value = event.target.value;
                  setCalendarDate(value);

                  if (!value) {
                    return;
                  }

                  const [year, monthIndex, day] = value.split('-').map(Number);
                  setMonth(new Date(year, monthIndex - 1, day));
                }}
              />
              {calendarDate && (
                <button
                  type="button"
                  className="tasks-calendar-clear-date"
                  onClick={() => setCalendarDate('')}
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="lf-calendar tasks-calendar">
            <div className="lf-calendar-head">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(
                (day) => (
                  <div key={day}>{day}</div>
                ),
              )}
            </div>

            <div className="lf-calendar-grid">
              {cells.map((date) => {
                const dayEvents = eventsByDay(date);
                const visibleEvents = dayEvents.slice(0, 2);
                const hiddenCount = dayEvents.length - visibleEvents.length;

                return (
                  <div
                    className={`lf-calendar-day ${
                      date.getMonth() !== month.getMonth() ? 'muted' : ''
                    } ${
                      calendarDate &&
                      date.getFullYear() === Number(calendarDate.slice(0, 4)) &&
                      date.getMonth() === Number(calendarDate.slice(5, 7)) - 1 &&
                      date.getDate() === Number(calendarDate.slice(8, 10))
                        ? 'is-selected-date'
                        : ''
                    }`}
                    key={date.toISOString()}
                  >
                    <div className="lf-calendar-date">{date.getDate()}</div>

                    {visibleEvents.map((task) => (
                      <button
                        key={task.id}
                        title={`${task.title} • ${fmtDateTime(task.dueAt)}`}
                        className={`lf-calendar-event ${
                          task.status === 'OVERDUE'
                            ? 'overdue'
                            : task.status === 'COMPLETED'
                              ? 'completed'
                              : ''
                        }`}
                        onClick={() => setDetails(task)}
                      >
                        {task.title}
                      </button>
                    ))}

                    {hiddenCount > 0 && (
                      <button
                        type="button"
                        className="tasks-calendar-more"
                        onClick={() => openDayTasks(date)}
                        aria-label={`Ver todas as ${dayEvents.length} tarefas de ${date.toLocaleDateString('pt-BR')}`}
                      >
                        +{hiddenCount} tarefa{hiddenCount === 1 ? '' : 's'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Modal
        open={Boolean(details)}
        title={details?.title ?? 'Detalhes da tarefa'}
        description="Visualize todas as informações registradas nesta tarefa."
        size="lg"
        onClose={() => setDetails(null)}
        footer={
          details ? (
            <>
              <Button variant="secondary" onClick={() => setDetails(null)}>
                Fechar
              </Button>
              <Button
                onClick={() => {
                  setEdit(details);
                  setDetails(null);
                }}
              >
                Editar tarefa
              </Button>
            </>
          ) : undefined
        }
      >
        {details && (
          <div className="tasks-details">
            <div className="tasks-details-grid">
              <div className="tasks-details-item">
                <span>Lead</span>
                <strong>{details.leadName || 'Não informado'}</strong>
              </div>
              <div className="tasks-details-item">
                <span>Responsável</span>
                <strong>{details.responsibleUserName || 'Não informado'}</strong>
              </div>
              <div className="tasks-details-item">
                <span>Filial</span>
                <strong>{details.branchName || 'Não informada'}</strong>
              </div>
              <div className="tasks-details-item">
                <span>Data e horário</span>
                <strong>{fmtDateTime(details.dueAt)}</strong>
              </div>
              <div className="tasks-details-item">
                <span>Status</span>
                <div>
                  <Badge tone={taskBadge(details.status)}>
                    {taskStatusLabels[details.status]}
                  </Badge>
                </div>
              </div>
              <div className="tasks-details-item">
                <span>Criada em</span>
                <strong>{fmtDateTime(details.createdAt)}</strong>
              </div>
              {details.completedAt && (
                <div className="tasks-details-item">
                  <span>Concluída em</span>
                  <strong>{fmtDateTime(details.completedAt)}</strong>
                </div>
              )}
            </div>

            <div className="tasks-details-description">
              <span>Descrição</span>
              <p>{details.description?.trim() || 'Nenhuma descrição informada.'}</p>
            </div>
          </div>
        )}
      </Modal>

      <TaskForm
        open={open || Boolean(edit)}
        task={edit}
        onClose={() => {
          setOpen(false);
          setEdit(null);
        }}
        onSaved={() => {
          setOpen(false);
          setEdit(null);
          handleSaved();
        }}
      />
    </>
  );
}
