import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../app/AuthContext';
import { branchApi, leadApi, userApi, ApiError } from '../../services/api';
import { formatCep, formatPhone, originLabels } from '../../services/format';
import type {
  BranchSummary,
  LeadOrigin,
  LeadResponse,
  UserResponse,
} from '../../types';
import {
  Button,
  Drawer,
  Field,
  Input,
  SearchableSelect,
  Select,
  useToast,
} from '../ui';

const origins = Object.keys(originLabels) as LeadOrigin[];

export function LeadForm({
  open,
  onClose,
  onSaved,
  lead,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (lead: LeadResponse) => void;
  lead?: LeadResponse | null;
}) {
  const toast = useToast();
  const { user } = useAuth();
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [sellers, setSellers] = useState<UserResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    origin: 'WEBSITE' as LeadOrigin,
    cep: '',
    branchId: '',
    responsibleUserId: '',
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (user?.role !== 'SELLER') {
      branchApi.list().then(setBranches).catch(() => setBranches([]));
    } else {
      setBranches([]);
    }

    if (lead) {
      setForm({
        name: lead.name,
        phone: formatPhone(lead.phone),
        email: lead.email ?? '',
        origin: lead.origin,
        cep: formatCep(lead.cep),
        branchId: String(lead.branchId),
        responsibleUserId: String(lead.responsibleUserId),
      });
    } else {
      setForm({
        name: '',
        phone: '',
        email: '',
        origin: 'WEBSITE',
        cep: '',
        branchId:
          user?.role === 'SELLER' ? String(user.primaryBranchId ?? '') : '',
        responsibleUserId: '',
      });
    }
  }, [open, lead, user]);

  useEffect(() => {
    const branchId = Number(form.branchId);

    if (!branchId || user?.role === 'SELLER') {
      setSellers([]);
      return;
    }

    userApi.sellers(branchId).then(setSellers).catch(() => setSellers([]));
  }, [form.branchId, user]);

  const branchOptions = useMemo(
    () =>
      branches
        .filter((branch) => branch.active)
        .map((branch) => ({
          value: String(branch.id),
          label: branch.name,
        })),
    [branches],
  );

  const sellerOptions = useMemo(
    () => [
      { value: '', label: 'Definir automaticamente' },
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
    setErrors({});
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        origin: form.origin,
        cep: form.cep.trim() || null,
      };

      const saved = lead
        ? await leadApi.update(lead.id, payload)
        : await leadApi.create({
            ...payload,
            branchId: Number(form.branchId),
            responsibleUserId: form.responsibleUserId
              ? Number(form.responsibleUserId)
              : null,
          });

      toast.push(
        'success',
        lead ? 'Lead atualizado' : 'Lead criado com sucesso',
        saved.name,
      );
      onSaved(saved);
      onClose();
    } catch (cause) {
      const error = cause as ApiError;
      setErrors(error.fieldErrors);
      toast.push('error', 'Não foi possível salvar', error.message);
    } finally {
      setSaving(false);
    }
  };

  const missingRequiredBranch =
    !lead && user?.role !== 'SELLER' && !form.branchId;

  return (
    <Drawer
      open={open}
      title={lead ? 'Editar Lead' : 'Novo Lead'}
      description={
        lead
          ? 'Atualize as informações comerciais permitidas.'
          : 'Cadastre o Lead e defina sua filial e responsável.'
      }
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="lead-form"
            disabled={saving || missingRequiredBranch}
          >
            {saving ? 'Salvando...' : lead ? 'Salvar alterações' : 'Criar Lead'}
          </Button>
        </>
      )}
    >
      <form id="lead-form" onSubmit={submit} className="lf-form-grid">
        <div className="span-2">
          <Field label="Nome do Lead" error={errors.name}>
            <Input
              value={form.name}
              required
              minLength={2}
              maxLength={160}
              onChange={(event) => set('name', event.target.value)}
            />
          </Field>
        </div>

        <Field label="Telefone" error={errors.phone}>
          <Input
            value={form.phone}
            maxLength={15}
            inputMode="tel"
            placeholder="(00) 00000-0000"
            onChange={(event) => set('phone', formatPhone(event.target.value))}
          />
        </Field>

        <Field label="E-mail" error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => set('email', event.target.value)}
          />
        </Field>

        <Field label="Origem" error={errors.origin}>
          <Select
            value={form.origin}
            onChange={(event) => set('origin', event.target.value)}
          >
            {origins.map((origin) => (
              <option key={origin} value={origin}>
                {originLabels[origin]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="CEP" error={errors.cep}>
          <Input
            value={form.cep}
            maxLength={9}
            inputMode="numeric"
            placeholder="00000-000"
            onChange={(event) => set('cep', formatCep(event.target.value))}
          />
        </Field>

        {!lead &&
          (user?.role === 'SELLER' ? (
            <>
              <Field
                label="Filial"
                helper="O Lead será criado na sua filial operacional."
              >
                <Input
                  value={user.primaryBranchName ?? 'Filial não definida'}
                  readOnly
                />
              </Field>
              <Field
                label="Responsável"
                helper="O Lead será atribuído automaticamente a você."
              >
                <Input value={user.name} readOnly />
              </Field>
            </>
          ) : (
            <>
              <Field label="Filial" error={errors.branchId}>
                <SearchableSelect
                  value={form.branchId}
                  options={branchOptions}
                  placeholder="Selecione uma filial"
                  searchPlaceholder="Pesquisar filial..."
                  ariaLabel="Filial do Lead"
                  onChange={(value) => {
                    set('branchId', value);
                    set('responsibleUserId', '');
                  }}
                />
              </Field>

              <Field
                label="Responsável"
                error={errors.responsibleUserId}
                helper="Opcional; deve pertencer à filial selecionada."
              >
                <SearchableSelect
                  value={form.responsibleUserId}
                  options={sellerOptions}
                  placeholder="Definir automaticamente"
                  searchPlaceholder="Pesquisar responsável..."
                  ariaLabel="Responsável pelo Lead"
                  disabled={!form.branchId}
                  onChange={(value) => set('responsibleUserId', value)}
                />
              </Field>
            </>
          ))}
      </form>
    </Drawer>
  );
}
