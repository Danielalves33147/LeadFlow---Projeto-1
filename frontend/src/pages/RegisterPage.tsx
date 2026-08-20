import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { ApiError } from '../services/api';
import { formatCnpj } from '../services/format';
import { Alert, Button, Field, Input } from '../components/ui';

function strength(value: string) {
  let score = 0;

  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  return score < 3
    ? 'Fraca'
    : score < 5
      ? 'Boa'
      : 'Forte';
}

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

      setError(
        apiError.message ||
          'Não foi possível criar a conta.',
      );

      setFields(
        apiError.fieldErrors || {},
      );
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
                helper={`Força: ${strength(form.password)}. Use 8+ caracteres com letras, número e símbolo.`}
              >
                <Input
                  required
                  minLength={8}
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    set(
                      'password',
                      event.target.value,
                    )
                  }
                />
              </Field>

              <Field
                label="Confirmação da senha"
                error={fields.confirm}
              >
                <Input
                  required
                  minLength={8}
                  type="password"
                  value={form.confirm}
                  onChange={(event) =>
                    set(
                      'confirm',
                      event.target.value,
                    )
                  }
                />
              </Field>
            </div>

            <div className="lf-legal-checks">
              <label className="lf-check">
                <input
                  required
                  type="checkbox"
                  checked={form.acceptedTerms}
                  onChange={(event) =>
                    set('acceptedTerms', event.target.checked)
                  }
                />

                <button
                  type="button"
                  className="lf-link"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setLegalModal('terms');
                  }}
                >
                  Termos de Uso
                </button>
              </label>

              <label className="lf-check">
                <input
                  required
                  type="checkbox"
                  checked={form.acceptedPrivacy}
                  onChange={(event) =>
                    set('acceptedPrivacy', event.target.checked)
                  }
                />

                <button
                  type="button"
                  className="lf-link"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setLegalModal('privacy');
                  }}
                >
                  Política de Privacidade
                </button>
              </label>
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
            <header className="lf-modal-header">
              <div
                style={{
                  flex: 1,
                }}
              >
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
                title="Fechar"
                onClick={() =>
                  setLegalModal(null)
                }
              >
                ✕
              </button>
            </header>

            <div className="lf-modal-body lf-legal-modal-content">
              {legalModal === 'terms' ? (
                <>
                  <p>
                    Ao utilizar o LeadFlow, você concorda
                    com as condições descritas nestes
                    Termos de Uso.
                  </p>

                  <h3>
                    1. Uso da plataforma
                  </h3>

                  <p>
                    O LeadFlow é uma plataforma destinada
                    à organização e gestão de atividades
                    comerciais, incluindo leads, tarefas,
                    equipes, filiais e interações.
                  </p>

                  <h3>
                    2. Conta e acesso
                  </h3>

                  <p>
                    O usuário é responsável pelas
                    informações fornecidas durante o
                    cadastro e pela proteção das
                    credenciais utilizadas para acessar
                    sua conta.
                  </p>

                  <p>
                    As credenciais são pessoais e não
                    devem ser compartilhadas com pessoas
                    não autorizadas.
                  </p>

                  <h3>
                    3. Responsabilidades do usuário
                  </h3>

                  <p>
                    O usuário compromete-se a utilizar
                    a plataforma de maneira lícita,
                    respeitando as permissões atribuídas
                    ao seu perfil e as regras da empresa
                    à qual sua conta está vinculada.
                  </p>

                  <h3>
                    4. Perfis e permissões
                  </h3>

                  <p>
                    O LeadFlow possui diferentes níveis
                    de acesso. Administradores, gerentes
                    e vendedores podem possuir
                    permissões distintas de acordo com
                    suas funções.
                  </p>

                  <h3>
                    5. Segurança
                  </h3>

                  <p>
                    O LeadFlow pode utilizar recursos
                    como autenticação, confirmação de
                    e-mail, controle de acesso,
                    armazenamento seguro de senhas e
                    registro de atividades para
                    proteger as contas e informações
                    armazenadas.
                  </p>

                  <h3>
                    6. Disponibilidade
                  </h3>

                  <p>
                    Poderão ocorrer interrupções
                    temporárias para manutenção,
                    atualizações ou correções da
                    plataforma.
                  </p>

                  <h3>
                    7. Uso inadequado
                  </h3>

                  <p>
                    É proibido utilizar a plataforma
                    para atividades ilícitas, acesso
                    não autorizado, tentativa de
                    comprometimento da segurança ou
                    qualquer atividade que possa
                    prejudicar outros usuários ou o
                    serviço.
                  </p>

                  <h3>
                    8. Alterações nos termos
                  </h3>

                  <p>
                    Estes termos poderão ser atualizados
                    conforme a evolução da plataforma,
                    alterações operacionais ou
                    necessidades jurídicas.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Esta Política de Privacidade
                    apresenta de forma geral como o
                    LeadFlow trata informações
                    relacionadas aos usuários da
                    plataforma.
                  </p>

                  <h3>
                    1. Dados coletados
                  </h3>

                  <p>
                    Durante o cadastro e utilização do
                    sistema, poderão ser tratados dados
                    como nome, e-mail, empresa, CNPJ,
                    função, filial e demais informações
                    necessárias ao funcionamento do
                    serviço.
                  </p>

                  <h3>
                    2. Dados de utilização
                  </h3>

                  <p>
                    Também poderão ser registrados
                    dados necessários para segurança e
                    funcionamento da aplicação, como
                    informações de autenticação,
                    atividades realizadas e registros
                    relacionados às funcionalidades do
                    sistema.
                  </p>

                  <h3>
                    3. Finalidade do tratamento
                  </h3>

                  <p>
                    Os dados poderão ser utilizados
                    para autenticação, gerenciamento de
                    contas, funcionamento das
                    funcionalidades do LeadFlow,
                    controle de acesso, segurança e
                    comunicações relacionadas ao
                    serviço.
                  </p>

                  <h3>
                    4. Segurança das informações
                  </h3>

                  <p>
                    O LeadFlow utiliza controles de
                    acesso para limitar informações de
                    acordo com a empresa, função,
                    equipe, filial e permissões do
                    usuário.
                  </p>

                  <h3>
                    5. Senhas
                  </h3>

                  <p>
                    Senhas não devem ser armazenadas em
                    texto puro. A plataforma utiliza
                    mecanismos de proteção adequados
                    para autenticação dos usuários.
                  </p>

                  <h3>
                    6. Compartilhamento
                  </h3>

                  <p>
                    Os dados não devem ser utilizados
                    ou compartilhados para finalidades
                    incompatíveis com a prestação do
                    serviço, salvo quando necessário
                    para funcionamento da plataforma,
                    prestação de serviços associados ou
                    cumprimento de obrigação legal.
                  </p>

                  <h3>
                    7. Direitos relacionados aos dados
                  </h3>

                  <p>
                    Solicitações relacionadas a dados
                    pessoais poderão ser tratadas de
                    acordo com a legislação aplicável,
                    incluindo a legislação brasileira
                    de proteção de dados.
                  </p>

                  <h3>
                    8. Atualizações desta política
                  </h3>

                  <p>
                    Esta Política de Privacidade poderá
                    ser atualizada conforme a evolução
                    do LeadFlow e das regras aplicáveis
                    ao tratamento de dados.
                  </p>
                </>
              )}
            </div>

            <footer className="lf-modal-footer">
              <Button
                type="button"
                onClick={() =>
                  setLegalModal(null)
                }
              >
                Fechar
              </Button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}