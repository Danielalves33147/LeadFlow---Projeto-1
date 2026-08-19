import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { InteractionForm } from '../components/forms/InteractionForm';
import { LeadForm } from '../components/forms/LeadForm';
import { TaskForm } from '../components/forms/TaskForm';
import { Alert, Button, PageHeader, Select, useToast } from '../components/ui';
import { ApiError, branchApi, leadApi, userApi } from '../services/api';
import { fmtNumber, relativeTime, stageLabels } from '../services/format';
import type {
  BranchSummary,
  LeadResponse,
  LeadStage,
  LeadSummary,
  UserResponse,
} from '../types';
import '../styles/funnel.css';

const stages: LeadStage[] = [
  'NEW',
  'CONTACTED',
  'NEGOTIATION',
  'CUSTOMER',
  'LOST',
];

const colors: Record<LeadStage, string> = {
  NEW: '#0369A1',
  CONTACTED: '#1D4ED8',
  NEGOTIATION: '#B45309',
  CUSTOMER: '#15803D',
  LOST: '#B91C1C',
};

const ACTION_MENU_WIDTH = 196;

type FilterOption = {
  value: string;
  label: string;
};

type SearchableFilterProps = {
  value: string;
  placeholder: string;
  searchPlaceholder: string;
  options: FilterOption[];
  onChange: (value: string) => void;
};

type MenuPosition = {
  top: number;
  left: number;
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function SearchableFilter({
  value,
  placeholder,
  searchPlaceholder,
  options,
  onChange,
}: SearchableFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const normalizedSearch = normalizeText(search.trim());

    if (!normalizedSearch) {
      return options;
    }

    return options.filter((option) =>
      normalizeText(option.label).includes(normalizedSearch),
    );
  }, [options, search]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setSearch('');
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const selectedIndex = filteredOptions.findIndex(
      (option) => option.value === value,
    );

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, search, value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const activeOption = optionsRef.current?.querySelector(
      '[data-keyboard-active="true"]',
    );

    activeOption?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const selectOption = (option: FilterOption) => {
    onChange(option.value);
    setSearch('');
    setOpen(false);

    window.requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  };

  const openWithKeyboard = (direction: 'first' | 'last') => {
    setOpen(true);
    setSearch('');

    const selectedIndex = options.findIndex(
      (option) => option.value === value,
    );

    if (selectedIndex >= 0) {
      setActiveIndex(selectedIndex);
      return;
    }

    setActiveIndex(direction === 'last' ? Math.max(options.length - 1, 0) : 0);
  };

  const handleTriggerKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openWithKeyboard('first');
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      openWithKeyboard('last');
    }
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (filteredOptions.length > 0) {
        setActiveIndex((current) =>
          current >= filteredOptions.length - 1 ? 0 : current + 1,
        );
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (filteredOptions.length > 0) {
        setActiveIndex((current) =>
          current <= 0 ? filteredOptions.length - 1 : current - 1,
        );
      }
      return;
    }

    if (event.key === 'Home' && filteredOptions.length > 0) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === 'End' && filteredOptions.length > 0) {
      event.preventDefault();
      setActiveIndex(filteredOptions.length - 1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const option = filteredOptions[activeIndex];

      if (option) {
        selectOption(option);
      }
    }
  };

  return (
    <div ref={containerRef} className="lf-funnel-searchable-filter">
      <button
        ref={triggerRef}
        type="button"
        className={`lf-funnel-filter-trigger ${open ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <svg
          className="lf-funnel-filter-chevron"
          aria-hidden="true"
          viewBox="0 0 20 20"
        >
          <path d="M5.75 7.5 10 11.75 14.25 7.5" />
        </svg>
      </button>

      {open && (
        <div className="lf-funnel-filter-popover">
          <div className="lf-funnel-filter-search-wrap">
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <circle cx="8.5" cy="8.5" r="4.75" />
              <path d="m12 12 4 4" />
            </svg>
            <input
              ref={searchRef}
              type="search"
              value={search}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <div
            ref={optionsRef}
            className="lf-funnel-filter-options"
            role="listbox"
          >
            {filteredOptions.map((option, index) => (
              <button
                key={`${option.value}-${option.label}`}
                type="button"
                role="option"
                aria-selected={option.value === value}
                data-keyboard-active={index === activeIndex}
                className={[
                  option.value === value ? 'selected' : '',
                  index === activeIndex ? 'keyboard-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
              >
                <span>{option.label}</span>

                {option.value === value && (
                  <svg aria-hidden="true" viewBox="0 0 20 20">
                    <path d="m4.5 10.25 3.25 3.25 7.75-7.75" />
                  </svg>
                )}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="lf-funnel-filter-empty">
                Nenhuma opção encontrada.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type FunnelActionsMenuProps = {
  lead: LeadSummary;
  onView: () => void;
  onInteraction: () => void;
  onTask: () => void;
};

function FunnelActionsMenu({
  lead,
  onView,
  onInteraction,
  onTask,
}: FunnelActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const preferredLeft = rect.right - ACTION_MENU_WIDTH;
    const maximumLeft = window.innerWidth - ACTION_MENU_WIDTH - viewportPadding;

    setPosition({
      top: rect.bottom + 6,
      left: Math.max(viewportPadding, Math.min(preferredLeft, maximumLeft)),
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updatePosition();

    const handleViewportChange = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedPopover = popoverRef.current?.contains(target);

      if (!clickedTrigger && !clickedPopover) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const runAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div
      className="lf-funnel-card-menu"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        className="lf-funnel-card-menu-trigger"
        aria-label={`Ações do Lead ${lead.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        draggable={false}
        onClick={() => setOpen((current) => !current)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="lf-funnel-card-menu-popover"
            role="menu"
            style={{ top: position.top, left: position.left }}
          >
            <button type="button" role="menuitem" onClick={() => runAction(onView)}>
              Ver Lead
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => runAction(onInteraction)}
            >
              Registrar interação
            </button>
            <button type="button" role="menuitem" onClick={() => runAction(onTask)}>
              Criar tarefa
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

export function FunnelPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [branchId, setBranchId] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [mobileStage, setMobileStage] = useState<LeadStage>('NEW');
  const [drag, setDrag] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [interaction, setInteraction] = useState<number>();
  const [task, setTask] = useState<number>();

  useEffect(() => {
    if (user?.role === 'SELLER') {
      setBranches([]);
      setUsers([]);
      return;
    }

    branchApi.list().then(setBranches).catch(() => {});
    userApi.list().then(setUsers).catch(() => {});
  }, [user?.role]);

  const load = () => {
    leadApi
      .list({
        size: 100,
        branchId,
        responsibleId,
      })
      .then((page) => {
        setLeads(page.content);
        setError('');
      })
      .catch((cause) => {
        setError((cause as ApiError).message);
      });
  };

  useEffect(() => {
    load();
  }, [branchId, responsibleId]);

  const byStage = useMemo(
    () =>
      Object.fromEntries(
        stages.map((stage) => [
          stage,
          leads.filter((lead) => lead.stage === stage),
        ]),
      ) as Record<LeadStage, LeadSummary[]>,
    [leads],
  );

  const branchOptions = useMemo<FilterOption[]>(
    () => [
      { value: '', label: 'Todas as filiais' },
      ...branches.map((branch) => ({
        value: String(branch.id),
        label: branch.name,
      })),
    ],
    [branches],
  );

  const responsibleOptions = useMemo<FilterOption[]>(
    () => [
      { value: '', label: 'Todos os responsáveis' },
      ...users
        .filter((currentUser) => currentUser.role === 'SELLER')
        .map((currentUser) => ({
          value: String(currentUser.id),
          label: currentUser.name,
        })),
    ],
    [users],
  );

  const hasActiveFilters = Boolean(branchId || responsibleId);

  const clearFilters = () => {
    setBranchId('');
    setResponsibleId('');
  };

  const move = async (id: number, stage: LeadStage) => {
    const oldLead = leads.find((lead) => lead.id === id);

    if (!oldLead || oldLead.stage === stage) {
      return;
    }

    const previousStage = oldLead.stage;

    setLeads((current) =>
      current.map((lead) =>
        lead.id === id
          ? {
              ...lead,
              stage,
            }
          : lead,
      ),
    );

    try {
      await leadApi.stage(
        id,
        stage,
        stage === 'LOST' ? 'Movido para Perdido pelo funil' : undefined,
      );

      toast.push(
        'success',
        'Etapa atualizada',
        `${oldLead.name}: ${stageLabels[stage]}`,
      );
    } catch (cause) {
      setLeads((current) =>
        current.map((lead) =>
          lead.id === id
            ? {
                ...lead,
                stage: previousStage,
              }
            : lead,
        ),
      );

      toast.push(
        'error',
        'Não foi possível alterar a etapa',
        (cause as ApiError).message,
      );
    }
  };

  return (
    <div className="lf-funnel-page">
      <PageHeader
        title="Funil de Vendas"
        description="Movimente Leads entre etapas e acompanhe o fluxo comercial em tempo real."
      />

      <div className="lf-funnel-toolbar">
        {user?.role !== 'SELLER' && (
          <>
            <SearchableFilter
              value={branchId}
              placeholder="Todas as filiais"
              searchPlaceholder="Pesquisar filial..."
              options={branchOptions}
              onChange={setBranchId}
            />

            <SearchableFilter
              value={responsibleId}
              placeholder="Todos os responsáveis"
              searchPlaceholder="Pesquisar responsável..."
              options={responsibleOptions}
              onChange={setResponsibleId}
            />
          </>
        )}

        <div className="lf-funnel-toolbar-actions">
          {hasActiveFilters && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={clearFilters}
            >
              Limpar filtros
            </Button>
          )}

          <Button onClick={() => setNewOpen(true)}>
            + Novo Lead
          </Button>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="lf-mobile-stage-select">
        <Select
          value={mobileStage}
          onChange={(event) => setMobileStage(event.target.value as LeadStage)}
        >
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {stageLabels[stage]} ({byStage[stage].length})
            </option>
          ))}
        </Select>
      </div>

      <div className="lf-kanban lf-funnel-kanban">
        {stages.map((stage) => (
          <section
            key={stage}
            className={`lf-kanban-column ${
              mobileStage === stage ? 'mobile-active' : ''
            }`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (drag) {
                move(drag, stage);
              }

              setDrag(null);
            }}
          >
            <div className="lf-kanban-head">
              <div className="lf-kanban-title">{stageLabels[stage]}</div>
              <span className="lf-kanban-count">{byStage[stage].length}</span>
            </div>

            {byStage[stage].map((lead) => (
              <article
                key={lead.id}
                draggable
                className="lf-lead-card lf-funnel-lead-card"
                style={
                  {
                    '--stage-color': colors[stage],
                  } as React.CSSProperties
                }
                onDragStart={() => setDrag(lead.id)}
                onDragEnd={() => setDrag(null)}
                onDoubleClick={() => navigate(`/leads/${lead.id}`)}
              >
                <div className="lf-funnel-card-heading">
                  <div className="lf-lead-card-title">{lead.name}</div>

                  <FunnelActionsMenu
                    lead={lead}
                    onView={() => navigate(`/leads/${lead.id}`)}
                    onInteraction={() => setInteraction(lead.id)}
                    onTask={() => setTask(lead.id)}
                  />
                </div>

                <div className="lf-funnel-main-meta">
                  <span className="lf-funnel-responsible">
                    <span>Responsável:</span> {lead.responsibleUserName}
                  </span>
                  <strong>{fmtNumber(lead.score)} pts</strong>
                </div>

                <div className="lf-lead-card-meta lf-funnel-secondary-meta">
                  <span>{lead.branchName}</span>
                  <span>{relativeTime(lead.lastInteractionAt)}</span>
                </div>

                {lead.overdueTasks > 0 && (
                  <div className="lf-overdue">
                    ⚠ {lead.overdueTasks} tarefa
                    {lead.overdueTasks > 1 ? 's' : ''} atrasada
                    {lead.overdueTasks > 1 ? 's' : ''}
                  </div>
                )}

                <div
                  className="lf-funnel-stage-wrap"
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <Select
                    aria-label={`Alterar etapa do Lead ${lead.name}`}
                    className="lf-funnel-stage-select"
                    value={stage}
                    onChange={(event) =>
                      move(lead.id, event.target.value as LeadStage)
                    }
                  >
                    {stages.map((availableStage) => (
                      <option key={availableStage} value={availableStage}>
                        {stageLabels[availableStage]}
                      </option>
                    ))}
                  </Select>
                </div>
              </article>
            ))}

            {byStage[stage].length === 0 && (
              <div className="lf-kanban-empty">
                Nenhum Lead nesta etapa.
              </div>
            )}
          </section>
        ))}
      </div>

      <LeadForm
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onSaved={(lead: LeadResponse) => {
          load();
          navigate(`/leads/${lead.id}`);
        }}
      />

      <InteractionForm
        open={Boolean(interaction)}
        presetLeadId={interaction}
        onClose={() => setInteraction(undefined)}
        onSaved={load}
      />

      <TaskForm
        open={Boolean(task)}
        presetLeadId={task}
        onClose={() => setTask(undefined)}
        onSaved={load}
      />
    </div>
  );
}
