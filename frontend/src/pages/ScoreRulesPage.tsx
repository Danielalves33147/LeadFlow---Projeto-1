import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  Select,
  useToast,
} from '../components/ui';
import { ApiError, scoreRuleApi } from '../services/api';
import { interactionTypeLabels, operationLabels } from '../services/format';
import type {
  InteractionType,
  ScoreOperation,
  ScoreRuleResponse,
  ScoreRuleStatus,
} from '../types';
import '../styles/score-rules.css';

const interactionTypes = Object.keys(interactionTypeLabels) as InteractionType[];
const operations = ['ADD', 'SUBTRACT', 'SET'] as ScoreOperation[];
const PAGE_SIZE = 10;

type ActionMenuState = {
  ruleId: number;
  top: number;
  left: number;
};

export function ScoreRulesPage() {
  const toast = useToast();
  const [items, setItems] = useState<ScoreRuleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<ScoreRuleResponse | null>(null);
  const [page, setPage] = useState(0);
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: '',
    interactionType: 'FIRST_CONTACT' as InteractionType,
    operation: 'ADD' as ScoreOperation,
    value: 10,
    status: 'ACTIVE' as ScoreRuleStatus,
  });

  const load = () => {
    setLoading(true);
    setError('');

    scoreRuleApi
      .list()
      .then(setItems)
      .catch((cause) => setError((cause as ApiError).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (edit) {
      setForm({
        name: edit.name,
        interactionType: edit.interactionType,
        operation: edit.operation,
        value: edit.value,
        status: edit.status,
      });
      return;
    }

    if (open) {
      setForm({
        name: '',
        interactionType: 'FIRST_CONTACT',
        operation: 'ADD',
        value: 10,
        status: 'ACTIVE',
      });
    }
  }, [edit, open]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  useEffect(() => {
    if (page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!actionMenu) {
      return;
    }

    const closeMenu = (event: MouseEvent) => {
      const target = event.target as Node;

      if (actionMenuRef.current?.contains(target)) {
        return;
      }

      setActionMenu(null);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActionMenu(null);
      }
    };

    window.addEventListener('mousedown', closeMenu);
    window.addEventListener('keydown', closeOnEscape);
    const closeOnViewportChange = () => {
      setActionMenu(null);
    };

    window.addEventListener('resize', closeOnViewportChange);
    window.addEventListener('scroll', closeOnViewportChange, true);

    return () => {
      window.removeEventListener('mousedown', closeMenu);
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnViewportChange);
      window.removeEventListener('scroll', closeOnViewportChange, true);
    };
  }, [actionMenu]);

  const pageItems = useMemo(() => {
    const start = page * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  const save = async () => {
    try {
      if (edit) {
        await scoreRuleApi.update(edit.id, form);
      } else {
        await scoreRuleApi.create(form);
      }

      toast.push(
        'success',
        edit ? 'Regra atualizada' : 'Regra criada',
        form.name,
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
    }
  };

  const toggle = async (rule: ScoreRuleResponse) => {
    const nextStatus: ScoreRuleStatus =
      rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    if (
      nextStatus === 'INACTIVE' &&
      !confirm(
        `Desativar "${rule.name}"? Novas interações deixarão de aplicar esta regra; o histórico não será reprocessado.`,
      )
    ) {
      return;
    }

    try {
      await scoreRuleApi.status(rule.id, nextStatus);

      toast.push(
        'success',
        nextStatus === 'ACTIVE' ? 'Regra ativada' : 'Regra desativada',
        rule.name,
      );

      setActionMenu(null);
      load();
    } catch (cause) {
      toast.push(
        'error',
        'Não foi possível alterar',
        (cause as ApiError).message,
      );
    }
  };

  const openActionMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    ruleId: number,
  ) => {
    event.stopPropagation();

    if (actionMenu?.ruleId === ruleId) {
      setActionMenu(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 184;
    const viewportPadding = 12;
    const left = Math.min(
      window.innerWidth - menuWidth - viewportPadding,
      Math.max(viewportPadding, rect.right - menuWidth),
    );

    setActionMenu({
      ruleId,
      top: rect.bottom + 6,
      left,
    });
  };

  const activeMenuRule = actionMenu
    ? items.find((rule) => rule.id === actionMenu.ruleId) ?? null
    : null;

  const closeModal = () => {
    setOpen(false);
    setEdit(null);
  };

  return (
    <>
      <PageHeader
        title="Regras de Pontuação"
        description="Configure como cada tipo de interação altera a pontuação dos Leads."
        actions={<Button onClick={() => setOpen(true)}>+ Nova Regra</Button>}
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <LoadingPanel />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhuma regra criada"
            text="Crie regras para automatizar a pontuação das interações comerciais."
            action={<Button onClick={() => setOpen(true)}>Nova Regra</Button>}
          />
        </Card>
      ) : (
        <>
          <div className="lf-table-wrap lf-score-rules-table-wrap">
            <table className="lf-table lf-score-rules-table">
              <colgroup>
                <col className="lf-score-rule-col-name" />
                <col className="lf-score-rule-col-type" />
                <col className="lf-score-rule-col-operation" />
                <col className="lf-score-rule-col-value" />
                <col className="lf-score-rule-col-status" />
                <col className="lf-score-rule-col-updated" />
                <col className="lf-score-rule-col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th className="lf-score-text-column">Regra</th>
                  <th className="lf-score-text-column">Tipo de interação</th>
                  <th className="lf-score-center">Operação</th>
                  <th className="lf-score-center">Valor</th>
                  <th className="lf-score-center">Status</th>
                  <th className="lf-score-center">Última atualização</th>
                  <th className="lf-score-center">Ação</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((rule) => (
                  <tr key={rule.id}>
                    <td className="lf-score-rule-name lf-score-text-column">
                      <strong>{rule.name}</strong>
                    </td>
                    <td className="lf-score-text-column">
                      {interactionTypeLabels[rule.interactionType]}
                    </td>
                    <td className="lf-score-center">
                      <Badge
                        tone={
                          rule.operation === 'SUBTRACT'
                            ? 'danger'
                            : rule.operation === 'ADD'
                              ? 'success'
                              : 'info'
                        }
                      >
                        {operationLabels[rule.operation]}
                      </Badge>
                    </td>
                    <td className="lf-score-center lf-score-value">
                      {rule.value}
                    </td>
                    <td className="lf-score-center">
                      <Badge
                        tone={
                          rule.status === 'ACTIVE' ? 'success' : 'neutral'
                        }
                      >
                        {rule.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </td>
                    <td className="lf-score-center lf-score-updated">
                      {new Date(rule.updatedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="lf-score-actions-cell">
                      <button
                        type="button"
                        className="lf-score-more-button"
                        aria-label={`Ações da regra ${rule.name}`}
                        aria-haspopup="menu"
                        aria-expanded={actionMenu?.ruleId === rule.id}
                        onClick={(event) => openActionMenu(event, rule.id)}
                      >
                        •••
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.length > PAGE_SIZE && (
            <div className="lf-score-pagination" aria-label="Paginação das regras">
              <div className="lf-score-pagination-info">
                {items.length} regras
              </div>

              <div className="lf-score-pagination-controls">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Anterior
                </Button>

                <span>
                  Página {page + 1} de {totalPages}
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {actionMenu && activeMenuRule &&
        createPortal(
          <div
            ref={actionMenuRef}
            className="lf-score-actions-menu"
            role="menu"
            style={{
              top: actionMenu.top,
              left: actionMenu.left,
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setEdit(activeMenuRule);
                setActionMenu(null);
              }}
            >
              Editar
            </button>

            <button
              type="button"
              role="menuitem"
              className={
                activeMenuRule.status === 'ACTIVE'
                  ? 'lf-score-menu-danger'
                  : undefined
              }
              onClick={() => toggle(activeMenuRule)}
            >
              {activeMenuRule.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
            </button>
          </div>,
          document.body,
        )}

      <Modal
        open={open || !!edit}
        title={edit ? 'Editar regra' : 'Nova Regra'}
        description="Uma regra ativa por tipo evita pontuação ambígua."
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              onClick={save}
              disabled={form.name.trim().length < 2}
            >
              Salvar regra
            </Button>
          </>
        }
      >
        <div className="lf-form-grid">
          <Field label="Nome">
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Tipo de interação">
            <Select
              value={form.interactionType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  interactionType: event.target.value as InteractionType,
                }))
              }
            >
              {interactionTypes.map((type) => (
                <option key={type} value={type}>
                  {interactionTypeLabels[type]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Operação">
            <Select
              value={form.operation}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  operation: event.target.value as ScoreOperation,
                }))
              }
            >
              {operations.map((operation) => (
                <option key={operation} value={operation}>
                  {operationLabels[operation]}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Valor dos pontos"
            helper="Informe valor positivo; a operação define o sinal."
          >
            <Input
              type="number"
              min={0}
              step={1}
              value={form.value}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  value: Number(event.target.value),
                }))
              }
            />
          </Field>

          <Field label="Status">
            <Select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as ScoreRuleStatus,
                }))
              }
            >
              <option value="ACTIVE">Ativa</option>
              <option value="INACTIVE">Inativa</option>
            </Select>
          </Field>

          <Card className="span-2 lf-preview-card">
            <strong>Exemplo:</strong> uma interação de{' '}
            {interactionTypeLabels[form.interactionType]} irá{' '}
            {operationLabels[form.operation].toLowerCase()} {form.value}{' '}
            ponto(s)
            {form.status === 'INACTIVE'
              ? ' quando esta regra for ativada'
              : ''}
            .
          </Card>
        </div>
      </Modal>
    </>
  );
}
