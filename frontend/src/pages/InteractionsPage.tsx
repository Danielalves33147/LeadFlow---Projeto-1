import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../app/AuthContext';
import { InteractionForm } from '../components/forms/InteractionForm';
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
import {
  branchApi,
  interactionApi,
  leadApi,
  userApi,
  ApiError,
} from '../services/api';
import {
  channelLabels,
  fmtDateTime,
  interactionTypeLabels,
  stageBadge,
  stageLabels,
} from '../services/format';
import type {
  BranchSummary,
  InteractionChannel,
  InteractionResponse,
  InteractionType,
  LeadSummary,
  PageResponse,
  UserResponse,
} from '../types';
import '../styles/interactions.css';

const channels = Object.keys(channelLabels) as InteractionChannel[];
const interactionTypes = Object.keys(interactionTypeLabels) as InteractionType[];
const INTERACTIONS_PAGE_SIZE = 10;

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

  const allOptions = useMemo<FilterOption[]>(
    () => [{ value: '', label: placeholder }, ...options],
    [options, placeholder],
  );
  const selectedOption = allOptions.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');

    if (!normalizedSearch) {
      return allOptions;
    }

    return allOptions.filter((option) =>
      option.label.toLocaleLowerCase('pt-BR').includes(normalizedSearch),
    );
  }, [allOptions, search]);

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

    const selectedIndex = allOptions.findIndex(
      (option) => option.value === value,
    );

    if (selectedIndex >= 0) {
      setActiveIndex(selectedIndex);
      return;
    }

    setActiveIndex(direction === 'last' ? Math.max(allOptions.length - 1, 0) : 0);
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
    <div ref={containerRef} className={`interactions-filter ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className={`interactions-filter-trigger ${open ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <svg
          className="interactions-filter-chevron"
          aria-hidden="true"
          viewBox="0 0 20 20"
        >
          <path
            d="M5.75 7.5 10 11.75 14.25 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="interactions-filter-menu">
          <div className="interactions-filter-search-wrap">
            <svg
              className="interactions-filter-search-icon"
              aria-hidden="true"
              viewBox="0 0 20 20"
            >
              <circle
                cx="8.5"
                cy="8.5"
                r="4.75"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="m12 12 4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <input
              ref={searchRef}
              type="search"
              className="interactions-filter-search"
              value={search}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <div
            ref={optionsRef}
            className="interactions-filter-options"
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
                  'interactions-filter-option',
                  option.value === value ? 'is-selected' : '',
                  index === activeIndex ? 'keyboard-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
              >
                <span>{option.label}</span>
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="interactions-filter-empty">Nenhuma opção encontrada.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function InteractionsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PageResponse<InteractionResponse>>({
    content: [],
    page: 0,
    size: INTERACTIONS_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({
    branchId: '',
    leadId: '',
    responsibleId: '',
    channel: '',
    type: '',
    page: 0,
    size: INTERACTIONS_PAGE_SIZE,
  });

  useEffect(() => {
    if (user?.role !== 'SELLER') {
      branchApi.list().then(setBranches).catch(() => {});
      userApi.list().then(setUsers).catch(() => {});
    } else {
      setBranches([]);
      setUsers([]);
    }

    leadApi
      .list({ size: 100, sort: 'name,asc' })
      .then((page) => setLeads(page.content))
      .catch(() => {});
  }, [user?.role]);

  const load = () => {
    setLoading(true);
    setError('');

    interactionApi
      .list({ ...filters, sort: 'createdAt,desc' })
      .then(setData)
      .catch((cause) => setError((cause as ApiError).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [
    filters.branchId,
    filters.leadId,
    filters.responsibleId,
    filters.channel,
    filters.type,
    filters.page,
  ]);

  const setFilter = (key: string, value: string | number) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? Number(value) : 0,
    }));
  };

  const branchOptions: FilterOption[] = branches.map((branch) => ({
    value: String(branch.id),
    label: branch.name,
  }));

  const leadOptions: FilterOption[] = leads.map((lead) => ({
    value: String(lead.id),
    label: lead.name,
  }));

  const responsibleOptions: FilterOption[] = users
    .filter((candidate) => candidate.role === 'SELLER')
    .map((candidate) => ({
      value: String(candidate.id),
      label: candidate.name,
    }));

  const channelOptions: FilterOption[] = channels.map((channel) => ({
    value: channel,
    label: channelLabels[channel],
  }));

  const typeOptions: FilterOption[] = interactionTypes.map((type) => ({
    value: type,
    label: interactionTypeLabels[type],
  }));

  const hasActiveFilters = Boolean(
    filters.branchId
      || filters.leadId
      || filters.responsibleId
      || filters.channel
      || filters.type,
  );

  const clearFilters = () => {
    setFilters((current) => ({
      ...current,
      branchId: '',
      leadId: '',
      responsibleId: '',
      channel: '',
      type: '',
      page: 0,
    }));
  };

  return (
    <>
      <PageHeader
        title="Interações"
        description="Consulte as atividades comerciais e os pontos aplicados em cada contato."
      />

      <div className="interactions-toolbar">
        <div className="interactions-toolbar-filters">
          {user?.role !== 'SELLER' && (
            <SearchableFilter
              className="interactions-filter-branch"
              value={filters.branchId}
              placeholder="Todas as filiais"
              searchPlaceholder="Pesquisar filial..."
              options={branchOptions}
              onChange={(value) => setFilter('branchId', value)}
            />
          )}

          <SearchableFilter
            className="interactions-filter-lead"
            value={filters.leadId}
            placeholder="Todos os Leads"
            searchPlaceholder="Pesquisar Lead..."
            options={leadOptions}
            onChange={(value) => setFilter('leadId', value)}
          />

          {user?.role !== 'SELLER' && (
            <SearchableFilter
              className="interactions-filter-responsible"
              value={filters.responsibleId}
              placeholder="Todos os responsáveis"
              searchPlaceholder="Pesquisar responsável..."
              options={responsibleOptions}
              onChange={(value) => setFilter('responsibleId', value)}
            />
          )}

          <SearchableFilter
            className="interactions-filter-channel"
            value={filters.channel}
            placeholder="Todos os canais"
            searchPlaceholder="Pesquisar canal..."
            options={channelOptions}
            onChange={(value) => setFilter('channel', value)}
          />

          <SearchableFilter
            className="interactions-filter-type"
            value={filters.type}
            placeholder="Todos os tipos"
            searchPlaceholder="Pesquisar tipo..."
            options={typeOptions}
            onChange={(value) => setFilter('type', value)}
          />
        </div>

        <div className="interactions-toolbar-actions">
          {hasActiveFilters && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={clearFilters}
            >
              Limpar filtros
            </Button>
          )}

          <Button
            className="interactions-new-button"
            onClick={() => setOpen(true)}
          >
            + Nova interação
          </Button>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <LoadingPanel />
      ) : data.content.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhuma interação encontrada"
            text="Registre uma interação ou ajuste os filtros atuais."
            action={(
              <Button onClick={() => setOpen(true)}>
                Nova interação
              </Button>
            )}
          />
        </Card>
      ) : (
        <>
          <div className="lf-table-wrap mobile-cards interactions-table-wrap">
            <table className="lf-table interactions-table">
              <colgroup>
                <col className="interactions-col-date" />
                <col className="interactions-col-lead" />
                <col className="interactions-col-branch" />
                <col className="interactions-col-responsible" />
                <col className="interactions-col-channel" />
                <col className="interactions-col-type" />
                <col className="interactions-col-score" />
                <col className="interactions-col-stage" />
              </colgroup>

              <thead>
                <tr>
                  <th>Data</th>
                  <th>Lead</th>
                  <th>Filial</th>
                  <th>Responsável</th>
                  <th>Canal</th>
                  <th>Tipo</th>
                  <th className="interactions-score-cell">Pontos</th>
                  <th>Etapa</th>
                </tr>
              </thead>

              <tbody>
                {data.content.map((interaction) => (
                  <tr key={interaction.id}>
                    <td>{fmtDateTime(interaction.createdAt)}</td>
                    <td>
                      <strong>{interaction.leadName}</strong>
                    </td>
                    <td>{interaction.branchName}</td>
                    <td>{interaction.responsibleUserName}</td>
                    <td>{channelLabels[interaction.channel]}</td>
                    <td>{interactionTypeLabels[interaction.type]}</td>
                    <td
                      className={`interactions-score-cell interactions-score-value ${
                        interaction.scoreApplied < 0
                          ? 'lf-danger-text'
                          : interaction.scoreApplied > 0
                            ? 'lf-success-text'
                            : ''
                      }`}
                      title={interaction.scoreRuleName ?? 'Sem regra'}
                    >
                      {interaction.scoreApplied >= 0 ? '+' : ''}
                      {interaction.scoreApplied}
                    </td>
                    <td>
                      <Badge tone={stageBadge(interaction.stage)}>
                        {stageLabels[interaction.stage]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onPage={(page) => setFilter('page', page)}
            />
          </div>

          <div className="lf-mobile-records">
            {data.content.map((interaction) => (
              <Card key={interaction.id}>
                <div className="lf-card-head">
                  <div>
                    <strong>{interaction.leadName}</strong>
                    <div className="lf-table-sub">
                      {fmtDateTime(interaction.createdAt)}
                    </div>
                  </div>

                  <strong
                    className={
                      interaction.scoreApplied < 0
                        ? 'lf-danger-text'
                        : 'lf-success-text'
                    }
                  >
                    {interaction.scoreApplied >= 0 ? '+' : ''}
                    {interaction.scoreApplied} pts
                  </strong>
                </div>

                <div className="lf-mobile-record-meta">
                  <span>
                    {channelLabels[interaction.channel]} •{' '}
                    {interactionTypeLabels[interaction.type]}
                  </span>
                  <Badge tone={stageBadge(interaction.stage)}>
                    {stageLabels[interaction.stage]}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <InteractionForm
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => load()}
      />
    </>
  );
}
