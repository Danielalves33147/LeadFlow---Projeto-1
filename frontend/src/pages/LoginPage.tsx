import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { ApiError } from '../services/api';
import { Alert, Button, Field, Input } from '../components/ui';
import type { UserRole } from '../types';

function homeFor(role: UserRole) {
  return role === 'SELLER' ? '/leads' : '/dashboard';
}

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Entrar • LeadFlow';
  }, []);

  if (!loading && user) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const loggedUser = await login(email, password, remember);
      navigate(homeFor(loggedUser.role), { replace: true });
    } catch (cause) {
      setPassword('');
      setError((cause as ApiError).message || 'E-mail ou senha inválidos.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lf-auth">
      <aside className="lf-auth-brand-panel">
        <div className="lf-auth-brand">
          <span className="lf-brand-mark">LF</span>
          <strong>LeadFlow</strong>
        </div>
        <div>
          <h1>Gestão comercial com clareza para cada decisão.</h1>
          <p>Leads, equipes, atividades e desempenho em um fluxo operacional único.</p>
        </div>
        <div className="lf-auth-note">
          CRM B2B • Operação multi-filial • Gestão orientada por dados
        </div>
      </aside>

      <main className="lf-auth-form-panel">
        <form className="lf-auth-form" onSubmit={submit}>
          <div className="lf-auth-mobile-brand">LeadFlow</div>
          <div>
            <h1>Acesse sua conta</h1>
            <p>Entre com suas credenciais para continuar.</p>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <Field label="E-mail">
            <Input
              autoFocus
              autoComplete="email"
              type="email"
              required
              value={email}
              placeholder="voce@empresa.com.br"
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field label="Senha">
            <div className="lf-password-wrap">
              <Input
                autoComplete="current-password"
                type={show ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="lf-password-toggle"
                onClick={() => setShow((current) => !current)}
              >
                {show ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </Field>

          <div className="lf-auth-row">
            <label className="lf-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Manter conectado
            </label>
            <Link
              className="lf-link"
              to={`/esqueci-senha${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`}
            >
              Esqueci minha senha
            </Link>
          </div>

          <Button size="lg" type="submit" disabled={busy}>
            {busy ? 'Entrando...' : 'Entrar'}
          </Button>

          <div className="lf-demo-box">
            <strong>Acessos de demonstração</strong>
            <button
              type="button"
              onClick={() => {
                setEmail('administrador@leadflow.com.br');
                setPassword('LeadFlow123!');
              }}
            >
              Administrador
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('gerente@leadflow.com.br');
                setPassword('LeadFlow123!');
              }}
            >
              Gerente
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('vendedor@leadflow.com.br');
                setPassword('LeadFlow123!');
              }}
            >
              Vendedor
            </button>
          </div>

          <p className="lf-auth-switch">
            Ainda não possui uma conta? <Link to="/cadastro">Criar uma conta</Link>
          </p>
          <div className="lf-auth-legal">
            Ao continuar, você declara ciência dos Termos de Uso e da Política de Privacidade.
          </div>
        </form>
      </main>
    </div>
  );
}
