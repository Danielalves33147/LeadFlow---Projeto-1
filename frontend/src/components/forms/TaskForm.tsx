import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../app/AuthContext';
import { leadApi, taskApi, userApi, ApiError } from '../../services/api';
import type { LeadSummary, TaskResponse, UserResponse } from '../../types';
import {
  Button,
  Drawer,
  Field,
  Input,
  SearchableSelect,
  Textarea,
  useToast,
} from '../ui';

function localInput(iso?: string) {
  const date = iso ? new Date(iso) : new Date(Date.now() + 3600000);
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TaskForm({
  open,
  onClose,
  onSaved,
  presetLeadId,
  task,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (value: TaskResponse) => void;
  presetLeadId?: number;
  task?: TaskResponse | null;
}) {
  const toast = useToast();
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [sellers, setSellers] = useState<UserResponse[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    leadId: '',
    responsibleUserId: '',
    dueAt: localInput(),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    leadApi
      .list({ size: 100, sort: 'name,asc' })
      .then((page) => setLeads(page.content))
      .catch(() => setLeads([]));

    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? '',
        leadId: String(task.leadId),
        responsibleUserId: String(task.responsibleUserId),
        dueAt: localInput(task.dueAt),
      });
    } else {
      setForm({
        title: '',
        description: '',
        leadId: presetLeadId ? String(presetLeadId) : '',
        responsibleUserId: '',
        dueAt: localInput(),
      });
    }
  }, [open, presetLeadId, task]);

  useEffect(() => {
    const lead = leads.find((item) => item.id === Number(form.leadId));

    if (!lead) {
      setSellers([]);
      return;
    }

    if (user?.role === 'SELLER') {
      setSellers([]);
    } else {
      userApi
        .sellers(lead.branchId)
        .then(setSellers)
        .catch(() => setSellers([]));
    }

    if (!task && !form.responsibleUserId) {
      setForm((current) => ({
        ...current,
        responsibleUserId: String(lead.responsibleUserId),
      }));
    }
  }, [form.leadId, leads, task, user]);

  const leadOptions = useMemo(
    () =>
      leads.map((lead) => ({
        value: String(lead.id),
        label: `${lead.name} — ${lead.branchName}`,
      })),
    [leads],
  );

  const sellerOptions = useMemo(
    () => [
      { value: '', label: 'Responsável atual do Lead' },
      ...sellers.map((seller) => ({
        value: String(seller.id),
        label: seller.name,
      })),
    ],
    [sellers],
  );

  const set = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.leadId) {
      toast.push('error', 'Selecione um Lead', 'Escolha o Lead da tarefa.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        responsibleUserId: form.responsibleUserId
          ? Number(form.responsibleUserId)
          : null,
        dueAt: new Date(form.dueAt).toISOString(),
      };

      const saved = task
        ? await taskApi.update(task.id, payload)
        : await taskApi.create({
            ...payload,
            leadId: Number(form.leadId),
          });

      toast.push(
        'success',
        task ? 'Tarefa atualizada' : 'Tarefa criada com sucesso',
        saved.title,
      );
      onSaved(saved);
      onClose();
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

  return (
    <Drawer
      open={open}
      title={task ? 'Editar tarefa' : 'Nova tarefa'}
      description="Organize o próximo passo comercial e defina o responsável."
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="task-form"
            disabled={saving || !form.leadId}
          >
            {saving ? 'Salvando...' : 'Salvar tarefa'}
          </Button>
        </>
      )}
    >
      <form
        id="task-form"
        onSubmit={submit}
        style={{ display: 'grid', gap: 16 }}
      >
        <Field label="Título">
          <Input
            required
            maxLength={180}
            value={form.title}
            onChange={(event) => set('title', event.target.value)}
          />
        </Field>

        <Field label="Lead">
          <SearchableSelect
            value={form.leadId}
            options={leadOptions}
            placeholder="Selecione um Lead"
            searchPlaceholder="Pesquisar Lead..."
            ariaLabel="Lead da tarefa"
            disabled={Boolean(presetLeadId) || Boolean(task)}
            onChange={(value) => {
              set('leadId', value);
              set('responsibleUserId', '');
            }}
          />
        </Field>

        <Field label="Responsável">
          {user?.role === 'SELLER' ? (
            <Input value={user.name} readOnly />
          ) : (
            <SearchableSelect
              value={form.responsibleUserId}
              options={sellerOptions}
              placeholder="Responsável atual do Lead"
              searchPlaceholder="Pesquisar responsável..."
              ariaLabel="Responsável pela tarefa"
              disabled={!form.leadId}
              onChange={(value) => set('responsibleUserId', value)}
            />
          )}
        </Field>

        <Field label="Data e horário">
          <Input
            required
            type="datetime-local"
            value={form.dueAt}
            onChange={(event) => set('dueAt', event.target.value)}
          />
        </Field>

        <Field label="Observação">
          <Textarea
            maxLength={3000}
            rows={5}
            value={form.description}
            onChange={(event) => set('description', event.target.value)}
          />
        </Field>
      </form>
    </Drawer>
  );
}
