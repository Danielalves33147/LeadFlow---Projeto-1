import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { branchApi, invitationApi, userApi, ApiError } from '../services/api';
import { roleLabels, userStatusLabels } from '../services/format';
import type {
  BranchSummary,
  PageResponse,
  UserResponse,
  UserRole,
  UserStatus,
} from '../types';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingPanel,
  Modal,
  PageHeader,
  Pagination,
  SearchableSelect as FormSearchableSelect,
  Select,
  useToast,
} from '../components/ui';
import { useAuth } from '../app/AuthContext';
import '../styles/team.css';

const roles: UserRole[] = ['ADMIN', 'MANAGER', 'SELLER'];
const PAGE_SIZE = 10;

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
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const allOptions = useMemo<SearchOption[]>(
    () => [{ value: '', label: placeholder }, ...options],
    [options, placeholder],
  );

  const selected = allOptions.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR');

    if (!normalized) {
      return allOptions;
    }

    return allOptions.filter((option) =>
      option.label.toLocaleLowerCase('pt-BR').includes(normalized),
    );
  }, [allOptions, search]);

  useEffect(() => {
    if (!open) {
      return;
    }

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
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
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

  const choose = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setSearch('');
    window.requestAnimationFrame(() => triggerRef.current?.focus());
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
        choose(option.value);
      }
    }
  };

  return (
    <div className="team-search-select" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`team-search-select-trigger ${open ? 'is-open' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{selected?.label ?? placeholder}</span>
        <svg
          className="team-select-chevron"
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
        <div className="team-search-select-menu">
          <div className="team-search-select-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Pesquisar..."
              aria-label={`Pesquisar em ${ariaLabel.toLowerCase()}`}
            />
          </div>

          <div ref={optionsRef} className="team-search-select-options" role="listbox">
            {filteredOptions.length === 0 ? (
              <div className="team-search-empty">Nenhuma opção encontrada.</div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  data-keyboard-active={index === activeIndex}
                  className={[
                    'team-search-option',
                    value === option.value ? 'is-selected' : '',
                    index === activeIndex ? 'keyboard-active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={`${option.value}-${option.label}`}
                  onMouseEnter={() => setActiveIndex(index)}
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

type MemberActionsProps = {
  member: UserResponse;
  onEdit: () => void;
  onToggle: () => void;
};

function MemberActions({ member, onEdit, onToggle }: MemberActionsProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const toggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (open) {
      setOpen(false);
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();

    if (rect) {
      setPosition({
        top: rect.bottom + 6,
        left: Math.max(12, rect.right - 184),
      });
    }

    setOpen(true);
  };

  const menu = open
    ? createPortal(
        <div
          className="team-member-menu"
          style={{ top: position.top, left: position.left }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Editar membro
          </button>
          <button
            type="button"
            className={member.status === 'ACTIVE' ? 'is-danger' : ''}
            onClick={() => {
              setOpen(false);
              onToggle();
            }}
          >
            {member.status === 'ACTIVE' ? 'Desativar membro' : 'Ativar membro'}
          </button>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="team-member-menu-trigger"
        aria-label={`Opções de ${member.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleMenu}
      >
        <span aria-hidden="true">•••</span>
      </button>
      {menu}
    </>
  );
}

export function TeamPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<PageResponse<UserResponse>>({
    content: [],
    page: 0,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [managers, setManagers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    branchId: '',
    role: '',
    status: '',
    page: 0,
    size: PAGE_SIZE,
  });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<UserResponse | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'SELLER' as UserRole,
    primaryBranchId: '',
    managerId: '',
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');

    (userApi.list({
      branchId: filters.branchId,
      role: filters.role,
      status: filters.status,
      page: filters.page,
      size: filters.size,
      sort: 'name,asc',
    }) as Promise<UserResponse[] | PageResponse<UserResponse>>)
      .then((response) => {
        if (Array.isArray(response)) {
          const start = filters.page * filters.size;
          setData({ content: response.slice(start, start + filters.size), page: filters.page, size: filters.size, totalElements: response.length, totalPages: Math.ceil(response.length / filters.size) });
          return;
        }
        setData(response);
      })
      .catch((cause) => setError((cause as ApiError).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    branchApi.list().then(setBranches).catch(() => {});

    if (user?.role === 'ADMIN') {
      userApi
        .list({ role: 'MANAGER', status: 'ACTIVE' })
        .then(setManagers)
        .catch(() => {});
    } else {
      setManagers([]);
    }
  }, [user?.role]);

  useEffect(load, [
    filters.branchId,
    filters.role,
    filters.status,
    filters.page,
    filters.size,
  ]);

  useEffect(() => {
    if (edit) {
      setForm({
        name: edit.name,
        email: edit.email,
        role: edit.role,
        primaryBranchId: String(edit.primaryBranchId ?? ''),
        managerId: String(edit.managerId ?? ''),
      });
      return;
    }

    if (open) {
      setForm({
        name: '',
        email: '',
        role: 'SELLER',
        primaryBranchId: '',
        managerId: '',
      });
    }
  }, [edit, open]);

  const setFilter = (key: 'branchId' | 'role' | 'status', value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: 0,
    }));
  };

  const setFormValue = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);

    try {
      const payload = {
        name: form.name,
        role: form.role,
        primaryBranchId: form.primaryBranchId
          ? Number(form.primaryBranchId)
          : null,
        managerId: form.managerId ? Number(form.managerId) : null,
        authorizedBranchIds:
          form.role === 'MANAGER' && form.primaryBranchId
            ? [Number(form.primaryBranchId)]
            : [],
      };

      if (edit) {
        await userApi.update(edit.id, payload);
      } else {
        await invitationApi.create({ ...payload, email: form.email });
      }

      toast.push(
        'success',
        edit ? 'Usuário atualizado' : 'Convite enviado',
        edit ? form.name : `${form.name} receberá um e-mail para ativar a própria conta.`,
      );

      setOpen(false);
      setEdit(null);
      load();
    } catch (cause) {
      toast.push(
        'error',
        'Não foi possível salvar',
        (cause as ApiError).message,
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (member: UserResponse) => {
    const next: UserStatus =
      member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    if (next === 'INACTIVE') {
      try {
        const impact = await userApi.impact(member.id);

        if (impact.activeLeads || impact.pendingTasks) {
          toast.push(
            'error',
            'Não é possível desativar agora',
            `${member.name} possui ${impact.activeLeads} Lead(s) ativo(s) e ${impact.pendingTasks} tarefa(s) pendente(s). Redistribua essas responsabilidades antes de desativar.`,
          );
          return;
        }
      } catch {
        // A alteração de status abaixo ainda fará a validação no backend.
      }
    }

    try {
      await userApi.status(member.id, next);
      toast.push(
        'success',
        next === 'ACTIVE' ? 'Usuário ativado' : 'Usuário desativado',
        member.name,
      );
      load();
    } catch (cause) {
      toast.push(
        'error',
        'Não foi possível alterar status',
        (cause as ApiError).message,
      );
    }
  };

  const branchOptions = branches.map((branch) => ({
    value: String(branch.id),
    label: branch.name,
  }));

  const roleOptions = roles
    .filter((role) => user?.role === 'ADMIN' || role === 'SELLER')
    .map((role) => ({
      value: role,
      label: roleLabels[role],
    }));

  const statusOptions: SearchOption[] = [
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'INACTIVE', label: 'Inativo' },
  ];

  const hasActiveFilters = Boolean(
    filters.branchId || filters.role || filters.status,
  );

  const clearFilters = () => {
    setFilters((current) => ({
      ...current,
      branchId: '',
      role: '',
      status: '',
      page: 0,
    }));
  };

  return (
    <>
      <PageHeader
        title="Equipe"
        description="Gerencie perfis, vínculos com filiais e disponibilidade operacional."
      />

      <div className="team-filter-navbar">
        <div className="team-filter-group">
          <SearchableSelect
            ariaLabel="Filtrar por filial"
            value={filters.branchId}
            placeholder="Todas as filiais"
            options={branchOptions}
            onChange={(value) => setFilter('branchId', value)}
          />

          <SearchableSelect
            ariaLabel="Filtrar por perfil"
            value={filters.role}
            placeholder="Todos os perfis"
            options={roleOptions}
            onChange={(value) => setFilter('role', value)}
          />

          <SearchableSelect
            ariaLabel="Filtrar por status"
            value={filters.status}
            placeholder="Todos os status"
            options={statusOptions}
            onChange={(value) => setFilter('status', value)}
          />
        </div>

        <div className="team-filter-actions">
          {hasActiveFilters && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={clearFilters}
            >
              Limpar filtros
            </Button>
          )}

          <Button onClick={() => setOpen(true)}>+ Convidar usuário</Button>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <LoadingPanel />
      ) : data.content.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhum usuário encontrado"
            text="Ajuste os filtros ou crie um novo usuário."
            action={<Button onClick={() => setOpen(true)}>Convidar usuário</Button>}
          />
        </Card>
      ) : (
        <>
          <div className="team-table-shell mobile-cards">
            <div className="lf-table-wrap">
              <table className="lf-table team-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>E-mail</th>
                    <th>Perfil</th>
                    <th>Filial</th>
                    <th>Gerente</th>
                    <th className="team-active-leads-column">Leads ativos</th>
                    <th>Status</th>
                    <th className="team-options-column">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="lf-user-cell team-user-cell">
                          <span className="lf-avatar">
                            {member.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <strong>{member.name}</strong>
                            <div className="lf-table-sub">
                              Desde{' '}
                              {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{member.email}</td>
                      <td>
                        <Badge tone="neutral">{roleLabels[member.role]}</Badge>
                      </td>
                      <td>{member.primaryBranchName || '—'}</td>
                      <td>{member.managerName || '—'}</td>
                      <td className="team-active-leads-column">
                        <strong>{member.activeLeads}</strong>
                      </td>
                      <td>
                        <Badge
                          tone={member.status === 'ACTIVE' ? 'success' : 'neutral'}
                        >
                          {userStatusLabels[member.status]}
                        </Badge>
                      </td>
                      <td className="team-options-column">
                        <MemberActions
                          member={member}
                          onEdit={() => setEdit(member)}
                          onToggle={() => toggleStatus(member)}
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
              onPage={(page) =>
                setFilters((current) => ({ ...current, page }))
              }
            />
          </div>

          <div className="lf-mobile-records team-mobile-records">
            {data.content.map((member) => (
              <Card key={member.id}>
                <div className="lf-card-head">
                  <div>
                    <strong>{member.name}</strong>
                    <div className="lf-table-sub">{member.email}</div>
                  </div>
                  <MemberActions
                    member={member}
                    onEdit={() => setEdit(member)}
                    onToggle={() => toggleStatus(member)}
                  />
                </div>

                <div className="lf-mobile-record-meta">
                  <span>{roleLabels[member.role]}</span>
                  <span>{member.primaryBranchName || 'Sem filial principal'}</span>
                  <span>Leads ativos: {member.activeLeads}</span>
                </div>

                <Badge tone={member.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {userStatusLabels[member.status]}
                </Badge>
              </Card>
            ))}

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onPage={(page) =>
                setFilters((current) => ({ ...current, page }))
              }
            />
          </div>
        </>
      )}

      <Modal
        open={open || !!edit}
        title={edit ? 'Editar usuário' : 'Convidar usuário'}
        description={edit ? 'Atualize o perfil e os vínculos operacionais do usuário.' : 'Defina o perfil e os vínculos. O convidado receberá um e-mail para criar a própria senha.'}
        onClose={() => {
          setOpen(false);
          setEdit(null);
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setEdit(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? (edit ? 'Salvando...' : 'Enviando convite...') : (edit ? 'Salvar usuário' : 'Enviar convite')}
            </Button>
          </>
        }
        size="md"
      >
        <div className="lf-form-grid">
          <Field label="Nome">
            <Input
              required
              value={form.name}
              onChange={(event) => setFormValue('name', event.target.value)}
            />
          </Field>

          <Field label="E-mail">
            <Input
              type="email"
              disabled={!!edit}
              value={form.email}
              onChange={(event) => setFormValue('email', event.target.value)}
            />
          </Field>

          <Field label="Perfil">
            <Select
              value={form.role}
              onChange={(event) => setFormValue('role', event.target.value)}
            >
              {roles
                .filter((role) => user?.role === 'ADMIN' || role === 'SELLER')
                .map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="Filial principal">
            <FormSearchableSelect
              value={form.primaryBranchId}
              options={[
                { value: '', label: 'Nenhuma' },
                ...branches.map((branch) => ({
                  value: String(branch.id),
                  label: branch.name,
                })),
              ]}
              placeholder="Nenhuma"
              searchPlaceholder="Pesquisar filial..."
              ariaLabel="Filial principal do usuário"
              onChange={(value) => setFormValue('primaryBranchId', value)}
            />
          </Field>

          <Field label="Gerente">
            <FormSearchableSelect
              value={form.managerId}
              options={[
                { value: '', label: 'Nenhum' },
                ...managers.map((manager) => ({
                  value: String(manager.id),
                  label: manager.name,
                })),
              ]}
              placeholder="Nenhum"
              searchPlaceholder="Pesquisar gerente..."
              ariaLabel="Gerente do usuário"
              onChange={(value) => setFormValue('managerId', value)}
            />
          </Field>

        </div>
      </Modal>
    </>
  );
}
