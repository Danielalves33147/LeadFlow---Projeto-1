import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  branchApi,
  leadApi,
  taskApi,
  userApi,
  ApiError,
} from '../services/api';
import {
  channelLabels,
  fmtDate,
  fmtDateTime,
  fmtNumber,
  formatCep,
  formatPhone,
  interactionTypeLabels,
  originLabels,
  stageBadge,
  stageLabels,
  taskBadge,
  taskStatusLabels,
} from '../services/format';
import type {
  BranchSummary,
  HistoryResponse,
  InteractionResponse,
  LeadResponse,
  LeadStage,
  TaskResponse,
  UserResponse,
} from '../types';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  LoadingPanel,
  Modal,
  PageHeader,
  SearchableSelect,
  Select,
  useToast,
} from '../components/ui';
import { InteractionForm } from '../components/forms/InteractionForm';
import { LeadForm } from '../components/forms/LeadForm';
import { TaskForm } from '../components/forms/TaskForm';
import '../styles/lead-details.css';

const stages: LeadStage[] = [
  'NEW',
  'CONTACTED',
  'NEGOTIATION',
  'CUSTOMER',
  'LOST',
];

type DetailTab = 'activity' | 'tasks';

type TaskMenuState = {
  taskId: number;
  top: number;
  left: number;
} | null;

export function LeadDetailsPage() {
  const { leadId } = useParams();
  const id = Number(leadId);
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const tab: DetailTab = params.get('tab') === 'tasks' ? 'tasks' : 'activity';

  const [lead, setLead] = useState<LeadResponse | null>(null);
  const [history, setHistory] = useState<HistoryResponse[]>([]);
  const [interactions, setInteractions] = useState<InteractionResponse[]>([]);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [edit, setEdit] = useState(false);
  const [interaction, setInteraction] = useState(false);
  const [task, setTask] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null);

  const [stageModal, setStageModal] = useState(false);
  const [targetStage, setTargetStage] = useState<LeadStage>('NEW');

  const [reassign, setReassign] = useState(false);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [sellers, setSellers] = useState<UserResponse[]>([]);
  const [targetBranch, setTargetBranch] = useState('');
  const [targetSeller, setTargetSeller] = useState('');

  const [taskMenu, setTaskMenu] = useState<TaskMenuState>(null);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const currentLead = await leadApi.get(id);
      setLead(currentLead);

      const [leadHistory, leadInteractions, leadTasks] = await Promise.all([
        leadApi.history(id),
        leadApi.interactions(id),
        leadApi.tasks(id),
      ]);

      setHistory(leadHistory);
      setInteractions(leadInteractions);
      setTasks(leadTasks);
    } catch (cause) {
      setError((cause as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Number.isFinite(id)) {
      void load();
    }
  }, [id]);

  useEffect(() => {
    if (!reassign || !lead) {
      return;
    }

    setTargetBranch(String(lead.branchId));
    setTargetSeller(String(lead.responsibleUserId));

    branchApi
      .list()
      .then(setBranches)
      .catch(() => setBranches([]));
  }, [reassign, lead?.id]);

  useEffect(() => {
    if (!reassign || !targetBranch) {
      setSellers([]);
      return;
    }

    userApi
      .sellers(Number(targetBranch))
      .then(setSellers)
      .catch(() => setSellers([]));
  }, [reassign, targetBranch]);

  useEffect(() => {
    if (!taskMenu) {
      return;
    }

    const closeOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (
        !target.closest('.lf-detail-task-menu') &&
        !target.closest('.lf-detail-task-menu-trigger')
      ) {
        setTaskMenu(null);
      }
    };

    const closeOnViewportChange = () => setTaskMenu(null);

    document.addEventListener('mousedown', closeOutside);
    window.addEventListener('resize', closeOnViewportChange);
    window.addEventListener('scroll', closeOnViewportChange, true);

    return () => {
      document.removeEventListener('mousedown', closeOutside);
      window.removeEventListener('resize', closeOnViewportChange);
      window.removeEventListener('scroll', closeOnViewportChange, true);
    };
  }, [taskMenu]);

  const changeStage = async () => {
    if (!lead) {
      return;
    }

    try {
      const updated = await leadApi.stage(
        lead.id,
        targetStage,
        targetStage === 'LOST'
          ? 'Alterado manualmente no detalhe do Lead'
          : undefined,
      );

      setLead(updated);
      setStageModal(false);
      toast.push('success', 'Etapa atualizada', stageLabels[updated.stage]);
      await load();
    } catch (cause) {
      toast.push(
        'error',
        'Não foi possível alterar',
        (cause as ApiError).message,
      );
    }
  };

  const doReassign = async () => {
    if (!lead || !targetBranch || !targetSeller) {
      return;
    }

    try {
      const updated = await leadApi.reassign(
        lead.id,
        Number(targetBranch),
        Number(targetSeller),
      );

      setLead(updated);
      setReassign(false);
      toast.push(
        'success',
        'Lead reatribuído',
        `${updated.branchName} • ${updated.responsibleUserName}`,
      );
      await load();
    } catch (cause) {
      toast.push(
        'error',
        'Não foi possível reatribuir',
        (cause as ApiError).message,
      );
    }
  };

  const completeTask = async (selectedTask: TaskResponse) => {
    try {
      await taskApi.complete(selectedTask.id);
      setTaskMenu(null);
      toast.push('success', 'Tarefa concluída', selectedTask.title);
      await load();
    } catch (cause) {
      toast.push(
        'error',
        'Não foi possível concluir',
        (cause as ApiError).message,
      );
    }
  };

  const openTaskMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    taskId: number,
  ) => {
    if (taskMenu?.taskId === taskId) {
      setTaskMenu(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 190;

    setTaskMenu({
      taskId,
      top: rect.bottom + 6,
      left: Math.max(12, rect.right - menuWidth),
    });
  };

  if (loading) {
    return (
      <div className="lf-lead-details">
        <PageHeader title="Detalhes do Lead" />
        <LoadingPanel />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="lf-lead-details">
        <PageHeader title="Detalhes do Lead" />
        <Alert tone="error">{error || 'Lead não encontrado.'}</Alert>
      </div>
    );
  }

  const selectedTask = taskMenu
    ? tasks.find((item) => item.id === taskMenu.taskId)
    : undefined;

  return (
    <div className="lf-lead-details">
      <section className="lf-detail-header lf-detail-header-expanded">
        <div className="lf-breadcrumb">
          <Link to="/leads">Leads</Link> / {lead.name}
        </div>

        <div className="lf-detail-title-row">
          <div className="lf-detail-heading">
            <div className="lf-detail-name-row">
              <h1>{lead.name}</h1>
              <Badge tone={stageBadge(lead.stage)}>
                {stageLabels[lead.stage]}
              </Badge>
              <span className="lf-score-pill">
                {fmtNumber(lead.score)} pontos
              </span>
            </div>
          </div>

          <div className="lf-detail-actions">
            <Button onClick={() => setInteraction(true)}>
              Registrar interação
            </Button>
            <Button variant="secondary" onClick={() => setTask(true)}>
              Criar tarefa
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setTargetStage(lead.stage);
                setStageModal(true);
              }}
            >
              Alterar etapa
            </Button>
            <Button variant="secondary" onClick={() => setReassign(true)}>
              Reatribuir
            </Button>
            <Button variant="secondary" onClick={() => setEdit(true)}>
              Editar
            </Button>
          </div>
        </div>

        <div className="lf-detail-info-grid">
          <div className="lf-detail-info-item">
            <span>Filial</span>
            <strong>{lead.branchName}</strong>
          </div>
          <div className="lf-detail-info-item">
            <span>Responsável</span>
            <strong>{lead.responsibleUserName}</strong>
          </div>
          <div className="lf-detail-info-item">
            <span>Telefone</span>
            <strong>{formatPhone(lead.phone) || '—'}</strong>
          </div>
          <div className="lf-detail-info-item lf-detail-info-email">
            <span>E-mail</span>
            <strong>{lead.email || '—'}</strong>
          </div>
          <div className="lf-detail-info-item">
            <span>Origem</span>
            <strong>{originLabels[lead.origin]}</strong>
          </div>
          <div className="lf-detail-info-item">
            <span>CEP</span>
            <strong>{formatCep(lead.cep) || '—'}</strong>
          </div>
          <div className="lf-detail-info-item">
            <span>Cadastro</span>
            <strong>{fmtDate(lead.createdAt)}</strong>
          </div>
        </div>
      </section>

      <nav className="lf-detail-nav" aria-label="Seções do Lead">
        <button
          type="button"
          className={tab === 'activity' ? 'active' : ''}
          onClick={() => setParams({ tab: 'activity' })}
        >
          Atividade
        </button>
        <button
          type="button"
          className={tab === 'tasks' ? 'active' : ''}
          onClick={() => setParams({ tab: 'tasks' })}
        >
          Tarefas
        </button>
      </nav>

      {tab === 'activity' && (
        <div className="lf-detail-activity-grid">
          <Card className="lf-detail-activity-card">
            <div className="lf-card-header">
              <div>
                <h2 className="lf-card-title">Interações</h2>
                <p className="lf-card-subtitle">
                  Contatos comerciais registrados para este Lead.
                </p>
              </div>
              <Badge tone="neutral">{interactions.length}</Badge>
            </div>

            {interactions.length === 0 ? (
              <EmptyState
                title="Nenhuma interação registrada"
                text="Registre o primeiro contato comercial deste Lead."
                action={(
                  <Button onClick={() => setInteraction(true)}>
                    Registrar interação
                  </Button>
                )}
              />
            ) : (
              <div className="lf-timeline lf-detail-scroll-list">
                {interactions.map((item) => (
                  <div className="lf-timeline-item" key={item.id}>
                    <div className="lf-timeline-title">
                      {interactionTypeLabels[item.type]} •{' '}
                      {channelLabels[item.channel]}
                    </div>
                    <div className="lf-timeline-meta">
                      {item.responsibleUserName} • {fmtDateTime(item.createdAt)} •{' '}
                      {item.scoreApplied >= 0 ? '+' : ''}
                      {item.scoreApplied} pts
                    </div>
                    {item.notes && (
                      <div className="lf-timeline-desc">{item.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="lf-detail-activity-card">
            <div className="lf-card-header">
              <div>
                <h2 className="lf-card-title">Histórico</h2>
                <p className="lf-card-subtitle">
                  Mudanças de etapa, responsável e dados do Lead.
                </p>
              </div>
              <Badge tone="neutral">{history.length}</Badge>
            </div>

            {history.length === 0 ? (
              <EmptyState
                title="Nenhum histórico"
                text="As alterações rastreáveis serão registradas automaticamente."
              />
            ) : (
              <div className="lf-timeline lf-detail-scroll-list">
                {history.map((item) => (
                  <div className="lf-timeline-item" key={item.id}>
                    <div className="lf-timeline-title">
                      {item.description || item.eventType}
                    </div>
                    <div className="lf-timeline-meta">
                      {item.performedByName} • {fmtDateTime(item.createdAt)}
                    </div>
                    {(item.previousValue || item.newValue) && (
                      <div className="lf-timeline-desc">
                        {item.previousValue || ''}
                        {item.newValue ? ` → ${item.newValue}` : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'tasks' && (
        <Card>
          <div className="lf-card-header">
            <div>
              <h2 className="lf-card-title">Tarefas do Lead</h2>
              <p className="lf-card-subtitle">
                Acompanhe prazos e próximos passos comerciais.
              </p>
            </div>
            <Button onClick={() => setTask(true)}>+ Nova tarefa</Button>
          </div>

          {tasks.length === 0 ? (
            <EmptyState
              title="Nenhuma tarefa"
              text="Crie uma tarefa para organizar o próximo passo."
              action={(
                <Button onClick={() => setTask(true)}>Criar tarefa</Button>
              )}
            />
          ) : (
            <div className="lf-table-wrap lf-detail-tasks-table">
              <table className="lf-table">
                <thead>
                  <tr>
                    <th>Tarefa</th>
                    <th>Responsável</th>
                    <th>Prazo</th>
                    <th>Status</th>
                    <th className="lf-detail-task-actions-head">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title}</strong>
                        {item.description && (
                          <div className="lf-table-sub">{item.description}</div>
                        )}
                      </td>
                      <td>{item.responsibleUserName}</td>
                      <td>{fmtDateTime(item.dueAt)}</td>
                      <td>
                        <Badge tone={taskBadge(item.status)}>
                          {taskStatusLabels[item.status]}
                        </Badge>
                      </td>
                      <td className="lf-detail-task-actions-cell">
                        <button
                          type="button"
                          className="lf-detail-task-menu-trigger"
                          aria-label={`Opções da tarefa ${item.title}`}
                          aria-haspopup="menu"
                          aria-expanded={taskMenu?.taskId === item.id}
                          onClick={(event) => openTaskMenu(event, item.id)}
                        >
                          •••
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {taskMenu && selectedTask && createPortal(
        <div
          className="lf-detail-task-menu"
          role="menu"
          style={{ top: taskMenu.top, left: taskMenu.left }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setEditingTask(selectedTask);
              setTaskMenu(null);
            }}
          >
            Editar tarefa
          </button>

          {(selectedTask.status === 'PENDING' ||
            selectedTask.status === 'OVERDUE') && (
            <button
              type="button"
              role="menuitem"
              onClick={() => void completeTask(selectedTask)}
            >
              Concluir tarefa
            </button>
          )}
        </div>,
        document.body,
      )}

      <LeadForm
        open={edit}
        lead={lead}
        onClose={() => setEdit(false)}
        onSaved={(updated) => {
          setLead(updated);
          void load();
        }}
      />

      <InteractionForm
        open={interaction}
        presetLeadId={lead.id}
        onClose={() => setInteraction(false)}
        onSaved={() => void load()}
      />

      <TaskForm
        open={task}
        presetLeadId={lead.id}
        onClose={() => setTask(false)}
        onSaved={() => void load()}
      />

      <TaskForm
        open={editingTask !== null}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSaved={() => {
          setEditingTask(null);
          void load();
        }}
      />

      <Modal
        open={stageModal}
        title="Alterar etapa"
        description={`Etapa atual: ${stageLabels[lead.stage]}. A mudança será registrada no histórico.`}
        onClose={() => setStageModal(false)}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setStageModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void changeStage()}>Confirmar alteração</Button>
          </>
        )}
      >
        <Field label="Nova etapa">
          <Select
            value={targetStage}
            onChange={(event) => setTargetStage(event.target.value as LeadStage)}
          >
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stageLabels[stage]}
              </option>
            ))}
          </Select>
        </Field>

        {targetStage === 'LOST' && (
          <Alert tone="warning">
            Mover para Perdido encerra o avanço comercial atual deste Lead.
          </Alert>
        )}
      </Modal>

      <Modal
        open={reassign}
        title="Reatribuir Lead"
        description="Defina a filial e o responsável que receberão este Lead."
        onClose={() => setReassign(false)}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setReassign(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void doReassign()}
              disabled={!targetBranch || !targetSeller}
            >
              Reatribuir Lead
            </Button>
          </>
        )}
      >
        <div className="lf-detail-reassign-fields">
          <Field label="Filial">
            <SearchableSelect
              value={targetBranch}
              options={branches
                .filter((branch) => branch.active || branch.id === lead.branchId)
                .map((branch) => ({
                  value: String(branch.id),
                  label: branch.name,
                }))}
              placeholder="Selecione uma filial"
              searchPlaceholder="Pesquisar filial..."
              ariaLabel="Filial para reatribuição"
              onChange={(value) => {
                setTargetBranch(value);
                setTargetSeller('');
              }}
            />
          </Field>

          <Field label="Novo responsável">
            <SearchableSelect
              value={targetSeller}
              options={sellers.map((seller) => ({
                value: String(seller.id),
                label: seller.name,
              }))}
              placeholder="Selecione um vendedor autorizado"
              searchPlaceholder="Pesquisar responsável..."
              ariaLabel="Novo responsável pelo Lead"
              disabled={!targetBranch}
              onChange={setTargetSeller}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
