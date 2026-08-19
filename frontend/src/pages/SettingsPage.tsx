import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../app/AuthContext';
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  LoadingPanel,
  PageHeader,
  Select,
  useToast,
} from '../components/ui';
import { ApiError, authApi, settingsApi } from '../services/api';
import { formatCep, formatCnpj, formatPhone, roleLabels } from '../services/format';
import { applyPreferences } from '../services/preferences';
import type { SettingsResponse } from '../types';
import '../styles/settings.css';

type CompanyForm = {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  website: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

type PreferenceForm = {
  defaultPeriodDays: number;
  timezone: string;
};

const emptyCompany: CompanyForm = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  website: '',
  postalCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

export function SettingsPage() {
  const { user, refreshMe } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [company, setCompany] = useState<CompanyForm>(emptyCompany);
  const [preferences, setPreferences] = useState<PreferenceForm>({
    defaultPeriodDays: 30,
    timezone: 'America/Bahia',
  });
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
  });
  const [activeSection, setActiveSection] = useState(user?.role === 'ADMIN' ? 'company' : 'account');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [requestingToken, setRequestingToken] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordTokenSent, setPasswordTokenSent] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    token: '',
    password: '',
    confirmPassword: '',
  });

  const isAdmin = user?.role === 'ADMIN';

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const settings = await settingsApi.get();
      setData(settings);
      setCompany({
        companyName: settings.companyName ?? '',
        companyEmail: settings.companyEmail ?? '',
        companyPhone: formatPhone(settings.companyPhone),
        website: settings.website ?? '',
        postalCode: formatCep(settings.postalCode),
        street: settings.street ?? '',
        number: settings.number ?? '',
        complement: settings.complement ?? '',
        neighborhood: settings.neighborhood ?? '',
        city: settings.city ?? '',
        state: settings.state ?? '',
      });
      setPreferences({
        defaultPeriodDays: settings.defaultPeriodDays,
        timezone: settings.timezone,
      });
      applyPreferences(settings.defaultPeriodDays, settings.timezone);
    } catch (cause) {
      setError((cause as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfile({
      name: user.name,
      email: user.email,
    });
  }, [user]);

  const companyDirty = useMemo(() => {
    if (!data) {
      return false;
    }

    return (
      company.companyName !== (data.companyName ?? '') ||
      company.companyEmail !== (data.companyEmail ?? '') ||
      company.companyPhone.replace(/\D/g, '') !== (data.companyPhone ?? '').replace(/\D/g, '') ||
      company.website !== (data.website ?? '') ||
      company.postalCode.replace(/\D/g, '') !== (data.postalCode ?? '').replace(/\D/g, '') ||
      company.street !== (data.street ?? '') ||
      company.number !== (data.number ?? '') ||
      company.complement !== (data.complement ?? '') ||
      company.neighborhood !== (data.neighborhood ?? '') ||
      company.city !== (data.city ?? '') ||
      company.state !== (data.state ?? '')
    );
  }, [company, data]);

  const profileDirty = useMemo(() => {
    if (!user) {
      return false;
    }

    return profile.name.trim() !== user.name || profile.email.trim() !== user.email;
  }, [profile, user]);

  const preferencesDirty = useMemo(() => {
    if (!data) {
      return false;
    }

    return (
      preferences.defaultPeriodDays !== data.defaultPeriodDays ||
      preferences.timezone !== data.timezone
    );
  }, [data, preferences]);

  const goToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const saveCompany = async () => {
    setSavingCompany(true);

    try {
      const updated = await settingsApi.updateCompany({
        ...company,
        companyPhone: company.companyPhone.replace(/\D/g, ''),
        postalCode: company.postalCode.replace(/\D/g, ''),
        state: company.state.toUpperCase(),
      });

      setData(updated);
      setCompany({
        companyName: updated.companyName ?? '',
        companyEmail: updated.companyEmail ?? '',
        companyPhone: formatPhone(updated.companyPhone),
        website: updated.website ?? '',
        postalCode: formatCep(updated.postalCode),
        street: updated.street ?? '',
        number: updated.number ?? '',
        complement: updated.complement ?? '',
        neighborhood: updated.neighborhood ?? '',
        city: updated.city ?? '',
        state: updated.state ?? '',
      });
      await refreshMe();
      toast.push('success', 'Dados atualizados', 'As informações da empresa foram salvas.');
    } catch (cause) {
      toast.push('error', 'Não foi possível salvar', (cause as ApiError).message);
    } finally {
      setSavingCompany(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);

    try {
      await authApi.updateProfile({
        name: profile.name.trim(),
        email: profile.email.trim(),
      });
      await refreshMe();
      toast.push('success', 'Conta atualizada', 'Seu nome e e-mail foram atualizados.');
    } catch (cause) {
      toast.push('error', 'Não foi possível atualizar sua conta', (cause as ApiError).message);
    } finally {
      setSavingProfile(false);
    }
  };

  const requestPasswordToken = async () => {
    setRequestingToken(true);

    try {
      const response = await authApi.requestPasswordChange();
      setPasswordTokenSent(true);
      setMaskedEmail(response.maskedEmail);
      toast.push(
        'success',
        'Token enviado',
        `Enviamos um token de confirmação para ${response.maskedEmail}.`,
      );
    } catch (cause) {
      toast.push('error', 'Não foi possível enviar o token', (cause as ApiError).message);
    } finally {
      setRequestingToken(false);
    }
  };

  const confirmPasswordChange = async () => {
    if (passwordForm.password !== passwordForm.confirmPassword) {
      toast.push('error', 'Senhas diferentes', 'A confirmação deve ser igual à nova senha.');
      return;
    }

    setChangingPassword(true);

    try {
      await authApi.confirmPasswordChange({
        token: passwordForm.token.trim(),
        newPassword: passwordForm.password,
      });
      setPasswordForm({ token: '', password: '', confirmPassword: '' });
      setPasswordTokenSent(false);
      setMaskedEmail('');
      toast.push('success', 'Senha alterada', 'Sua nova senha já está ativa.');
    } catch (cause) {
      toast.push('error', 'Não foi possível alterar a senha', (cause as ApiError).message);
    } finally {
      setChangingPassword(false);
    }
  };

  const savePreferences = async () => {
    setSavingPreferences(true);

    try {
      const updated = await settingsApi.updatePreferences(preferences);
      setData(updated);
      setPreferences({
        defaultPeriodDays: updated.defaultPeriodDays,
        timezone: updated.timezone,
      });
      applyPreferences(updated.defaultPeriodDays, updated.timezone);
      toast.push(
        'success',
        'Preferências atualizadas',
        'O período padrão e o fuso horário serão usados nas próximas telas abertas.',
      );
    } catch (cause) {
      toast.push('error', 'Não foi possível salvar', (cause as ApiError).message);
    } finally {
      setSavingPreferences(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Configurações" />
        <LoadingPanel />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Gerencie sua conta, informações da empresa e preferências de uso do LeadFlow."
      />

      {error && <Alert tone="error">{error}</Alert>}

      <div className="lf-settings-page">
        <nav className="lf-settings-nav" aria-label="Navegação das configurações">
          {isAdmin && (
            <button
              type="button"
              className={activeSection === 'company' ? 'active' : ''}
              onClick={() => goToSection('company')}
            >
              Dados da Empresa
            </button>
          )}
          <button
            type="button"
            className={activeSection === 'account' ? 'active' : ''}
            onClick={() => goToSection('account')}
          >
            Minha Conta
          </button>
          <button
            type="button"
            className={activeSection === 'profiles' ? 'active' : ''}
            onClick={() => goToSection('profiles')}
          >
            Informações de Perfis
          </button>
          <button
            type="button"
            className={activeSection === 'preferences' ? 'active' : ''}
            onClick={() => goToSection('preferences')}
          >
            Preferências do Sistema
          </button>
        </nav>

        <div className="lf-settings-content">
          {isAdmin && data && (
            <Card className="lf-settings-section" >
              <section id="company" className="lf-settings-anchor">
                <div className="lf-settings-section-head">
                  <div>
                    <h2 className="lf-card-title">Dados da Empresa</h2>
                    <p className="lf-card-subtitle">
                      Informações institucionais e de contato usadas na operação comercial.
                    </p>
                  </div>
                  <span className="lf-settings-access">Somente administrador</span>
                </div>

                <div className="lf-settings-form-grid">
                  <Field label="Nome da empresa">
                    <Input
                      value={company.companyName}
                      onChange={(event) =>
                        setCompany((current) => ({
                          ...current,
                          companyName: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="CNPJ">
                    <Input value={formatCnpj(data.cnpj)} readOnly />
                  </Field>

                  <Field label="E-mail comercial">
                    <Input
                      type="email"
                      value={company.companyEmail}
                      onChange={(event) =>
                        setCompany((current) => ({
                          ...current,
                          companyEmail: event.target.value,
                        }))
                      }
                      placeholder="contato@empresa.com.br"
                    />
                  </Field>

                  <Field label="Telefone">
                    <Input
                      value={company.companyPhone}
                      onChange={(event) =>
                        setCompany((current) => ({
                          ...current,
                          companyPhone: formatPhone(event.target.value),
                        }))
                      }
                      placeholder="(71) 99999-9999"
                    />
                  </Field>

                  <Field label="Site">
                    <Input
                      value={company.website}
                      onChange={(event) =>
                        setCompany((current) => ({
                          ...current,
                          website: event.target.value,
                        }))
                      }
                      placeholder="https://www.empresa.com.br"
                    />
                  </Field>

                  <Field label="CEP">
                    <Input
                      value={company.postalCode}
                      onChange={(event) =>
                        setCompany((current) => ({
                          ...current,
                          postalCode: formatCep(event.target.value),
                        }))
                      }
                      placeholder="00000-000"
                    />
                  </Field>

                  <Field label="Endereço">
                    <Input
                      value={company.street}
                      onChange={(event) =>
                        setCompany((current) => ({
                          ...current,
                          street: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Número">
                    <Input
                      value={company.number}
                      onChange={(event) =>
                        setCompany((current) => ({
                          ...current,
                          number: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Complemento">
                    <Input
                      value={company.complement}
                      onChange={(event) =>
                        setCompany((current) => ({
                          ...current,
                          complement: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Bairro">
                    <Input
                      value={company.neighborhood}
                      onChange={(event) =>
                        setCompany((current) => ({
                          ...current,
                          neighborhood: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Cidade">
                    <Input
                      value={company.city}
                      onChange={(event) =>
                        setCompany((current) => ({
                          ...current,
                          city: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="UF">
                    <Input
                      maxLength={2}
                      value={company.state}
                      onChange={(event) =>
                        setCompany((current) => ({
                          ...current,
                          state: event.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="BA"
                    />
                  </Field>
                </div>

                <div className="lf-settings-actions">
                  <Button
                    variant="secondary"
                    disabled={!companyDirty}
                    onClick={() => {
                      setCompany({
                        companyName: data.companyName ?? '',
                        companyEmail: data.companyEmail ?? '',
                        companyPhone: formatPhone(data.companyPhone),
                        website: data.website ?? '',
                        postalCode: formatCep(data.postalCode),
                        street: data.street ?? '',
                        number: data.number ?? '',
                        complement: data.complement ?? '',
                        neighborhood: data.neighborhood ?? '',
                        city: data.city ?? '',
                        state: data.state ?? '',
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button disabled={!companyDirty || savingCompany} onClick={saveCompany}>
                    {savingCompany ? 'Salvando...' : 'Salvar dados da empresa'}
                  </Button>
                </div>
              </section>
            </Card>
          )}

          <Card className="lf-settings-section">
            <section id="account" className="lf-settings-anchor">
              <div className="lf-settings-section-head">
                <div>
                  <h2 className="lf-card-title">Minha Conta</h2>
                  <p className="lf-card-subtitle">
                    Atualize seus dados de acesso e mantenha sua conta protegida.
                  </p>
                </div>
              </div>

              <div className="lf-settings-form-grid">
                <Field label="Nome">
                  <Input
                    value={profile.name}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="E-mail">
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="Perfil">
                  <Input value={user ? roleLabels[user.role] : ''} readOnly />
                </Field>

                <Field label="Filial principal">
                  <Input value={user?.primaryBranchName ?? 'Sem filial principal'} readOnly />
                </Field>
              </div>

              <div className="lf-settings-actions">
                <Button
                  variant="secondary"
                  disabled={!profileDirty}
                  onClick={() =>
                    user &&
                    setProfile({
                      name: user.name,
                      email: user.email,
                    })
                  }
                >
                  Cancelar
                </Button>
                <Button disabled={!profileDirty || savingProfile} onClick={saveProfile}>
                  {savingProfile ? 'Salvando...' : 'Salvar dados da conta'}
                </Button>
              </div>

              <div className="lf-settings-password">
                <div className="lf-settings-password-head">
                  <div>
                    <h3>Alterar senha</h3>
                    <p>
                      Para confirmar a alteração, um token será enviado para o seu e-mail.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    disabled={requestingToken}
                    onClick={requestPasswordToken}
                  >
                    {requestingToken
                      ? 'Enviando...'
                      : passwordTokenSent
                        ? 'Reenviar token'
                        : 'Enviar token por e-mail'}
                  </Button>
                </div>

                {passwordTokenSent && (
                  <>
                    <Alert tone="info">
                      Digite o token enviado para {maskedEmail} e informe sua nova senha.
                    </Alert>
                    <div className="lf-settings-form-grid lf-settings-password-grid">
                      <Field label="Token de confirmação">
                        <Input
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={passwordForm.token}
                          onChange={(event) =>
                            setPasswordForm((current) => ({
                              ...current,
                              token: event.target.value.replace(/\D/g, ''),
                            }))
                          }
                        />
                      </Field>

                      <Field
                        label="Nova senha"
                        helper="Use ao menos 8 caracteres, com maiúscula, minúscula, número e símbolo."
                      >
                        <Input
                          type="password"
                          autoComplete="new-password"
                          value={passwordForm.password}
                          onChange={(event) =>
                            setPasswordForm((current) => ({
                              ...current,
                              password: event.target.value,
                            }))
                          }
                        />
                      </Field>

                      <Field label="Confirmar nova senha">
                        <Input
                          type="password"
                          autoComplete="new-password"
                          value={passwordForm.confirmPassword}
                          onChange={(event) =>
                            setPasswordForm((current) => ({
                              ...current,
                              confirmPassword: event.target.value,
                            }))
                          }
                        />
                      </Field>
                    </div>

                    <div className="lf-settings-actions">
                      <Button
                        disabled={
                          changingPassword ||
                          passwordForm.token.length !== 6 ||
                          !passwordForm.password ||
                          !passwordForm.confirmPassword
                        }
                        onClick={confirmPasswordChange}
                      >
                        {changingPassword ? 'Alterando...' : 'Confirmar nova senha'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </section>
          </Card>

          <Card className="lf-settings-section">
            <section id="profiles" className="lf-settings-anchor">
              <div className="lf-settings-section-head">
                <div>
                  <h2 className="lf-card-title">Informações de Perfis</h2>
                  <p className="lf-card-subtitle">
                    Entenda de forma simples o que cada perfil pode fazer no LeadFlow.
                  </p>
                </div>
              </div>

              <div className="lf-profile-info-grid">
                <article>
                  <span className="lf-profile-info-label">Administrador</span>
                  <strong>Gestão completa da empresa</strong>
                  <p>
                    Gerencia filiais, equipe, regras de pontuação, dados da empresa e acompanha os resultados gerais.
                  </p>
                </article>

                <article>
                  <span className="lf-profile-info-label">Gerente</span>
                  <strong>Gestão da operação autorizada</strong>
                  <p>
                    Acompanha as filiais sob sua responsabilidade, a equipe vinculada, Leads, tarefas e desempenho comercial.
                  </p>
                </article>

                <article>
                  <span className="lf-profile-info-label">Vendedor</span>
                  <strong>Execução comercial</strong>
                  <p>
                    Trabalha com seus Leads, registra interações, organiza tarefas e acompanha o próprio desempenho.
                  </p>
                </article>
              </div>
            </section>
          </Card>

          {data && (
            <Card className="lf-settings-section">
              <section id="preferences" className="lf-settings-anchor">
                <div className="lf-settings-section-head">
                  <div>
                    <h2 className="lf-card-title">Preferências do Sistema</h2>
                    <p className="lf-card-subtitle">
                      Defina como períodos e horários devem aparecer para você.
                    </p>
                  </div>
                </div>

                <div className="lf-settings-form-grid lf-settings-preferences-grid">
                  <Field
                    label="Período padrão"
                    helper="Será usado como período inicial no Dashboard e nas telas de desempenho."
                  >
                    <Select
                      value={preferences.defaultPeriodDays}
                      onChange={(event) =>
                        setPreferences((current) => ({
                          ...current,
                          defaultPeriodDays: Number(event.target.value),
                        }))
                      }
                    >
                      <option value={7}>7 dias</option>
                      <option value={30}>30 dias</option>
                      <option value={90}>90 dias</option>
                      <option value={180}>180 dias</option>
                      <option value={365}>365 dias</option>
                    </Select>
                  </Field>

                  <Field
                    label="Fuso horário"
                    helper="Datas e horários serão exibidos conforme o fuso escolhido."
                  >
                    <Select
                      value={preferences.timezone}
                      onChange={(event) =>
                        setPreferences((current) => ({
                          ...current,
                          timezone: event.target.value,
                        }))
                      }
                    >
                      <option value="America/Bahia">Bahia</option>
                      <option value="America/Sao_Paulo">Brasília / São Paulo</option>
                      <option value="America/Fortaleza">Fortaleza</option>
                      <option value="America/Manaus">Manaus</option>
                      <option value="America/Recife">Recife</option>
                    </Select>
                  </Field>
                </div>

                <div className="lf-settings-actions">
                  <Button
                    variant="secondary"
                    disabled={!preferencesDirty}
                    onClick={() =>
                      setPreferences({
                        defaultPeriodDays: data.defaultPeriodDays,
                        timezone: data.timezone,
                      })
                    }
                  >
                    Cancelar
                  </Button>
                  <Button
                    disabled={!preferencesDirty || savingPreferences}
                    onClick={savePreferences}
                  >
                    {savingPreferences ? 'Salvando...' : 'Salvar preferências'}
                  </Button>
                </div>
              </section>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
