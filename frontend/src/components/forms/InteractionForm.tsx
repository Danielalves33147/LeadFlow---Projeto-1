import React, { useEffect, useState } from 'react';
import { interactionApi, leadApi, ApiError } from '../../services/api';
import {
  channelLabels,
  interactionTypeLabels,
  fmtNumber,
} from '../../services/format';
import type {
  InteractionChannel,
  InteractionResponse,
  InteractionType,
  LeadSummary,
  ScorePreviewResponse,
} from '../../types';
import {
  Button,
  Card,
  Drawer,
  Field,
  SearchableSelect,
  Select,
  Textarea,
  useToast,
} from '../ui';

const channels = Object.keys(channelLabels) as InteractionChannel[];
const types = Object.keys(interactionTypeLabels) as InteractionType[];

export function InteractionForm({
  open,
  onClose,
  onSaved,
  presetLeadId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (value: InteractionResponse) => void;
  presetLeadId?: number;
}) {
  const toast = useToast();
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [leadId, setLeadId] = useState('');
  const [channel, setChannel] = useState<InteractionChannel>('PHONE');
  const [type, setType] = useState<InteractionType>('FIRST_CONTACT');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<ScorePreviewResponse | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    leadApi
      .list({ size: 100, sort: 'name,asc' })
      .then((page) => setLeads(page.content))
      .catch(() => setLeads([]));

    setLeadId(presetLeadId ? String(presetLeadId) : '');
    setNotes('');
  }, [open, presetLeadId]);

  useEffect(() => {
    if (!open || !leadId) {
      setPreview(null);
      return;
    }

    interactionApi
      .preview(Number(leadId), type)
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [open, leadId, type]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const saved = await interactionApi.create({
        leadId: Number(leadId),
        channel,
        type,
        notes: notes.trim() || null,
      });

      toast.push(
        'success',
        'Interação registrada',
        `${saved.leadName}: ${saved.scoreApplied >= 0 ? '+' : ''}${saved.scoreApplied} ponto(s)`,
      );

      onSaved(saved);
      onClose();
    } catch (cause) {
      toast.push(
        'error',
        'Não foi possível registrar',
        (cause as ApiError).message,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      title="Registrar interação"
      description="Registre a atividade comercial e os detalhes do contato."
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="interaction-form"
            disabled={saving || !leadId}
          >
            {saving ? 'Registrando...' : 'Registrar interação'}
          </Button>
        </>
      )}
    >
      <form
        id="interaction-form"
        onSubmit={submit}
        style={{ display: 'grid', gap: 16 }}
      >
        <Field label="Lead">
          <SearchableSelect
            value={leadId}
            options={leads.map((lead) => ({
              value: String(lead.id),
              label: `${lead.name} — ${lead.branchName}`,
            }))}
            placeholder="Selecione um Lead"
            searchPlaceholder="Pesquisar Lead..."
            ariaLabel="Lead da interação"
            disabled={Boolean(presetLeadId)}
            onChange={setLeadId}
          />
        </Field>

        <div className="lf-form-grid">
          <Field label="Canal">
            <Select
              value={channel}
              onChange={(event) =>
                setChannel(event.target.value as InteractionChannel)
              }
            >
              {channels.map((item) => (
                <option key={item} value={item}>
                  {channelLabels[item]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tipo">
            <Select
              value={type}
              onChange={(event) =>
                setType(event.target.value as InteractionType)
              }
            >
              {types.map((item) => (
                <option key={item} value={item}>
                  {interactionTypeLabels[item]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Observação">
          <Textarea
            value={notes}
            maxLength={3000}
            rows={6}
            onChange={(event) => setNotes(event.target.value)}
          />
          <span className="lf-helper">{notes.length}/3000 caracteres</span>
        </Field>

        {preview && (
          <Card className="lf-preview-card">
            <div className="lf-card-title">Prévia da pontuação</div>
            <div className="lf-metric-grid">
              <div>
                <div className="lf-mini-label">Regra</div>
                <div className="lf-mini-value" style={{ fontSize: 13 }}>
                  {preview.ruleName ?? 'Nenhuma regra ativa'}
                </div>
              </div>
              <div>
                <div className="lf-mini-label">Pontuação atual</div>
                <div className="lf-mini-value">
                  {fmtNumber(preview.currentScore)}
                </div>
              </div>
              <div>
                <div className="lf-mini-label">Após registro</div>
                <div className="lf-mini-value">
                  {fmtNumber(preview.projectedScore)}
                </div>
              </div>
            </div>
            <div className="lf-helper" style={{ marginTop: 10 }}>
              Variação estimada: {preview.scoreDelta >= 0 ? '+' : ''}
              {preview.scoreDelta}
            </div>
          </Card>
        )}
      </form>
    </Drawer>
  );
}
