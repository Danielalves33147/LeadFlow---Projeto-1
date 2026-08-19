import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { BarList, DonutChart, LineChart } from '../components/charts';
import { Alert, Button, Card, LoadingPanel, PageHeader } from '../components/ui';
import { branchApi, ApiError } from '../services/api';
import { fmtNumber, fmtPercent } from '../services/format';
import type { BranchDetails } from '../types';
import { getDefaultPeriodDays } from '../services/preferences';
import '../styles/branch-details.css';

const MAX_TEAM_RANKING = 10;

const decimalFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function BranchDetailsPage() {
  const { branchId } = useParams();
  const id = Number(branchId);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<BranchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(() => getDefaultPeriodDays());

  const load = () => {
    setLoading(true);
    setError('');

    const period = {
      from: new Date(Date.now() - days * 86400000).toISOString(),
      to: new Date().toISOString(),
    };

    branchApi
      .get(id, period)
      .then(setData)
      .catch((cause) => setError((cause as ApiError).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id, days]);

  const teamRanking = useMemo(
    () => data?.teamRanking.slice(0, MAX_TEAM_RANKING) ?? [],
    [data],
  );

  if (loading) {
    return (
      <div className="lf-branch-detail-page">
        <PageHeader title="Detalhes da Filial" />
        <LoadingPanel />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="lf-branch-detail-page">
        <PageHeader title="Detalhes da Filial" />
        <Alert tone="error">{error || 'Filial não encontrada.'}</Alert>
      </div>
    );
  }

  const interactionsPerLead = data.activeLeads > 0
    ? data.interactions / data.activeLeads
    : 0;

  const pointsPerInteraction = data.interactions > 0
    ? data.points / data.interactions
    : 0;

  const pointsPerLead = data.activeLeads > 0
    ? data.points / data.activeLeads
    : 0;

  const newLeadShare = data.activeLeads > 0
    ? (data.newLeads / data.activeLeads) * 100
    : 0;

  const breadcrumb = user?.role === 'ADMIN'
    ? (
      <>
        <Link to="/ranking-filiais">Filiais</Link> / {data.name}
      </>
    )
    : <>Minha filial / {data.name}</>;

  return (
    <div className="lf-branch-detail-page">
      <PageHeader
        title={data.name}
        breadcrumb={breadcrumb}
        description="Resultados comerciais e desempenho da equipe no período selecionado."
        actions={
          <>
            <select
              className="lf-select lf-period-select"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              <option value={7}>7 dias</option>
              <option value={30}>30 dias</option>
              <option value={90}>90 dias</option>
              <option value={180}>180 dias</option>
              <option value={365}>365 dias</option>
            </select>

            {user?.role === 'ADMIN' && (
              <Button
                variant="secondary"
                onClick={() => navigate('/ranking-filiais')}
              >
                ← Voltar
              </Button>
            )}
          </>
        }
      />

      <div className="lf-branch-detail-layout">
        <aside className="lf-branch-team-column" aria-label="Ranking da equipe">
          <div className="lf-branch-column-heading">
            <h2>Ranking da equipe</h2>
            <p>Até 10 vendedores com melhor desempenho.</p>
          </div>

          <div className="lf-branch-team-stack">
            {teamRanking.length === 0 ? (
              <Card className="lf-branch-team-empty">
                Nenhum vendedor com dados no período.
              </Card>
            ) : (
              teamRanking.map((seller, index) => (
                <Card
                  className={`lf-branch-team-card ${index === 0 ? 'is-first' : ''}`}
                  key={seller.userId}
                >
                  <div className="lf-branch-team-position">#{index + 1}</div>
                  <div className="lf-branch-team-info">
                    <strong>{seller.name}</strong>
                    <span>
                      {fmtNumber(seller.leads)} Leads • {fmtNumber(seller.interactions)} interações
                    </span>
                  </div>
                  <div className="lf-branch-team-points">
                    <strong>{fmtNumber(seller.points)}</strong>
                    <span>pts</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </aside>

        <main className="lf-branch-analytics-grid">
          <Card className="lf-branch-analytic-card">
            <h2 className="lf-card-title">Evolução de pontos</h2>
            <div className="lf-branch-chart-slot">
              <LineChart
                data={data.pointsEvolution.map((point) => ({
                  label: point.label,
                  value: point.value,
                }))}
                series={[{ key: 'value', label: 'Pontos' }]}
              />
            </div>
          </Card>

          <Card className="lf-branch-analytic-card">
            <h2 className="lf-card-title">Conversões por período</h2>
            <div className="lf-branch-chart-slot">
              <LineChart
                data={data.conversionsEvolution.map((point) => ({
                  label: point.label,
                  value: point.value,
                }))}
                series={[{ key: 'value', label: 'Conversões' }]}
              />
            </div>
          </Card>

          <Card className="lf-branch-analytic-card">
            <h2 className="lf-card-title">Leads por etapa</h2>
            <div className="lf-branch-chart-slot lf-branch-donut-slot">
              <DonutChart
                data={data.stageDistribution.map((item) => ({
                  label: item.stage,
                  value: item.value,
                }))}
              />
            </div>
          </Card>

          <Card className="lf-branch-analytic-card">
            <h2 className="lf-card-title">Origem dos Leads</h2>
            <div className="lf-branch-chart-slot lf-branch-bars-slot">
              <BarList
                data={data.originDistribution.map((item) => ({
                  label: item.origin,
                  value: item.value,
                }))}
              />
            </div>
          </Card>
        </main>

        <aside className="lf-branch-kpi-column" aria-label="Indicadores da filial">
          <Card className="lf-branch-kpi-card">
            <div className="lf-branch-kpi-primary">
              <span className="lf-branch-kpi-label">Leads ativos</span>
              <strong>{fmtNumber(data.activeLeads)}</strong>
              <small>Base comercial ativa</small>
            </div>
            <div className="lf-branch-kpi-details">
              <div>
                <span>Novos no período</span>
                <strong>{fmtNumber(data.newLeads)}</strong>
              </div>
              <div>
                <span>Interações / Lead</span>
                <strong>{decimalFormatter.format(interactionsPerLead)}</strong>
              </div>
            </div>
          </Card>

          <Card className="lf-branch-kpi-card">
            <div className="lf-branch-kpi-primary">
              <span className="lf-branch-kpi-label">Novos Leads</span>
              <strong>{fmtNumber(data.newLeads)}</strong>
              <small>{decimalFormatter.format(newLeadShare)}% da base ativa</small>
            </div>
            <div className="lf-branch-kpi-details">
              <div>
                <span>Base ativa</span>
                <strong>{fmtNumber(data.activeLeads)}</strong>
              </div>
              <div>
                <span>Conversões</span>
                <strong>{fmtNumber(data.conversions)}</strong>
              </div>
            </div>
          </Card>

          <Card className="lf-branch-kpi-card">
            <div className="lf-branch-kpi-primary">
              <span className="lf-branch-kpi-label">Interações</span>
              <strong>{fmtNumber(data.interactions)}</strong>
              <small>{decimalFormatter.format(interactionsPerLead)} por Lead ativo</small>
            </div>
            <div className="lf-branch-kpi-details">
              <div>
                <span>Pontos / interação</span>
                <strong>{decimalFormatter.format(pointsPerInteraction)}</strong>
              </div>
              <div>
                <span>Pontos totais</span>
                <strong>{fmtNumber(data.points)}</strong>
              </div>
            </div>
          </Card>

          <Card className="lf-branch-kpi-card">
            <div className="lf-branch-kpi-primary">
              <span className="lf-branch-kpi-label">Pontos gerados</span>
              <strong>{fmtNumber(data.points)}</strong>
              <small>{decimalFormatter.format(pointsPerInteraction)} pts por interação</small>
            </div>
            <div className="lf-branch-kpi-details">
              <div>
                <span>Pontos / Lead</span>
                <strong>{decimalFormatter.format(pointsPerLead)}</strong>
              </div>
              <div>
                <span>Interações</span>
                <strong>{fmtNumber(data.interactions)}</strong>
              </div>
            </div>
          </Card>

          <Card className="lf-branch-kpi-card">
            <div className="lf-branch-kpi-primary">
              <span className="lf-branch-kpi-label">Conversões</span>
              <strong>{fmtNumber(data.conversions)}</strong>
              <small>{fmtPercent(data.conversionRate)} no período</small>
            </div>
            <div className="lf-branch-kpi-details">
              <div>
                <span>Novos Leads</span>
                <strong>{fmtNumber(data.newLeads)}</strong>
              </div>
              <div>
                <span>Leads ativos</span>
                <strong>{fmtNumber(data.activeLeads)}</strong>
              </div>
            </div>
          </Card>

          <Card className="lf-branch-kpi-card">
            <div className="lf-branch-kpi-primary">
              <span className="lf-branch-kpi-label">Taxa de conversão</span>
              <strong>{fmtPercent(data.conversionRate)}</strong>
              <small>{fmtNumber(data.conversions)} conversões concluídas</small>
            </div>
            <div className="lf-branch-kpi-details">
              <div>
                <span>Conversões</span>
                <strong>{fmtNumber(data.conversions)}</strong>
              </div>
              <div>
                <span>Novos Leads</span>
                <strong>{fmtNumber(data.newLeads)}</strong>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
