import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { BarList } from '../components/charts';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingPanel,
  Modal,
  PageHeader,
  useToast,
} from '../components/ui';
import { ApiError, branchApi, rankingApi } from '../services/api';
import { fmtNumber, fmtPercent } from '../services/format';
import type { BranchRankingResponse, BranchSummary } from '../types';
import { getDefaultPeriodDays } from '../services/preferences';
import '../styles/ranking.css';

const TOP_LIMIT = 10;
const TABLE_PAGE_SIZE = 8;

export function RankingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const searchRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<BranchRankingResponse[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [days, setDays] = useState(() => getDefaultPeriodDays());
  const [tablePage, setTablePage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);

  const [newBranchOpen, setNewBranchOpen] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [savingBranch, setSavingBranch] = useState(false);

  const loadRanking = () => {
    setLoading(true);
    setError('');

    const to = new Date();
    const from = new Date(to);
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - (days - 1));

    rankingApi
      .get({
        from: from.toISOString(),
        to: to.toISOString(),
      })
      .then(setItems)
      .catch((cause) => setError((cause as ApiError).message))
      .finally(() => setLoading(false));
  };

  const loadBranches = () => {
    branchApi
      .list()
      .then(setBranches)
      .catch(() => setBranches([]));
  };

  useEffect(() => {
    setTablePage(0);
    loadRanking();
  }, [days]);

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, []);

  const filteredBranches = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');

    if (!term) {
      return branches.slice(0, 8);
    }

    return branches
      .filter((branch) =>
        branch.name.toLocaleLowerCase('pt-BR').includes(term),
      )
      .slice(0, 8);
  }, [branches, search]);

  useEffect(() => {
    setActiveSearchIndex(0);
  }, [search]);

  const openBranch = (branch: BranchSummary) => {
    setSearch(branch.name);
    setSearchOpen(false);
    navigate(`/filiais/${branch.id}`);
  };

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setSearchOpen(false);
      return;
    }

    if (!searchOpen && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      setSearchOpen(true);
    }

    if (filteredBranches.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSearchIndex((current) =>
        current >= filteredBranches.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSearchIndex((current) =>
        current <= 0 ? filteredBranches.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveSearchIndex(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveSearchIndex(filteredBranches.length - 1);
      return;
    }

    if (event.key === 'Enter' && searchOpen) {
      event.preventDefault();
      openBranch(filteredBranches[activeSearchIndex]);
    }
  };

  const createBranch = async () => {
    const cleanName = branchName.trim();

    if (cleanName.length < 2) {
      return;
    }

    setSavingBranch(true);

    try {
      const created = await branchApi.create({
        name: cleanName,
        active: true,
      });

      toast.push('success', 'Filial criada', created.name);
      setNewBranchOpen(false);
      setBranchName('');
      loadBranches();
      loadRanking();
    } catch (cause) {
      toast.push(
        'error',
        'Não foi possível criar a filial',
        (cause as ApiError).message,
      );
    } finally {
      setSavingBranch(false);
    }
  };

  const topTen = items.slice(0, TOP_LIMIT);
  const topLabel = `Top ${topTen.length}`;
  const tablePageCount = Math.max(
    1,
    Math.ceil(items.length / TABLE_PAGE_SIZE),
  );
  const safeTablePage = Math.min(tablePage, tablePageCount - 1);
  const tableStart = safeTablePage * TABLE_PAGE_SIZE;
  const tableEnd = Math.min(tableStart + TABLE_PAGE_SIZE, items.length);
  const branchTable = items.slice(tableStart, tableEnd);

  useEffect(() => {
    if (tablePage > tablePageCount - 1) {
      setTablePage(Math.max(0, tablePageCount - 1));
    }
  }, [tablePage, tablePageCount]);

  return (
    <>
      <PageHeader
        title="Filiais"
        description="Compare o desempenho comercial das filiais e acesse rapidamente os detalhes de cada unidade."
        actions={
          <div className="lf-ranking-header-actions">
            <div className="lf-branch-search" ref={searchRef}>
              <span className="lf-branch-search-icon" aria-hidden="true">
                ⌕
              </span>
              <input
                aria-label="Pesquisar filial"
                autoComplete="off"
                className="lf-branch-search-input"
                placeholder="Pesquisar filial"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={onSearchKeyDown}
              />

              {searchOpen && (
                <div
                  className="lf-branch-search-menu"
                  role="listbox"
                  aria-label="Filiais encontradas"
                >
                  {filteredBranches.length === 0 ? (
                    <div className="lf-branch-search-empty">
                      Nenhuma filial encontrada.
                    </div>
                  ) : (
                    filteredBranches.map((branch, index) => (
                      <button
                        type="button"
                        role="option"
                        aria-selected={index === activeSearchIndex}
                        className={`lf-branch-search-option ${
                          index === activeSearchIndex ? 'active' : ''
                        }`}
                        key={branch.id}
                        onMouseEnter={() => setActiveSearchIndex(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => openBranch(branch)}
                      >
                        <span>{branch.name}</span>
                        <small>Ver detalhes</small>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <select
              aria-label="Período do ranking"
              className="lf-select lf-period-select lf-ranking-period"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
                <option value={180}>Últimos 180 dias</option>
                <option value={365}>Últimos 365 dias</option>
            </select>

            {user?.role === 'ADMIN' && (
              <Button onClick={() => setNewBranchOpen(true)}>
                + Nova Filial
              </Button>
            )}
          </div>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <LoadingPanel />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title="Sem dados para o período"
            text="Selecione outro intervalo para comparar as filiais."
          />
        </Card>
      ) : (
        <div className="lf-ranking-layout">
          <aside className="lf-ranking-sidebar">
            <div className="lf-ranking-section-heading">
              <div>
                <h2>{topLabel}</h2>
                <p>Filiais com maior pontuação no período.</p>
              </div>
            </div>

            <div className="lf-ranking-stack">
              {topTen.map((ranking, index) => (
                <button
                  type="button"
                  className={`lf-ranking-compact-card ${
                    index === 0 ? 'top-1' : ''
                  }`}
                  key={ranking.branchId}
                  onClick={() => navigate(`/filiais/${ranking.branchId}`)}
                >
                  <span className="lf-ranking-compact-position">
                    #{ranking.position}
                  </span>

                  <span className="lf-ranking-compact-main">
                    <strong>{ranking.branchName}</strong>
                    <small>
                      {fmtNumber(ranking.points)} pts •{' '}
                      {fmtPercent(ranking.conversionRate)} conversão
                    </small>
                  </span>

                  <span
                    className={
                      ranking.trend >= 0 ? 'lf-trend-up' : 'lf-trend-down'
                    }
                  >
                    {ranking.trend >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(ranking.trend).toFixed(1)}%
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="lf-ranking-main">
            <div className="lf-ranking-summary-grid">
              <Card className="lf-ranking-summary-card">
                <h2 className="lf-card-title">Comparativo de pontos</h2>
                <div className="lf-ranking-bar-wrap">
                  <BarList
                    data={topTen.slice(0, 5).map((ranking) => ({
                      label: ranking.branchName,
                      value: ranking.points,
                    }))}
                  />
                </div>
              </Card>

              <Card className="lf-ranking-summary-card">
                <h2 className="lf-card-title">Critério principal</h2>
                <p className="lf-card-subtitle">
                  Classificação por pontos gerados no período; conversões e taxa
                  ajudam a contextualizar a posição.
                </p>

                <div className="lf-summary-list lf-ranking-summary-list">
                  <div>
                    <span>Filiais avaliadas</span>
                    <strong>{items.length}</strong>
                  </div>
                  <div>
                    <span>Líder atual</span>
                    <strong>{items[0]?.branchName}</strong>
                  </div>
                  <div>
                    <span>Maior pontuação</span>
                    <strong>{fmtNumber(items[0]?.points ?? 0)}</strong>
                  </div>
                </div>
              </Card>
            </div>

            <div className="lf-ranking-table-card">
              <div className="lf-ranking-table-heading">
                <div>
                  <h2>Todas as filiais</h2>
                  <p>Visão geral das filiais no período selecionado.</p>
                </div>
                <span>
                  {items.length === 0
                    ? '0 filiais'
                    : `${tableStart + 1}–${tableEnd} de ${items.length} filiais`}
                </span>
              </div>

              <div className="lf-ranking-table-wrap">
                <table className="lf-ranking-table">
                  <colgroup>
                    <col className="position" />
                    <col className="branch" />
                    <col className="metric" />
                    <col className="metric" />
                    <col className="metric" />
                    <col className="metric" />
                    <col className="metric" />
                    <col className="metric" />
                    <col className="trend" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="center">Posição</th>
                      <th className="branch">Filial</th>
                      <th className="center">Pontos</th>
                      <th className="center">Interações</th>
                      <th className="center">Ativos no período</th>
                      <th className="center">Novos Leads</th>
                      <th className="center">Conversões</th>
                      <th className="center">Taxa</th>
                      <th className="center">Evolução</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchTable.map((ranking) => (
                      <tr key={ranking.branchId}>
                        <td className="center">
                          <strong>#{ranking.position}</strong>
                        </td>
                        <td className="branch">
                          <button
                            type="button"
                            className="lf-ranking-branch-link"
                            onClick={() =>
                              navigate(`/filiais/${ranking.branchId}`)
                            }
                          >
                            {ranking.branchName}
                          </button>
                        </td>
                        <td className="center numeric strong">
                          {fmtNumber(ranking.points)}
                        </td>
                        <td className="center numeric">
                          {fmtNumber(ranking.interactions)}
                        </td>
                        <td className="center numeric">
                          {fmtNumber(ranking.activeLeads)}
                        </td>
                        <td className="center numeric">
                          {fmtNumber(ranking.newLeads)}
                        </td>
                        <td className="center numeric">
                          {fmtNumber(ranking.conversions)}
                        </td>
                        <td className="center numeric">
                          {fmtPercent(ranking.conversionRate)}
                        </td>
                        <td
                          className={`center numeric ${
                            ranking.trend >= 0
                              ? 'lf-trend-up'
                              : 'lf-trend-down'
                          }`}
                        >
                          {ranking.trend >= 0 ? '↑' : '↓'}{' '}
                          {Math.abs(ranking.trend).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {tablePageCount > 1 && (
                <div
                  className="lf-ranking-pagination"
                  aria-label="Paginação da tabela de filiais"
                >
                  <Button
                    variant="secondary"
                    disabled={safeTablePage === 0}
                    onClick={() =>
                      setTablePage((current) => Math.max(0, current - 1))
                    }
                  >
                    Anterior
                  </Button>

                  <span>
                    Página {safeTablePage + 1} de {tablePageCount}
                  </span>

                  <Button
                    variant="secondary"
                    disabled={safeTablePage >= tablePageCount - 1}
                    onClick={() =>
                      setTablePage((current) =>
                        Math.min(tablePageCount - 1, current + 1),
                      )
                    }
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <Modal
        open={newBranchOpen}
        title="Nova Filial"
        description="Cadastre uma nova unidade comercial."
        onClose={() => setNewBranchOpen(false)}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setNewBranchOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={createBranch}
              disabled={savingBranch || branchName.trim().length < 2}
            >
              {savingBranch ? 'Criando...' : 'Criar filial'}
            </Button>
          </>
        }
      >
        <Field label="Nome da filial">
          <Input
            autoFocus
            value={branchName}
            onChange={(event) => setBranchName(event.target.value)}
            minLength={2}
            maxLength={120}
          />
        </Field>
      </Modal>
    </>
  );
}
