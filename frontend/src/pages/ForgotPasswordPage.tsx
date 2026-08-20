import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Field, Input } from '../components/ui';
import { isStrongPassword, PasswordStrength } from '../components/PasswordStrength';
import { ApiError, authApi } from '../services/api';

type Step = 'email' | 'code' | 'password' | 'success';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(searchParams.get('email')?.trim() ?? '');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expiresInSeconds, setExpiresInSeconds] = useState(900);

  useEffect(() => {
    document.title = 'Recuperar senha • LeadFlow';
  }, []);

  const requestCode = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Informe o e-mail da sua conta.');
      return;
    }

    setBusy(true);

    try {
      const response = await authApi.requestPasswordReset(email.trim());
      setExpiresInSeconds(response.expiresInSeconds);
      setToken('');
      setStep('code');
    } catch (cause) {
      setError((cause as ApiError).message || 'Não foi possível enviar o código de recuperação.');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (token.length !== 6) {
      setError('Digite o código de 6 dígitos enviado para o seu e-mail.');
      return;
    }

    setBusy(true);

    try {
      await authApi.verifyPasswordReset({ email: email.trim(), token });
      setStep('password');
    } catch (cause) {
      setError((cause as ApiError).message || 'O código informado não é válido.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!isStrongPassword(password)) {
      setError('A nova senha ainda não atende a todos os requisitos de segurança.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setBusy(true);

    try {
      await authApi.confirmPasswordReset({
        email: email.trim(),
        token,
        newPassword: password,
      });
      setStep('success');
    } catch (cause) {
      setError((cause as ApiError).message || 'Não foi possível redefinir a senha.');
    } finally {
      setBusy(false);
    }
  };

  const minutes = Math.max(1, Math.ceil(expiresInSeconds / 60));

  return (
    <div className="lf-auth">
      <aside className="lf-auth-brand-panel">
        <div className="lf-auth-brand">
          <span className="lf-brand-mark">LF</span>
          <strong>LeadFlow</strong>
        </div>
        <div>
          <h1>Recupere o acesso à sua conta com segurança.</h1>
          <p>
            Enviaremos um código temporário para o e-mail cadastrado antes de permitir a criação de uma nova senha.
          </p>
        </div>
        <div className="lf-auth-note">Código de uso único • Validação por e-mail • Nova senha protegida</div>
      </aside>

      <main className="lf-auth-form-panel">
        <div className="lf-auth-form">
          <div className="lf-auth-mobile-brand">LeadFlow</div>

          {step === 'email' && (
            <form onSubmit={requestCode} className="lf-reset-form">
              <div>
                <h1>Esqueci minha senha</h1>
                <p>Informe o e-mail usado para entrar no LeadFlow.</p>
              </div>

              {error && <Alert tone="error">{error}</Alert>}

              <Field label="E-mail">
                <Input
                  autoFocus
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com.br"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>

              <Button type="submit" size="lg" disabled={busy}>
                {busy ? 'Enviando...' : 'Enviar código por e-mail'}
              </Button>

              <p className="lf-auth-switch">
                Lembrou sua senha? <Link to="/login">Voltar para o login</Link>
              </p>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={verifyCode} className="lf-reset-form">
              <div>
                <h1>Confirme o código</h1>
                <p>Digite o código de 6 dígitos enviado para {email}.</p>
              </div>

              <Alert tone="info">
                Se houver uma conta ativa com esse e-mail, o código será enviado e ficará válido por aproximadamente {minutes} minutos.
              </Alert>

              {error && <Alert tone="error">{error}</Alert>}

              <Field label="Código de confirmação">
                <Input
                  autoFocus
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={token}
                  onChange={(event) => setToken(event.target.value.replace(/\D/g, ''))}
                />
              </Field>

              <Button type="submit" size="lg" disabled={busy || token.length !== 6}>
                {busy ? 'Validando...' : 'Confirmar código'}
              </Button>

              <div className="lf-auth-row">
                <button
                  type="button"
                  className="lf-link"
                  disabled={busy}
                  onClick={() => void requestCode()}
                >
                  Reenviar código
                </button>
                <button
                  type="button"
                  className="lf-link"
                  disabled={busy}
                  onClick={() => {
                    setError('');
                    setStep('email');
                  }}
                >
                  Alterar e-mail
                </button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={savePassword} className="lf-reset-form">
              <div>
                <h1>Crie uma nova senha</h1>
                <p>O código foi confirmado. Agora defina a nova senha da conta.</p>
              </div>

              {error && <Alert tone="error">{error}</Alert>}

              <Field label="Nova senha">
                <>
                  <Input
                    autoFocus
                    required
                    minLength={8}
                    maxLength={72}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <PasswordStrength value={password} />
                </>
              </Field>

              <Field label="Confirmar nova senha">
                <Input
                  required
                  minLength={8}
                  maxLength={72}
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </Field>

              {confirmPassword && password !== confirmPassword && (
                <span className="lf-password-match lf-password-match-error">As senhas ainda não coincidem.</span>
              )}
              {confirmPassword && password === confirmPassword && (
                <span className="lf-password-match lf-password-match-ok">As senhas coincidem.</span>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={busy || !isStrongPassword(password) || password !== confirmPassword}
              >
                {busy ? 'Salvando...' : 'Cadastrar nova senha'}
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="lf-reset-form">
              <div>
                <h1>Senha redefinida</h1>
                <p>Sua nova senha já pode ser usada para acessar o LeadFlow.</p>
              </div>
              <Alert>Senha alterada com sucesso.</Alert>
              <Button size="lg" onClick={() => navigate('/login', { replace: true })}>
                Entrar no LeadFlow
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
