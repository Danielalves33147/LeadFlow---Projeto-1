import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { ApiError } from '../services/api';
import { formatCnpj } from '../services/format';
import { Alert, Button, Field, Input } from '../components/ui';
import {
  isStrongPassword,
  PasswordStrength,
} from '../components/PasswordStrength';

type LegalModal = 'terms' | 'privacy' | null;

export function RegisterPage() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    companyName: '',
    cnpj: '',
    password: '',
    confirm: '',
    acceptedTerms: false,
    acceptedPrivacy: false,
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [legalModal, setLegalModal] = useState<LegalModal>(null);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const set = (
    key: string,
    value: string | boolean,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    setError('');
    setFields({});

    if (!isStrongPassword(form.password)) {
      setFields({
        password:
          'A senha ainda não atende a todos os requisitos de segurança.',
      });
      return;
    }

    if (form.password !== form.confirm) {
      setFields({
        confirm: 'As senhas não coincidem.',
      });
      return;
    }

    setBusy(true);

    try {
      const response = await register({
        name: form.name,
        email: form.email,
        companyName: form.companyName,
        cnpj: form.cnpj,
        password: form.password,
        acceptedTerms: form.acceptedTerms,
        acceptedPrivacy: form.acceptedPrivacy,
      });

      navigate(
        `/confirmar-email?email=${encodeURIComponent(response.email)}`,
        {
          replace: true,
        },
      );
    } catch (cause) {
      const apiError = cause as ApiError;

      setError(apiError.message);
      setFields(apiError.fieldErrors);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="lf-auth">
        <aside className="lf-auth-brand-panel">
          <div className="lf-auth-brand">
            <span className="lf-brand-mark">
              LF
            </span>

            <strong>
              LeadFlow
            </strong>
          </div>

          <div>
            <h1>
              Comece com uma base comercial organizada.
            </h1>

            <p>
              Crie a conta principal da empresa e configure
              equipes, filiais e processos no mesmo ambiente.
            </p>
          </div>

          <div className="lf-auth-note">
            Segurança por perfil • Histórico rastreável • Interface responsiva
          </div>
        </aside>

        <main className="lf-auth-form-panel">
          <form
            className="lf-auth-form register"
            onSubmit={submit}
          >
            <div className="lf-auth-mobile-brand">
              LeadFlow
            </div>

            <div>
              <h1>
                Criar conta
              </h1>

              <p>
                Informe os dados essenciais da empresa.
              </p>
            </div>

            {error && (
              <Alert tone="error">
                {error}
              </Alert>
            )}

            <div className="lf-form-grid">
              <Field
                label="Nome completo"
                error={fields.name}
              >
                <Input
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.name}
                  onChange={(event) =>
                    set(
                      'name',
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field
                label="E-mail corporativo"
                error={fields.email}
              >
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    set(
                      'email',
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field
                label="Nome da empresa"
                error={fields.companyName}
              >
                <Input
                  required
                  value={form.companyName}
                  onChange={(event) =>
                    set(
                      'companyName',
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field
                label="CNPJ"
                error={fields.cnpj}
              >
                <Input
                  required
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  maxLength={18}
                  onChange={(event) =>
                    set(
                      'cnpj',
                      formatCnpj(
                        event.target.value,
                      ),
                    )
                  }
                />
              </Field>

              <Field
                label="Senha"
                error={fields.password}
              >
                <>
                  <Input
                    required
                    minLength={8}
                    maxLength={72}
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) =>
                      set(
                        'password',
                        event.target.value,
                      )
                    }
                  />

                  <PasswordStrength
                    value={form.password}
                  />
                </>
              </Field>

              <Field
                label="Confirmação da senha"
                error={fields.confirm}
              >
                <>
                  <Input
                    required
                    minLength={8}
                    maxLength={72}
                    type="password"
                    autoComplete="new-password"
                    value={form.confirm}
                    onChange={(event) =>
                      set(
                        'confirm',
                        event.target.value,
                      )
                    }
                  />

                  {form.confirm &&
                    form.password !== form.confirm && (
                      <span className="lf-password-match lf-password-match-error">
                        As senhas ainda não coincidem.
                      </span>
                    )}

                  {form.confirm &&
                    form.password === form.confirm && (
                      <span className="lf-password-match lf-password-match-ok">
                        As senhas coincidem.
                      </span>
                    )}
                </>
              </Field>
            </div>

            {/* TERMOS E PRIVACIDADE */}
            <div className="lf-legal-checks">
              <div className="lf-check">
                <input
                  id="acceptedTerms"
                  required
                  type="checkbox"
                  checked={form.acceptedTerms}
                  onChange={(event) =>
                    set(
                      'acceptedTerms',
                      event.target.checked,
                    )
                  }
                />

                <button
                  type="button"
                  className="lf-link"
                  onClick={() =>
                    setLegalModal('terms')
                  }
                >
                  Termos de Uso
                </button>
              </div>

              <div className="lf-check">
                <input
                  id="acceptedPrivacy"
                  required
                  type="checkbox"
                  checked={form.acceptedPrivacy}
                  onChange={(event) =>
                    set(
                      'acceptedPrivacy',
                      event.target.checked,
                    )
                  }
                />

                <button
                  type="button"
                  className="lf-link"
                  onClick={() =>
                    setLegalModal('privacy')
                  }
                >
                  Política de Privacidade
                </button>
              </div>
            </div>

            <Button
              size="lg"
              type="submit"
              disabled={busy}
            >
              {busy
                ? 'Criando conta...'
                : 'Criar conta'}
            </Button>

            <p className="lf-auth-switch">
              Já possui uma conta?{' '}

              <Link to="/login">
                Entrar
              </Link>
            </p>
          </form>
        </main>
      </div>

      {/* MODAL */}
      {legalModal && (
        <div
          className="lf-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setLegalModal(null);
            }
          }}
        >
          <section
            className="lf-modal lf-modal-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
          >
            <div className="lf-modal-header">
              <div style={{ flex: 1 }}>
                <h2
                  id="legal-modal-title"
                  className="lf-modal-title"
                >
                  {legalModal === 'terms'
                    ? 'Termos de Uso'
                    : 'Política de Privacidade'}
                </h2>

                <p className="lf-modal-description">
                  LeadFlow
                </p>
              </div>

              <button
                type="button"
                className="lf-icon-btn"
                aria-label="Fechar"
                onClick={() =>
                  setLegalModal(null)
                }
              >
                ✕
              </button>
            </div>

            <div className="lf-modal-body lf-legal-modal-content">
              {legalModal === 'terms' ? (
                <>
                  <p>
                    Ao utilizar o LeadFlow, o usuário
                    concorda com as condições estabelecidas
                    nestes Termos de Uso.
                  </p>

                  <h3>
                    1. Uso da plataforma
                  </h3>

                  <p>
                    O LeadFlow é uma plataforma destinada à
                    organização e gestão de atividades
                    comerciais, incluindo leads, tarefas,
                    equipes, filiais e interações.
                  </p>

                  <h3>
                    2. Conta e acesso
                  </h3>

                  <p>
                    O usuário é responsável pelas informações
                    fornecidas durante o cadastro e pela
                    proteção de suas credenciais de acesso.
                  </p>

                  <h3>
                    3. Responsabilidades
                  </h3>

                  <p>
                    A plataforma deve ser utilizada de forma
                    lícita e de acordo com as permissões
                    atribuídas ao perfil de cada usuário.
                  </p>

                  <h3>
                    4. Perfis e permissões
                  </h3>

                  <p>
                    Administradores, gerentes e vendedores
                    possuem níveis de acesso diferentes,
                    conforme suas responsabilidades dentro
                    da organização.
                  </p>

                  <h3>
                    5. Segurança
                  </h3>

                  <p>
                    O LeadFlow utiliza mecanismos de
                    autenticação, confirmação de e-mail e
                    controle de acesso para proteger contas
                    e informações armazenadas.
                  </p>

                  <h3>
                    6. Disponibilidade
                  </h3>

                  <p>
                    A plataforma poderá passar por
                    manutenções, atualizações ou
                    indisponibilidades temporárias.
                  </p>

                  <h3>
                    7. Uso inadequado
                  </h3>

                  <p>
                    Não é permitido utilizar o LeadFlow para
                    atividades ilícitas, tentativas de acesso
                    não autorizado ou ações que comprometam
                    a segurança do sistema.
                  </p>

                  <h3>
                    8. Atualizações dos termos
                  </h3>

                  <p>
                    Estes termos poderão ser atualizados de
                    acordo com a evolução da plataforma e
                    das regras aplicáveis ao serviço.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Esta Política de Privacidade apresenta,
                    de forma geral, como informações são
                    tratadas durante a utilização do
                    LeadFlow.
                  </p>

                  <h3>
                    1. Dados tratados
                  </h3>

                  <p>
                    Durante o cadastro e uso da plataforma
                    poderão ser tratados dados como nome,
                    e-mail, empresa, CNPJ, função, filial e
                    outras informações necessárias ao
                    funcionamento do serviço.
                  </p>

                  <h3>
                    2. Finalidade
                  </h3>

                  <p>
                    Os dados são utilizados para autenticação,
                    gerenciamento de contas, funcionamento das
                    funcionalidades, controle de acesso,
                    segurança e comunicação relacionada ao
                    serviço.
                  </p>

                  <h3>
                    3. Segurança das informações
                  </h3>

                  <p>
                    O LeadFlow utiliza controles técnicos para
                    restringir o acesso às informações de
                    acordo com empresa, perfil e permissões do
                    usuário.
                  </p>

                  <h3>
                    4. Senhas
                  </h3>

                  <p>
                    As senhas são tratadas utilizando
                    mecanismos apropriados de proteção e não
                    devem ser armazenadas em texto puro.
                  </p>

                  <h3>
                    5. Compartilhamento
                  </h3>

                  <p>
                    Os dados não devem ser utilizados para
                    finalidades incompatíveis com a operação
                    da plataforma, salvo quando necessário
                    para prestação do serviço ou cumprimento
                    de obrigação legal.
                  </p>

                  <h3>
                    6. Direitos relacionados aos dados
                  </h3>

                  <p>
                    Solicitações relacionadas a dados pessoais
                    poderão ser tratadas de acordo com a
                    legislação aplicável, incluindo a
                    legislação brasileira de proteção de
                    dados.
                  </p>

                  <h3>
                    7. Atualizações desta política
                  </h3>

                  <p>
                    Esta Política de Privacidade poderá ser
                    atualizada conforme a evolução do
                    LeadFlow e das regras aplicáveis ao
                    tratamento de dados.
                  </p>
                </>
              )}
            </div>

            <div className="lf-modal-footer">
              <Button
                type="button"
                onClick={() =>
                  setLegalModal(null)
                }
              >
                Fechar
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}