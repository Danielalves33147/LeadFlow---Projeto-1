import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, ApiError } from '../services/api';
import { fmtDateTime, fmtNumber, fmtPercent, stageLabels } from '../services/format';
import type { DashboardResponse, LeadResponse } from '../types';
import { DonutChart, LineChart } from '../components/charts';
import { Alert, Badge, Button, Card, KpiCard, LoadingPanel, PageHeader } from '../components/ui';
import { LeadForm } from '../components/forms/LeadForm';
import { getDefaultPeriodDays } from '../services/preferences';

export function DashboardPage() {
  const nav = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(() => getDefaultPeriodDays());
  const [newLead, setNewLead] = useState(false);

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - (days - 1));

    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }, [days]);

  const load = () => {
    setLoading(true);
    setError('');
    dashboardApi.get(range)
      .then(setData)
      .catch(e => setError((e as ApiError).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [days]);

  const evolution = data?.commercialEvolution.map(x => ({ label: x.label, value: x.points })) ?? [];
  const stages = data?.stageDistribution.map(s => ({ label: stageLabels[s.stage], value: s.value, tone: s.stage })) ?? [];

  const executive = useMemo(() => {
    if (!data) return null;

    const averageConversion = data.branchRanking.length
      ? data.branchRanking.reduce((total, item) => total + item.conversionRate, 0) / data.branchRanking.length
      : 0;

    const pointsPerInteraction = data.interactions.value > 0
      ? data.generatedPoints.value / data.interactions.value
      : 0;

    const leadsInProgress = data.stageDistribution
      .filter(item => item.stage !== 'CUSTOMER' && item.stage !== 'LOST')
      .reduce((total, item) => total + item.value, 0);

    const topBranch = data.branchRanking[0];

    return {
      averageConversion,
      pointsPerInteraction,
      leadsInProgress,
      topBranch
    };
  }, [data]);

  return (
    <>
      <div className="lf-dashboard-page">
        <PageHeader
          title="Visão Geral"
          description="Acompanhe atividade, desempenho e evolução comercial no período selecionado."
          actions={
            <>
              <select className="lf-select lf-period-select" value={days} onChange={e => setDays(Number(e.target.value))}>
                <option value={7}>Últimos 7 dias</option>
                <option value={30}>Últimos 30 dias</option>
                <option value={90}>Últimos 90 dias</option>
                <option value={180}>Últimos 180 dias</option>
                <option value={365}>Últimos 365 dias</option>
              </select>
              <Button onClick={() => setNewLead(true)}>+ Novo Lead</Button>
            </>
          }
        />

        {error && <Alert tone="error">{error} <button className="lf-link" onClick={load}>Tentar novamente</button></Alert>}

        {loading ? (
          <div className="lf-grid-2"><LoadingPanel /><LoadingPanel /></div>
        ) : data && executive && (
          <div className="lf-dashboard-stack">
            <section className="lf-dashboard-overview" aria-label="Resumo comercial">
              <div className="lf-kpi-grid lf-kpi-grid-compact">
                <KpiCard label="Leads ativos no período" {...data.activeLeads} />
                <KpiCard label="Novos Leads" {...data.newLeads} />
                <KpiCard label="Interações" {...data.interactions} />
                <KpiCard label="Pontos gerados" {...data.generatedPoints} />
              </div>

              <Card className="lf-dashboard-evolution">
                <div className="lf-card-head">
                  <div>
                    <h2 className="lf-card-title">Evolução comercial</h2>
                    <p className="lf-card-subtitle">Pontos gerados ao longo do período</p>
                  </div>
                </div>
                <LineChart data={evolution} series={[{ key: 'value', label: 'Pontos' }]} />
              </Card>

              <Card className="lf-dashboard-stage">
                <div className="lf-card-head">
                  <div>
                    <h2 className="lf-card-title">Leads por etapa</h2>
                    <p className="lf-card-subtitle">Distribuição no período selecionado</p>
                  </div>
                </div>
                <DonutChart data={stages} />
              </Card>
            </section>

            <section className="lf-dashboard-middle" aria-label="Ranking e Leads recentes">
              <Card className="lf-dashboard-ranking">
                <div className="lf-card-head">
                  <div>
                    <h2 className="lf-card-title">Ranking resumido</h2>
                    <p className="lf-card-subtitle">Top 5 filiais por pontuação</p>
                  </div>
                  <Button variant="tertiary" size="sm" onClick={() => nav('/ranking-filiais', { state: { from: '/dashboard' } })}>
                    Ver ranking completo
                  </Button>
                </div>

                <div className="lf-ranking-list">
                  {data.branchRanking.length === 0 ? (
                    <div className="lf-empty-text">Sem dados no período.</div>
                  ) : data.branchRanking.slice(0, 5).map((r, i) => (
                    <button className="lf-ranking-row" key={r.branchId} onClick={() => nav(`/filiais/${r.branchId}`)}>
                      <span className="lf-ranking-num">{i + 1}</span>
                      <span className="lf-ranking-name">{r.branchName}</span>
                      <span className="lf-ranking-metric">
                        <strong>{fmtNumber(r.points)}</strong>
                        <small>{fmtPercent(r.conversionRate)} conversão</small>
                      </span>
                      <span className={r.trend >= 0 ? 'lf-trend-up' : 'lf-trend-down'}>
                        {r.trend >= 0 ? '↑' : '↓'} {Math.abs(r.trend).toFixed(1)}%
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="lf-dashboard-recent">
                <div className="lf-card-head">
                  <div>
                    <h2 className="lf-card-title">Leads recentes</h2>
                    <p className="lf-card-subtitle">Cadastros mais recentes dentro do período selecionado</p>
                  </div>
                  <Button variant="tertiary" size="sm" onClick={() => nav('/leads')}>Ver todos os Leads</Button>
                </div>

                {data.recentLeads.length === 0 ? (
                  <div className="lf-empty-text">Nenhum Lead no período.</div>
                ) : (
                  <div className="lf-compact-list lf-compact-list-grid">
                    {data.recentLeads.slice(0, 8).map(l => (
                      <button key={l.id} onClick={() => nav(`/leads/${l.id}`)}>
                        <div>
                          <strong>{l.name}</strong>
                          <span>{l.branchName} • {l.responsibleUserName}</span>
                        </div>
                        <div>
                          <Badge tone={l.stage === 'CUSTOMER' ? 'success' : l.stage === 'LOST' ? 'danger' : l.stage === 'NEGOTIATION' ? 'warning' : 'primary'}>
                            {stageLabels[l.stage]}
                          </Badge>
                          <small>{fmtDateTime(l.lastInteractionAt)}</small>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </section>

            <section className="lf-dashboard-footer" aria-label="Indicadores e ações rápidas">
              <Card className="lf-dashboard-executive">
                <div className="lf-card-head">
                  <div>
                    <h2 className="lf-card-title">Resumo executivo</h2>
                    <p className="lf-card-subtitle">Indicadores calculados a partir do período atual</p>
                  </div>
                </div>

                <div className="lf-executive-metrics">
                  <div className="lf-executive-metric">
                    <span>Melhor filial</span>
                    <strong>{executive.topBranch?.branchName ?? '—'}</strong>
                    <small>{executive.topBranch ? `${fmtNumber(executive.topBranch.points)} pontos` : 'Sem dados no período'}</small>
                  </div>
                  <div className="lf-executive-metric">
                    <span>Conversão média</span>
                    <strong>{fmtPercent(executive.averageConversion)}</strong>
                    <small>entre as filiais ranqueadas</small>
                  </div>
                  <div className="lf-executive-metric">
                    <span>Pontos por interação</span>
                    <strong>{executive.pointsPerInteraction.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</strong>
                    <small>eficiência média de pontuação</small>
                  </div>
                  <div className="lf-executive-metric">
                    <span>Leads em andamento</span>
                    <strong>{fmtNumber(executive.leadsInProgress)}</strong>
                    <small>Novo, Em Contato ou Negociação</small>
                  </div>
                </div>
              </Card>

              <Card className="lf-dashboard-actions-card">
                <div className="lf-card-head">
                  <div>
                    <h2 className="lf-card-title">Ações rápidas</h2>
                    <p className="lf-card-subtitle">Acesse as rotinas comerciais mais usadas</p>
                  </div>
                </div>
                <div className="lf-dashboard-quick-actions">
                  <button onClick={() => setNewLead(true)}><strong>+ Novo Lead</strong><span>Cadastrar oportunidade</span></button>
                  <button onClick={() => nav('/interacoes')}><strong>Registrar interação</strong><span>Atualizar contato comercial</span></button>
                  <button onClick={() => nav('/tarefas')}><strong>Nova tarefa</strong><span>Organizar próximo passo</span></button>
                  <button onClick={() => nav('/leads/funil')}><strong>Ver funil</strong><span>Acompanhar etapas de venda</span></button>
                </div>
              </Card>
            </section>
          </div>
        )}
      </div>

      <LeadForm
        open={newLead}
        onClose={() => setNewLead(false)}
        onSaved={(v: LeadResponse) => {
          setNewLead(false);
          load();
          nav(`/leads/${v.id}`);
        }}
      />
    </>
  );
}
