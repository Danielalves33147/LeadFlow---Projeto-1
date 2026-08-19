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
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingPanel,
  PageHeader,
  Pagination,
} from '../components/ui';
import { ApiError, branchApi, leadApi, userApi } from '../services/api';
import {
  fmtDateTime,
  fmtNumber,
  formatPhone,
  originLabels,
  relativeTime,
  stageBadge,
  stageLabels,
} from '../services/format';
import type {
  BranchSummary,
  LeadOrigin,
  LeadResponse,
  LeadStage,
  LeadSummary,
  PageResponse,
  UserResponse,
} from '../types';
import '../styles/leads.css';

const PAGE_SIZE = 10;
const ACTION_MENU_WIDTH = 208;

const stages: LeadStage[] = [
  'NEW',
  'CONTACTED',
  'NEGOTIATION',
  'CUSTOMER',
  'LOST',
];

const origins = Object.keys(originLabels) as LeadOrigin[];


type FilterOption = {
  value: string;
  label: string;
};

type SearchableFilterProps = {
  value: string;
  placeholder: string;
  searchPlaceholder: string;
  options: FilterOption[];
  className?: string;
  onChange: (value: string) => void;
};

type LeadNameFilterProps = {
  value: string;
  onChange: (value: string) => void;
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function FilterChevron() {
  return (
    <svg
      className="lf-leads-filter-chevron"
      aria-hidden="true"
      viewBox="0 0 20 20"
    >
      <path d="M5.75 7.5 10 11.75 14.25 7.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <circle cx="8.5" cy="8.5" r="4.75" />
      <path d="m12 12 4 4" />
    </svg>
  );
}

function SearchableFilter({
  value,
  placeholder,
  searchPlaceholder,
  options,
  className = '',
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
  }, [filteredOptions, open, value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const activeOption = optionsRef.current?.querySelector(
      '[data-keyboard-active="true"]',
    );

    activeOption?.scrollIntoView({
      block: 'nearest',
    });
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
    <div
      ref={containerRef}
      className={`lf-leads-searchable-filter ${className}`.trim()}
    >
      <button
        ref={triggerRef}
        type="button"
        className="lf-leads-filter-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <FilterChevron />
      </button>

      {open && (
        <div className="lf-leads-filter-popover">
          <div className="lf-leads-filter-search-wrap">
            <SearchIcon />
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
            className="lf-leads-filter-options"
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

                {option.value === value && option.value !== '' && (
                  <svg aria-hidden="true" viewBox="0 0 20 20">
                    <path d="m4.5 10.25 3.25 3.25 7.75-7.75" />
                  </svg>
                )}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="lf-leads-filter-empty">
                Nenhuma opção encontrada.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LeadNameFilter({ value, onChange }: LeadNameFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<LeadSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const availableOptions = useMemo(() => {
    return [
      {
        value: '',
        label: 'Todos os Leads',
      },
      ...results.map((lead) => ({
        value: lead.name,
        label: lead.name,
      })),
    ];
  }, [results]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
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

    window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !search.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    let active = true;

    const timeout = window.setTimeout(() => {
      setSearching(true);

      leadApi
        .list({
          search: search.trim(),
          page: 0,
          size: 8,
          sort: 'name,asc',
        })
        .then((response) => {
          if (!active) {
            return;
          }

          const uniqueByName = Array.from(
            new Map(
              response.content.map((lead) => [
                normalizeText(lead.name),
                lead,
              ]),
            ).values(),
          );

          setResults(uniqueByName);
        })
        .catch(() => {
          if (active) {
            setResults([]);
          }
        })
        .finally(() => {
          if (active) {
            setSearching(false);
          }
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [open, search]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const selectedIndex = availableOptions.findIndex(
      (option) => option.value === value,
    );

    if (selectedIndex >= 0) {
      setActiveIndex(selectedIndex);
      return;
    }

    setActiveIndex(search.trim() && availableOptions.length > 1 ? 1 : 0);
  }, [availableOptions, open, search, value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const activeOption = optionsRef.current?.querySelector(
      '[data-keyboard-active="true"]',
    );

    activeOption?.scrollIntoView({
      block: 'nearest',
    });
  }, [activeIndex, open]);

  const chooseLeadName = (name: string) => {
    onChange(name);
    setSearch('');
    setOpen(false);

    window.requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  };

  const handleTriggerKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setSearch('');
      setActiveIndex(0);
    }
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (availableOptions.length > 0) {
        setActiveIndex((current) =>
          current >= availableOptions.length - 1 ? 0 : current + 1,
        );
      }

      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (availableOptions.length > 0) {
        setActiveIndex((current) =>
          current <= 0 ? availableOptions.length - 1 : current - 1,
        );
      }

      return;
    }

    if (event.key === 'Home' && availableOptions.length > 0) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === 'End' && availableOptions.length > 0) {
      event.preventDefault();
      setActiveIndex(availableOptions.length - 1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      const option = availableOptions[activeIndex];

      if (option) {
        chooseLeadName(option.value);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="lf-leads-searchable-filter lf-leads-filter-name"
    >
      <button
        ref={triggerRef}
        type="button"
        className="lf-leads-filter-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{value || 'Nome do Lead'}</span>
        <FilterChevron />
      </button>

      {open && (
        <div className="lf-leads-filter-popover lf-leads-name-popover">
          <div className="lf-leads-filter-search-wrap">
            <SearchIcon />
            <input
              ref={searchRef}
              type="search"
              value={search}
              placeholder="Pesquisar nome do Lead"
              aria-label="Pesquisar nome do Lead"
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <div
            ref={optionsRef}
            className="lf-leads-filter-options"
            role="listbox"
          >
            <button
              type="button"
              role="option"
              aria-selected={!value}
              data-keyboard-active={activeIndex === 0}
              className={[
                !value ? 'selected' : '',
                activeIndex === 0 ? 'keyboard-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseEnter={() => setActiveIndex(0)}
              onClick={() => chooseLeadName('')}
            >
              <span>Todos os Leads</span>
            </button>

            {!search.trim() && (
              <div className="lf-leads-filter-hint">
                Digite parte do nome para pesquisar.
              </div>
            )}

            {searching && (
              <div className="lf-leads-filter-hint">Pesquisando...</div>
            )}

            {!searching &&
              search.trim() &&
              results.map((lead, resultIndex) => {
                const optionIndex = resultIndex + 1;

                return (
                  <button
                    key={lead.id}
                    type="button"
                    role="option"
                    aria-selected={lead.name === value}
                    data-keyboard-active={activeIndex === optionIndex}
                    className={[
                      lead.name === value ? 'selected' : '',
                      activeIndex === optionIndex ? 'keyboard-active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseEnter={() => setActiveIndex(optionIndex)}
                    onClick={() => chooseLeadName(lead.name)}
                  >
                    <span>{lead.name}</span>

                    {lead.name === value && (
                      <svg aria-hidden="true" viewBox="0 0 20 20">
                        <path d="m4.5 10.25 3.25 3.25 7.75-7.75" />
                      </svg>
                    )}
                  </button>
                );
              })}

            {!searching && search.trim() && results.length === 0 && (
              <div className="lf-leads-filter-empty">
                Nenhum Lead encontrado.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type LeadActionsMenuProps = {
  lead: LeadSummary;
  onView: () => void;
  onEdit: () => void;
  onInteraction: () => void;
  onTask: () => void;
};

type MenuPosition = {
  top: number;
  left: number;
};

function LeadActionsMenu({
  lead,
  onView,
  onEdit,
  onInteraction,
  onTask,
}: LeadActionsMenuProps) {
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

  const toggleMenu = () => {
    if (!open) {
      updatePosition();
    }

    setOpen((current) => !current);
  };

  const runAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="lf-lead-actions-menu">
      <button
        ref={triggerRef}
        type="button"
        className="lf-lead-actions-trigger"
        aria-label={`Ações do Lead ${lead.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleMenu}
      >
        <svg
          aria-hidden="true"
          className="lf-lead-actions-icon"
          viewBox="0 0 24 24"
        >
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className="lf-lead-actions-popover"
            role="menu"
            style={{ top: position.top, left: position.left }}
          >
            <button type="button" role="menuitem" onClick={() => runAction(onView)}>
              Ver Lead
            </button>
            <button type="button" role="menuitem" onClick={() => runAction(onEdit)}>
              Editar
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

export function LeadsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<PageResponse<LeadSummary>>({
    content: [],
    page: 0,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });

  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [edit, setEdit] = useState<LeadResponse | null>(null);
  const [interactionLead, setInteractionLead] = useState<number>();
  const [taskLead, setTaskLead] = useState<number>();

  const [filters, setFilters] = useState({
    search: '',
    branchId: '',
    stage: '',
    responsibleId: '',
    origin: '',
    page: 0,
    size: PAGE_SIZE,
  });

  useEffect(() => {
    if (user?.role === 'SELLER') {
      setBranches([]);
      setUsers([]);
      return;
    }

    branchApi.list().then(setBranches).catch(() => {});
    userApi.list().then(setUsers).catch(() => {});
  }, [user?.role]);

  const query = useMemo(
    () => ({
      ...filters,
      page: filters.page,
      sort: 'createdAt,desc',
    }),
    [filters],
  );

  const load = () => {
    setLoading(true);
    setError('');

    leadApi
      .list(query)
      .then(setData)
      .catch((cause) => setError((cause as ApiError).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = window.setTimeout(load, filters.search ? 350 : 0);

    return () => window.clearTimeout(timeout);
  }, [
    filters.search,
    filters.branchId,
    filters.stage,
    filters.responsibleId,
    filters.origin,
    filters.page,
    filters.size,
  ]);

  const setFilter = (key: string, value: string | number) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? Number(value) : 0,
    }));
  };

  const clearFilters = () => {
    setFilters((current) => ({
      ...current,
      search: '',
      branchId: '',
      stage: '',
      responsibleId: '',
      origin: '',
      page: 0,
    }));
  };

  const openEdit = async (id: number) => {
    try {
      setEdit(await leadApi.get(id));
    } catch (cause) {
      setError((cause as ApiError).message);
    }
  };

  const exportCsv = async () => {
    try {
      const blob = await leadApi.exportCsv(query);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = 'leads.csv';

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError((cause as ApiError).message);
    }
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => !['page', 'size'].includes(key) && value !== '',
  );

  return (
    <>
      <PageHeader title="Leads" />

      <div className="lf-toolbar lf-leads-toolbar">
        <LeadNameFilter
          value={filters.search}
          onChange={(value) => setFilter('search', value)}
        />

        {user?.role !== 'SELLER' && (
          <SearchableFilter
            className="lf-leads-filter-branch"
            value={filters.branchId}
            placeholder="Todas as filiais"
            searchPlaceholder="Pesquisar filial"
            options={[
              { value: '', label: 'Todas as filiais' },
              ...branches.map((branch) => ({
                value: String(branch.id),
                label: branch.name,
              })),
            ]}
            onChange={(value) => setFilter('branchId', value)}
          />
        )}

        <SearchableFilter
          className="lf-leads-filter-stage"
          value={filters.stage}
          placeholder="Todas as etapas"
          searchPlaceholder="Pesquisar etapa"
          options={[
            { value: '', label: 'Todas as etapas' },
            ...stages.map((stage) => ({
              value: stage,
              label: stageLabels[stage],
            })),
          ]}
          onChange={(value) => setFilter('stage', value)}
        />

        {user?.role !== 'SELLER' && (
          <SearchableFilter
            className="lf-leads-filter-responsible"
            value={filters.responsibleId}
            placeholder="Todos os responsáveis"
            searchPlaceholder="Pesquisar responsável"
            options={[
              { value: '', label: 'Todos os responsáveis' },
              ...users
                .filter((candidate) => candidate.role === 'SELLER')
                .map((candidate) => ({
                  value: String(candidate.id),
                  label: candidate.name,
                })),
            ]}
            onChange={(value) => setFilter('responsibleId', value)}
          />
        )}

        <SearchableFilter
          className="lf-leads-filter-origin"
          value={filters.origin}
          placeholder="Todas as origens"
          searchPlaceholder="Pesquisar origem"
          options={[
            { value: '', label: 'Todas as origens' },
            ...origins.map((origin) => ({
              value: origin,
              label: originLabels[origin],
            })),
          ]}
          onChange={(value) => setFilter('origin', value)}
        />

        {hasActiveFilters && (
          <Button
            className="lf-leads-clear-filters"
            variant="tertiary"
            size="sm"
            onClick={clearFilters}
          >
            Limpar filtros
          </Button>
        )}

        <div className="lf-leads-toolbar-actions">
          <Button variant="secondary" onClick={exportCsv}>
            Exportar CSV
          </Button>

          <Button onClick={() => setNewOpen(true)}>
            + Novo Lead
          </Button>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <LoadingPanel />
      ) : data.content.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhum Lead encontrado"
            text="Ajuste os filtros ou cadastre um novo Lead."
            action={<Button onClick={() => setNewOpen(true)}>Cadastrar Lead</Button>}
          />
        </Card>
      ) : (
        <>
          <div className="lf-table-wrap lf-leads-table-wrap mobile-cards">
            <table className="lf-table lf-leads-table">
              <colgroup>
                <col className="lf-leads-col-lead" />
                <col className="lf-leads-col-contact" />
                <col className="lf-leads-col-branch" />
                <col className="lf-leads-col-responsible" />
                <col className="lf-leads-col-origin" />
                <col className="lf-leads-col-stage" />
                <col className="lf-leads-col-score" />
                <col className="lf-leads-col-last" />
                <col className="lf-leads-col-actions" />
              </colgroup>

              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Contato</th>
                  <th>Filial</th>
                  <th>Responsável</th>
                  <th>Origem</th>
                  <th className="lf-leads-stage-heading">Etapa</th>
                  <th className="lf-leads-score-heading">
                    <span className="lf-leads-score-axis">Pontuação</span>
                  </th>
                  <th className="lf-leads-last-heading">Última interação</th>
                  <th className="lf-leads-actions-column" aria-label="Ações" />
                </tr>
              </thead>

              <tbody>
                {data.content.map((lead) => (
                  <tr key={lead.id}>
                    <td className="lf-leads-cell lf-leads-cell-lead">
                      <button
                        className="lf-table-link lf-plain-button lf-leads-primary-text"
                        onClick={() => navigate(`/leads/${lead.id}`)}
                      >
                        {lead.name}
                      </button>
                      <div className="lf-table-sub lf-leads-secondary-text">
                        Cadastrado em{' '}
                        {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>

                    <td className="lf-leads-cell lf-leads-cell-contact">
                      <div className="lf-leads-primary-text lf-leads-ellipsis">
                        {lead.email || formatPhone(lead.phone) || '—'}
                      </div>
                      {lead.email && lead.phone && (
                        <div className="lf-table-sub lf-leads-secondary-text">
                          {formatPhone(lead.phone)}
                        </div>
                      )}
                    </td>

                    <td className="lf-leads-cell">
                      <span className="lf-leads-ellipsis" title={lead.branchName}>
                        {lead.branchName}
                      </span>
                    </td>

                    <td className="lf-leads-cell">
                      <span
                        className="lf-leads-ellipsis"
                        title={lead.responsibleUserName}
                      >
                        {lead.responsibleUserName}
                      </span>
                    </td>

                    <td className="lf-leads-cell">
                      <span className="lf-leads-ellipsis" title={originLabels[lead.origin]}>
                        {originLabels[lead.origin]}
                      </span>
                    </td>

                    <td className="lf-leads-cell lf-leads-stage-cell">
                      <Badge tone={stageBadge(lead.stage)}>
                        {stageLabels[lead.stage]}
                      </Badge>
                    </td>

                    <td className="lf-leads-cell lf-leads-score-cell">
                      <span className="lf-leads-score-axis lf-leads-score-value">
                        <strong>{fmtNumber(lead.score)}</strong>
                      </span>
                    </td>

                    <td
                      className="lf-leads-cell lf-leads-last-cell"
                      title={fmtDateTime(lead.lastInteractionAt)}
                    >
                      {relativeTime(lead.lastInteractionAt)}
                    </td>

                    <td className="lf-leads-actions-cell">
                      <LeadActionsMenu
                        lead={lead}
                        onView={() => navigate(`/leads/${lead.id}`)}
                        onEdit={() => openEdit(lead.id)}
                        onInteraction={() => setInteractionLead(lead.id)}
                        onTask={() => setTaskLead(lead.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lf-leads-pagination">
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onPage={(page) => setFilter('page', page)}
            />
          </div>

          <div className="lf-mobile-records">
            {data.content.map((lead) => (
              <Card key={lead.id}>
                <div className="lf-card-head">
                  <div>
                    <button
                      className="lf-table-link lf-plain-button"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      {lead.name}
                    </button>
                    <div className="lf-table-sub">
                      {lead.responsibleUserName} • {lead.branchName}
                    </div>
                  </div>
                  <Badge tone={stageBadge(lead.stage)}>
                    {stageLabels[lead.stage]}
                  </Badge>
                </div>

                <div className="lf-mobile-record-meta">
                  <span>
                    Pontuação <strong>{fmtNumber(lead.score)}</strong>
                  </span>
                  <span>{relativeTime(lead.lastInteractionAt)}</span>
                </div>

                <div className="lf-card-actions">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    Ver Lead
                  </Button>
                  <Button
                    size="sm"
                    variant="tertiary"
                    onClick={() => setInteractionLead(lead.id)}
                  >
                    Interação
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <LeadForm
        open={newOpen || !!edit}
        lead={edit}
        onClose={() => {
          setNewOpen(false);
          setEdit(null);
        }}
        onSaved={load}
      />

      <InteractionForm
        open={!!interactionLead}
        presetLeadId={interactionLead}
        onClose={() => setInteractionLead(undefined)}
        onSaved={load}
      />

      <TaskForm
        open={!!taskLead}
        presetLeadId={taskLead}
        onClose={() => setTaskLead(undefined)}
        onSaved={load}
      />
    </>
  );
}
